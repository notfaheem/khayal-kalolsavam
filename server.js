const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const crypto = require('crypto');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'khayal-kalolsavam-secret-key-2026';

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const uploadDir = isServerless ? path.join('/tmp', 'uploads', 'results') : path.join(__dirname, 'uploads', 'results');
if (!fs.existsSync(uploadDir)) {
  try { fs.mkdirSync(uploadDir, { recursive: true }); } catch (e) {}
}

// Stateless cryptographic admin JWT token using HMAC-SHA256 (works across all serverless lambda instances)
function generateToken() {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // Valid for 7 days
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', ADMIN_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function isValidToken(token) {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [header, payload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', ADMIN_SECRET).update(`${header}.${payload}`).digest('base64url');
  if (signature !== expectedSignature) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && Date.now() > data.exp) return false;
    return data.role === 'admin';
  } catch (e) {
    return false;
  }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const item = db.getItemById(req.params.id);
    const itemCode = item ? item.itemCode : 'result';
    const timestamp = Date.now();
    const safeOriginal = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `result_${itemCode}_${safeOriginal}_${timestamp}.pdf`);
  }
});

// File filter: Only PDF
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
  fileFilter: fileFilter
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// Serve PDF results with inline preview header
app.use('/uploads/results', (req, res, next) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline');
  next();
}, express.static(uploadDir));

// Admin authentication middleware
const requireAdmin = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : req.headers['x-admin-token'];

  if (!isValidToken(token)) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin session expired or invalid.' });
  }
  next();
};

/* ----------------------------------------------------
   PUBLIC API ROUTES
---------------------------------------------------- */

// Get festival config
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    data: db.getConfig()
  });
});

// Get festival statistics
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get items (with filtering and search)
app.get('/api/items', (req, res) => {
  try {
    const { category, status, search } = req.query;
    const items = db.getItems({ category, status, search });
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get single item by ID or Code
app.get('/api/items/:id', (req, res) => {
  const item = db.getItemById(req.params.id) || db.getItemByCode(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }
  res.json({ success: true, data: item });
});

/* ----------------------------------------------------
   ADMIN AUTHENTICATION ROUTES
---------------------------------------------------- */

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }

  if (db.verifyPassword(password)) {
    const token = generateToken();
    return res.json({
      success: true,
      message: 'Login successful',
      token: token
    });
  } else {
    return res.status(401).json({ success: false, error: 'Incorrect password' });
  }
});

// Verify Admin Token
app.get('/api/admin/verify', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Token is valid' });
});

// Change Admin Password
app.post('/api/admin/change-password', requireAdmin, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    db.changePassword(currentPassword, newPassword);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Admin Logout
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

/* ----------------------------------------------------
   ADMIN ITEM MANAGEMENT ROUTES
---------------------------------------------------- */

// Add new item
app.post('/api/admin/items', requireAdmin, (req, res) => {
  try {
    const newItem = db.addItem(req.body);
    res.status(201).json({ success: true, message: 'Item created successfully', data: newItem });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Update item details
app.put('/api/admin/items/:id', requireAdmin, (req, res) => {
  try {
    const updated = db.updateItem(req.params.id, req.body);
    res.json({ success: true, message: 'Item updated successfully', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Delete an item
app.delete('/api/admin/items/:id', requireAdmin, (req, res) => {
  try {
    const item = db.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    // If item has a result PDF, remove the file from storage
    if (item.resultPdf && item.resultPdf.filename) {
      const filePath = path.join(uploadDir, item.resultPdf.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Error deleting file:', e); }
      }
    }

    const deleted = db.deleteItem(req.params.id);
    res.json({ success: true, message: `Item "${deleted.itemName}" deleted successfully`, data: deleted });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Upload PDF Result for an item
app.post('/api/admin/items/:id/upload', requireAdmin, (req, res) => {
  const item = db.getItemById(req.params.id);
  if (!item) {
    return res.status(404).json({ success: false, error: 'Item not found' });
  }

  upload.single('resultPdf')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file was uploaded' });
    }

    // If item already had an older PDF, remove old file
    if (item.resultPdf && item.resultPdf.filename && item.resultPdf.filename !== req.file.filename) {
      const oldFilePath = path.join(uploadDir, item.resultPdf.filename);
      if (fs.existsSync(oldFilePath)) {
        try { fs.unlinkSync(oldFilePath); } catch (e) { console.error('Error removing old PDF:', e); }
      }
    }

    const updatedItem = db.attachResult(req.params.id, req.file);
    res.json({
      success: true,
      message: `Result for "${updatedItem.itemName}" published successfully!`,
      data: updatedItem
    });
  });
});

// Delete/Remove PDF Result from an item
app.delete('/api/admin/items/:id/result', requireAdmin, (req, res) => {
  try {
    const item = db.getItemById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Item not found' });
    }

    if (item.resultPdf && item.resultPdf.filename) {
      const filePath = path.join(uploadDir, item.resultPdf.filename);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) { console.error('Error deleting result file:', e); }
      }
    }

    const result = db.removeResult(req.params.id);
    res.json({
      success: true,
      message: `Result for "${item.itemName}" removed successfully.`,
      data: result.item
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Restore default items
app.post('/api/admin/reset-defaults', requireAdmin, (req, res) => {
  try {
    const items = db.resetToDefaults();
    res.json({ success: true, message: 'All 38 items reset to initial list.', data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Export Database JSON
app.get('/api/admin/export', requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename="khayal_kalolsavam_backup.json"');
  res.send(JSON.stringify(db.data, null, 2));
});

// Admin page route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, error: 'API route not found' });
});

// Fallback to index.html for client-side navigation
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`✨ GHSS ERANHIMANGAD - ഖയാൽ 2K26 Kalolsavam Portal`);
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
  console.log(`🔒 Admin portal at:   http://localhost:${PORT}/admin`);
  console.log(`Default admin password: admin123`);
  console.log(`===============================================`);
});
