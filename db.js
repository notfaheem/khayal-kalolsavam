const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const defaultItems = require('./data/defaultItems');

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const DATA_DIR = isServerless ? path.join('/tmp', 'data') : path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'database.json');
const BUNDLED_DB_PATH = path.join(__dirname, 'data', 'database.json');

// Helper to hash password
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

class Database {
  constructor() {
    this.data = {
      config: {
        schoolName: "GHSS ERANHIMANGAD",
        festivalName: "ഖയാൽ 2K26",
        subTitle: "കേരള സ്കൂൾ കലോത്സവം 2026-27",
        dates: "സെപ്തംബർ 28, 29 (തിങ്കൾ, ചൊവ്വ)"
      },
      admin: {
        // Default password: admin123
        passwordHash: hashPassword('admin123')
      },
      items: []
    };
    this.init();
  }

  init() {
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
    }

    // Try reading existing DB file
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileContent = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
        if (!this.data.items || !Array.isArray(this.data.items)) {
          this.data.items = JSON.parse(JSON.stringify(defaultItems));
          this.save();
        }
        return;
      } catch (err) {
        console.error('Error reading primary database:', err);
      }
    }

    // If on serverless and bundled database.json exists, copy from bundle
    if (fs.existsSync(BUNDLED_DB_PATH)) {
      try {
        const bundledContent = fs.readFileSync(BUNDLED_DB_PATH, 'utf-8');
        this.data = JSON.parse(bundledContent);
        this.save();
        return;
      } catch (err) {
        console.error('Error reading bundled database:', err);
      }
    }

    // Default initialization
    this.data.items = JSON.parse(JSON.stringify(defaultItems));
    this.save();
    console.log('Initialized new database with default items.');
  }

  save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) {}
      }
      const tempPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_PATH);
    } catch (err) {
      console.error('Error saving database to primary path:', err.message);
      // Fallback to /tmp if primary failed (read-only filesystem)
      if (!isServerless) {
        try {
          const fallbackDir = path.join('/tmp', 'data');
          if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
          fs.writeFileSync(path.join(fallbackDir, 'database.json'), JSON.stringify(this.data, null, 2), 'utf-8');
        } catch (e) {}
      }
    }
  }

  getConfig() {
    return this.data.config;
  }

  getItems(filters = {}) {
    let list = [...this.data.items];

    if (filters.category && filters.category !== 'all') {
      list = list.filter(item => item.category === filters.category);
    }

    if (filters.status === 'published') {
      list = list.filter(item => item.hasResult);
    } else if (filters.status === 'pending') {
      list = list.filter(item => !item.hasResult);
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(item => 
        (item.itemCode && item.itemCode.toLowerCase().includes(q)) ||
        (item.itemName && item.itemName.toLowerCase().includes(q)) ||
        (item.itemNameMl && item.itemNameMl.includes(q))
      );
    }

    // Default sort: Numeric itemCode
    list.sort((a, b) => {
      const codeA = parseInt(a.itemCode, 10) || 0;
      const codeB = parseInt(b.itemCode, 10) || 0;
      return codeA - codeB;
    });

    return list;
  }

  getItemById(id) {
    return this.data.items.find(item => item.id === id) || null;
  }

  getItemByCode(code) {
    return this.data.items.find(item => String(item.itemCode).trim() === String(code).trim()) || null;
  }

  addItem(itemData) {
    const itemCode = String(itemData.itemCode || '').trim();
    if (!itemCode) {
      throw new Error('Item code is required.');
    }
    if (!itemData.itemName) {
      throw new Error('Item name is required.');
    }

    const existing = this.getItemByCode(itemCode);
    if (existing) {
      throw new Error(`Item with code ${itemCode} already exists (${existing.itemName}).`);
    }

    const newItem = {
      id: `item_${itemCode}_${Date.now()}`,
      itemCode: itemCode,
      itemName: itemData.itemName.trim(),
      itemNameMl: (itemData.itemNameMl || '').trim(),
      category: itemData.category === 'HS Arabic' ? 'HS Arabic' : 'HS General',
      participants: parseInt(itemData.participants, 10) || 1,
      hasResult: false,
      resultPdf: null,
      publishedAt: null,
      createdAt: new Date().toISOString()
    };

    this.data.items.push(newItem);
    this.save();
    return newItem;
  }

  updateItem(id, updates) {
    const item = this.getItemById(id);
    if (!item) {
      throw new Error('Item not found.');
    }

    if (updates.itemCode !== undefined) {
      const code = String(updates.itemCode).trim();
      const existing = this.getItemByCode(code);
      if (existing && existing.id !== id) {
        throw new Error(`Item with code ${code} already exists.`);
      }
      item.itemCode = code;
    }

    if (updates.itemName !== undefined) {
      item.itemName = updates.itemName.trim();
    }
    if (updates.itemNameMl !== undefined) {
      item.itemNameMl = updates.itemNameMl.trim();
    }
    if (updates.category !== undefined) {
      item.category = updates.category === 'HS Arabic' ? 'HS Arabic' : 'HS General';
    }
    if (updates.participants !== undefined) {
      item.participants = parseInt(updates.participants, 10) || 1;
    }

    item.updatedAt = new Date().toISOString();
    this.save();
    return item;
  }

  deleteItem(id) {
    const index = this.data.items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error('Item not found.');
    }

    const removed = this.data.items.splice(index, 1)[0];
    this.save();
    return removed;
  }

  attachResult(id, fileInfo) {
    const item = this.getItemById(id);
    if (!item) {
      throw new Error('Item not found.');
    }

    item.hasResult = true;
    item.resultPdf = {
      filename: fileInfo.filename,
      originalName: fileInfo.originalname,
      size: fileInfo.size,
      mimetype: fileInfo.mimetype,
      url: `/uploads/results/${fileInfo.filename}`
    };
    item.publishedAt = new Date().toISOString();

    this.save();
    return item;
  }

  removeResult(id) {
    const item = this.getItemById(id);
    if (!item) {
      throw new Error('Item not found.');
    }

    const oldResult = item.resultPdf;
    item.hasResult = false;
    item.resultPdf = null;
    item.publishedAt = null;

    this.save();
    return { item, oldResult };
  }

  getStats() {
    const total = this.data.items.length;
    const published = this.data.items.filter(i => i.hasResult).length;
    const pending = total - published;
    const generalTotal = this.data.items.filter(i => i.category === 'HS General').length;
    const generalPublished = this.data.items.filter(i => i.category === 'HS General' && i.hasResult).length;
    const arabicTotal = this.data.items.filter(i => i.category === 'HS Arabic').length;
    const arabicPublished = this.data.items.filter(i => i.category === 'HS Arabic' && i.hasResult).length;

    return {
      total,
      published,
      pending,
      generalTotal,
      generalPublished,
      arabicTotal,
      arabicPublished,
      publishPercentage: total > 0 ? Math.round((published / total) * 100) : 0
    };
  }

  verifyPassword(inputPassword) {
    if (!inputPassword) return false;
    const inputHash = hashPassword(inputPassword);
    return inputHash === this.data.admin.passwordHash;
  }

  changePassword(oldPassword, newPassword) {
    if (!this.verifyPassword(oldPassword)) {
      throw new Error('Current password is incorrect.');
    }
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters.');
    }
    this.data.admin.passwordHash = hashPassword(newPassword);
    this.save();
    return true;
  }

  resetToDefaults() {
    this.data.items = JSON.parse(JSON.stringify(defaultItems));
    this.save();
    return this.data.items;
  }
}

module.exports = new Database();
