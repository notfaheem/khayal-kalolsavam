// Khayal 2K26 - Admin Portal Logic
document.addEventListener('DOMContentLoaded', () => {
  let adminToken = localStorage.getItem('khayal_admin_token') || '';
  let itemsList = [];
  let currentCategory = 'all';
  let currentSearch = '';

  // Auth Sections
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('login-form');
  const adminPasswordInput = document.getElementById('admin-password');
  const adminLogoutBtn = document.getElementById('admin-logout-btn');

  // Stats Elements
  const adminStatTotal = document.getElementById('admin-stat-total');
  const adminStatPublished = document.getElementById('admin-stat-published');
  const adminStatPending = document.getElementById('admin-stat-pending');
  const adminStatRate = document.getElementById('admin-stat-rate');
  const adminBadgeAll = document.getElementById('admin-badge-all');
  const adminBadgeGeneral = document.getElementById('admin-badge-general');
  const adminBadgeArabic = document.getElementById('admin-badge-arabic');
  const adminBadgePublished = document.getElementById('admin-badge-published');

  // Filter & Search
  const adminSearchInput = document.getElementById('admin-search-input');
  const adminFilterTabs = document.querySelectorAll('.filter-tabs .tab-btn');
  const adminTableBody = document.getElementById('admin-items-table-body');

  // Item Modal Elements
  const itemModal = document.getElementById('item-modal');
  const itemModalTitle = document.getElementById('item-modal-title');
  const itemForm = document.getElementById('item-form');
  const itemIdHidden = document.getElementById('item-id-hidden');
  const itemCodeInput = document.getElementById('item-code-input');
  const itemNameInput = document.getElementById('item-name-input');
  const itemNameMlInput = document.getElementById('item-nameml-input');
  const itemCategorySelect = document.getElementById('item-category-select');
  const itemParticipantsInput = document.getElementById('item-participants-input');
  const openAddItemBtn = document.getElementById('open-add-item-modal-btn');
  const itemModalCloseBtn = document.getElementById('item-modal-close-btn');
  const itemModalCancelBtn = document.getElementById('item-modal-cancel-btn');

  // Upload Modal Elements
  const uploadModal = document.getElementById('upload-modal');
  const uploadForm = document.getElementById('upload-form');
  const uploadItemIdHidden = document.getElementById('upload-item-id-hidden');
  const uploadModalItemInfo = document.getElementById('upload-modal-item-info');
  const fileDropzone = document.getElementById('file-dropzone');
  const pdfFileInput = document.getElementById('pdf-file-input');
  const selectedFileDisplay = document.getElementById('selected-file-display');
  const selectedFileName = document.getElementById('selected-filename');
  const selectedFileSize = document.getElementById('selected-filesize');
  const uploadModalCloseBtn = document.getElementById('upload-modal-close-btn');
  const uploadModalCancelBtn = document.getElementById('upload-modal-cancel-btn');
  const uploadSubmitBtn = document.getElementById('upload-submit-btn');

  // Settings Modal Elements
  const settingsModal = document.getElementById('settings-modal');
  const openSettingsBtn = document.getElementById('open-settings-modal-btn');
  const settingsModalCloseBtn = document.getElementById('settings-modal-close-btn');
  const settingsCloseBtn = document.getElementById('settings-close-btn');
  const changePasswordForm = document.getElementById('change-password-form');
  const currPasswordInput = document.getElementById('curr-password');
  const newPasswordInput = document.getElementById('new-password');
  const resetDefaultsBtn = document.getElementById('reset-defaults-btn');
  const backupBtn = document.getElementById('backup-btn');
  const uploadBackupTriggerBtn = document.getElementById('upload-backup-trigger-btn');
  const backupFileInput = document.getElementById('backup-file-input');

  // Bulk Upload Elements
  const openBulkUploadBtn = document.getElementById('open-bulk-upload-modal-btn');
  const bulkUploadModal = document.getElementById('bulk-upload-modal');
  const bulkUploadModalCloseBtn = document.getElementById('bulk-upload-modal-close-btn');
  const bulkUploadModalCancelBtn = document.getElementById('bulk-upload-modal-cancel-btn');
  const bulkUploadForm = document.getElementById('bulk-upload-form');
  const bulkFileDropzone = document.getElementById('bulk-file-dropzone');
  const bulkPdfFilesInput = document.getElementById('bulk-pdf-files-input');
  const bulkPreviewContainer = document.getElementById('bulk-preview-container');
  const bulkSelectionSummary = document.getElementById('bulk-selection-summary');
  const bulkFilesList = document.getElementById('bulk-files-list');
  const bulkClearFilesBtn = document.getElementById('bulk-clear-files-btn');
  const bulkUploadSubmitBtn = document.getElementById('bulk-upload-submit-btn');
  const bulkUploadResultReport = document.getElementById('bulk-upload-result-report');

  let selectedBulkFiles = [];

  // Toasts
  const toastContainer = document.getElementById('toast-container');

  // Initial Auth Check
  if (adminToken) {
    verifyTokenAndInit();
  } else {
    showLoginView();
  }

  // --- Authentication Handlers ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = adminPasswordInput.value.trim();
    if (!password) return;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        adminToken = data.token;
        localStorage.setItem('khayal_admin_token', adminToken);
        showDashboardView();
        showToast('Login successful!', 'success');
        adminPasswordInput.value = '';
      } else {
        showToast(data.error || 'Invalid password', 'error');
      }
    } catch (err) {
      showToast('Network error during login', 'error');
    }
  });

  adminLogoutBtn.addEventListener('click', async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
    } catch (e) {}

    adminToken = '';
    localStorage.removeItem('khayal_admin_token');
    showLoginView();
    showToast('Logged out successfully', 'success');
  });

  async function verifyTokenAndInit() {
    try {
      const res = await fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await res.json();
      if (data.success) {
        showDashboardView();
      } else {
        adminToken = '';
        localStorage.removeItem('khayal_admin_token');
        showLoginView();
      }
    } catch (err) {
      showLoginView();
    }
  }

  function showLoginView() {
    loginSection.style.display = 'block';
    dashboardSection.style.display = 'none';
    adminLogoutBtn.style.display = 'none';
  }

  function showDashboardView() {
    loginSection.style.display = 'none';
    dashboardSection.style.display = 'block';
    adminLogoutBtn.style.display = 'inline-flex';
    loadAdminStats();
    loadAdminItems();
  }

  // --- Stats & Items Data Fetching ---
  async function loadAdminStats() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        const s = json.data;
        adminStatTotal.textContent = s.total;
        adminStatPublished.textContent = s.published;
        adminStatPending.textContent = s.pending;
        adminStatRate.textContent = `${s.publishPercentage}%`;

        adminBadgeAll.textContent = s.total;
        adminBadgeGeneral.textContent = s.generalTotal;
        adminBadgeArabic.textContent = s.arabicTotal;
        adminBadgePublished.textContent = s.published;
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    }
  }

  async function loadAdminItems() {
    try {
      const res = await fetch('/api/items');
      const json = await res.json();
      if (json.success) {
        itemsList = json.data;
        renderAdminTable();
      }
    } catch (err) {
      showToast('Error loading items list', 'error');
    }
  }

  // Search & Filter Events
  adminSearchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    renderAdminTable();
  });

  adminFilterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      adminFilterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      renderAdminTable();
    });
  });

  // Render Table
  function renderAdminTable() {
    let filtered = [...itemsList];

    if (currentCategory === 'HS General') {
      filtered = filtered.filter(i => i.category === 'HS General');
    } else if (currentCategory === 'HS Arabic') {
      filtered = filtered.filter(i => i.category === 'HS Arabic');
    } else if (currentCategory === 'published') {
      filtered = filtered.filter(i => i.hasResult);
    } else if (currentCategory === 'pending') {
      filtered = filtered.filter(i => !i.hasResult);
    }

    if (currentSearch) {
      filtered = filtered.filter(i => {
        const code = String(i.itemCode || '').toLowerCase();
        const en = String(i.itemName || '').toLowerCase();
        const ml = String(i.itemNameMl || '');
        return code.includes(currentSearch) || en.includes(currentSearch) || ml.includes(currentSearch);
      });
    }

    if (filtered.length === 0) {
      adminTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; padding: 2.5rem; color: #64748b;">
            No items found matching the selected filter or search.
          </td>
        </tr>
      `;
      return;
    }

    adminTableBody.innerHTML = filtered.map(item => {
      const isArabic = item.category === 'HS Arabic';
      const hasResult = item.hasResult && item.resultPdf;

      return `
        <tr data-id="${item.id}">
          <td>
            <span class="item-code-badge">#${escapeHtml(item.itemCode)}</span>
          </td>
          <td>
            <div style="font-weight: 700; color: #0f172a;">${escapeHtml(item.itemName)}</div>
            ${item.itemNameMl ? `<div class="font-ml" style="font-size: 0.84rem; color: #b45309;">${escapeHtml(item.itemNameMl)}</div>` : ''}
          </td>
          <td>
            <span class="item-category-pill ${isArabic ? 'arabic' : 'general'}">
              ${escapeHtml(item.category)}
            </span>
          </td>
          <td>
            <span style="font-size: 0.85rem; font-weight: 600; color: #475569;">
              👥 ${item.participants}
            </span>
          </td>
          <td>
            ${hasResult ? `
              <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <span class="badge-pill-status" style="background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">
                  ✓ Published
                </span>
                <a href="${item.resultPdf.url}" target="_blank" class="btn btn-outline btn-sm" title="View PDF" style="padding: 4px 8px; font-size: 0.78rem;">
                  👁️ View
                </a>
                <button class="btn btn-subtle btn-sm btn-upload-result" data-id="${item.id}" title="Replace PDF" style="padding: 4px 8px; font-size: 0.78rem;">
                  🔄 Replace
                </button>
                <button class="btn btn-subtle btn-sm btn-remove-result" data-id="${item.id}" title="Remove PDF" style="padding: 4px 8px; font-size: 0.78rem; color: #ef4444;">
                  🗑️
                </button>
              </div>
            ` : `
              <button class="btn btn-primary btn-sm btn-upload-result" data-id="${item.id}" style="padding: 5px 12px; font-size: 0.8rem;">
                <span>📤 Upload PDF</span>
              </button>
            `}
          </td>
          <td style="text-align: right;">
            <div class="action-cell" style="justify-content: flex-end;">
              <button class="btn btn-outline btn-sm btn-edit-item" data-id="${item.id}" title="Edit Item Details" style="padding: 5px 10px;">
                ✏️ Edit
              </button>
              <button class="btn btn-subtle btn-sm btn-delete-item" data-id="${item.id}" title="Delete Item" style="padding: 5px 10px; color: #ef4444;">
                ❌
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach Event Listeners to rows
    attachTableEventListeners();
  }

  function attachTableEventListeners() {
    // Upload / Replace PDF
    adminTableBody.querySelectorAll('.btn-upload-result').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = itemsList.find(i => i.id === id);
        if (item) openUploadModal(item);
      });
    });

    // Remove PDF Result
    adminTableBody.querySelectorAll('.btn-remove-result').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const item = itemsList.find(i => i.id === id);
        if (!item) return;

        if (confirm(`Are you sure you want to remove the result PDF for "${item.itemName}"?`)) {
          try {
            const res = await fetch(`/api/admin/items/${id}/result`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const data = await res.json();
            if (data.success) {
              showToast('Result PDF removed successfully', 'success');
              loadAdminStats();
              loadAdminItems();
            } else {
              showToast(data.error || 'Failed to remove result', 'error');
            }
          } catch (err) {
            showToast('Error removing result', 'error');
          }
        }
      });
    });

    // Edit Item Details
    adminTableBody.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const item = itemsList.find(i => i.id === id);
        if (item) openEditItemModal(item);
      });
    });

    // Delete Item
    adminTableBody.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.dataset.id;
        const item = itemsList.find(i => i.id === id);
        if (!item) return;

        if (confirm(`WARNING: Are you sure you want to permanently delete item "${item.itemCode} - ${item.itemName}"?`)) {
          try {
            const res = await fetch(`/api/admin/items/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const data = await res.json();
            if (data.success) {
              showToast(`Item #${item.itemCode} deleted`, 'success');
              loadAdminStats();
              loadAdminItems();
            } else {
              showToast(data.error || 'Failed to delete item', 'error');
            }
          } catch (err) {
            showToast('Error deleting item', 'error');
          }
        }
      });
    });
  }

  // --- ADD / EDIT ITEM MODAL ---
  openAddItemBtn.addEventListener('click', () => {
    itemModalTitle.textContent = 'Add New Item';
    itemIdHidden.value = '';
    itemCodeInput.value = '';
    itemNameInput.value = '';
    itemNameMlInput.value = '';
    itemCategorySelect.value = 'HS General';
    itemParticipantsInput.value = '1';

    itemModal.classList.add('active');
    itemCodeInput.focus();
  });

  function openEditItemModal(item) {
    itemModalTitle.textContent = `Edit Item #${item.itemCode}`;
    itemIdHidden.value = item.id;
    itemCodeInput.value = item.itemCode || '';
    itemNameInput.value = item.itemName || '';
    itemNameMlInput.value = item.itemNameMl || '';
    itemCategorySelect.value = item.category || 'HS General';
    itemParticipantsInput.value = item.participants || 1;

    itemModal.classList.add('active');
    itemNameInput.focus();
  }

  function closeItemModal() {
    itemModal.classList.remove('active');
  }

  itemModalCloseBtn.addEventListener('click', closeItemModal);
  itemModalCancelBtn.addEventListener('click', closeItemModal);

  itemForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = itemIdHidden.value;
    const itemData = {
      itemCode: itemCodeInput.value.trim(),
      itemName: itemNameInput.value.trim(),
      itemNameMl: itemNameMlInput.value.trim(),
      category: itemCategorySelect.value,
      participants: parseInt(itemParticipantsInput.value, 10) || 1
    };

    try {
      const url = id ? `/api/admin/items/${id}` : '/api/admin/items';
      const method = id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(itemData)
      });
      const data = await res.json();

      if (data.success) {
        showToast(id ? 'Item updated successfully!' : 'Item added successfully!', 'success');
        closeItemModal();
        loadAdminStats();
        loadAdminItems();
      } else {
        showToast(data.error || 'Failed to save item', 'error');
      }
    } catch (err) {
      showToast('Error saving item', 'error');
    }
  });

  // --- UPLOAD PDF MODAL & FILE HANDLING ---
  function openUploadModal(item) {
    uploadItemIdHidden.value = item.id;
    uploadModalItemInfo.textContent = `#${item.itemCode} - ${item.itemName} (${item.category})`;
    pdfFileInput.value = '';
    selectedFileDisplay.style.display = 'none';
    uploadSubmitBtn.disabled = true;
    uploadSubmitBtn.innerHTML = '<span>Upload &amp; Publish</span>';

    uploadModal.classList.add('active');
  }

  function closeUploadModal() {
    uploadModal.classList.remove('active');
    pdfFileInput.value = '';
    selectedFileDisplay.style.display = 'none';
  }

  uploadModalCloseBtn.addEventListener('click', closeUploadModal);
  uploadModalCancelBtn.addEventListener('click', closeUploadModal);

  fileDropzone.addEventListener('click', () => {
    pdfFileInput.click();
  });

  fileDropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDropzone.classList.add('dragover');
  });

  fileDropzone.addEventListener('dragleave', () => {
    fileDropzone.classList.remove('dragover');
  });

  fileDropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  pdfFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  });

  function handleFileSelected(file) {
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      showToast('Please select a valid PDF file!', 'error');
      return;
    }

    selectedFileName.textContent = file.name;
    selectedFileSize.textContent = formatBytes(file.size);
    selectedFileDisplay.style.display = 'block';
    uploadSubmitBtn.disabled = false;
  }

  uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const itemId = uploadItemIdHidden.value;
    const file = pdfFileInput.files[0];
    if (!file || !itemId) {
      showToast('Please select a PDF file first', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('resultPdf', file);

    uploadSubmitBtn.disabled = true;
    uploadSubmitBtn.innerHTML = '<span class="spinner"></span> <span>Uploading...</span>';

    try {
      const res = await fetch(`/api/admin/items/${itemId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        showToast('Result PDF uploaded and published!', 'success');
        closeUploadModal();
        loadAdminStats();
        loadAdminItems();
      } else {
        showToast(data.error || 'Upload failed', 'error');
        uploadSubmitBtn.disabled = false;
        uploadSubmitBtn.innerHTML = '<span>Upload &amp; Publish</span>';
      }
    } catch (err) {
      showToast('Error uploading PDF file', 'error');
      uploadSubmitBtn.disabled = false;
      uploadSubmitBtn.innerHTML = '<span>Upload &amp; Publish</span>';
    }
  });

  // --- BULK UPLOAD MODAL & LOGIC ---
  if (openBulkUploadBtn) {
    openBulkUploadBtn.addEventListener('click', () => {
      openBulkUploadModal();
    });
  }

  function openBulkUploadModal() {
    selectedBulkFiles = [];
    if (bulkPdfFilesInput) bulkPdfFilesInput.value = '';
    if (bulkPreviewContainer) bulkPreviewContainer.style.display = 'none';
    if (bulkUploadResultReport) {
      bulkUploadResultReport.style.display = 'none';
      bulkUploadResultReport.innerHTML = '';
    }
    if (bulkUploadSubmitBtn) {
      bulkUploadSubmitBtn.disabled = true;
      bulkUploadSubmitBtn.onclick = null;
      bulkUploadSubmitBtn.innerHTML = '<span>Upload &amp; Link Results</span>';
    }
    bulkUploadModal.classList.add('active');
  }

  function closeBulkUploadModal() {
    bulkUploadModal.classList.remove('active');
    selectedBulkFiles = [];
    if (bulkPdfFilesInput) bulkPdfFilesInput.value = '';
  }

  if (bulkUploadModalCloseBtn) bulkUploadModalCloseBtn.addEventListener('click', closeBulkUploadModal);
  if (bulkUploadModalCancelBtn) bulkUploadModalCancelBtn.addEventListener('click', closeBulkUploadModal);

  if (bulkFileDropzone) {
    bulkFileDropzone.addEventListener('click', () => {
      bulkPdfFilesInput.click();
    });

    bulkFileDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      bulkFileDropzone.classList.add('dragover');
    });

    bulkFileDropzone.addEventListener('dragleave', () => {
      bulkFileDropzone.classList.remove('dragover');
    });

    bulkFileDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      bulkFileDropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addBulkFiles(Array.from(e.dataTransfer.files));
      }
    });
  }

  if (bulkPdfFilesInput) {
    bulkPdfFilesInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addBulkFiles(Array.from(e.target.files));
      }
    });
  }

  if (bulkClearFilesBtn) {
    bulkClearFilesBtn.addEventListener('click', () => {
      selectedBulkFiles = [];
      bulkPdfFilesInput.value = '';
      updateBulkPreview();
    });
  }

  function addBulkFiles(files) {
    let pdfCount = 0;
    files.forEach(file => {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        // Prevent duplicate file names in selection
        if (!selectedBulkFiles.some(f => f.name === file.name)) {
          selectedBulkFiles.push(file);
          pdfCount++;
        }
      }
    });

    if (pdfCount === 0 && files.length > 0) {
      showToast('Only PDF files (.pdf) are supported.', 'error');
    }

    updateBulkPreview();
  }

  // Matching helper function
  function findMatchingItem(filename) {
    if (!filename || !itemsList || itemsList.length === 0) return null;
    const base = filename.replace(/\.pdf$/i, '').trim();

    // 1. Exact match with itemCode
    let item = itemsList.find(i => String(i.itemCode).trim().toLowerCase() === base.toLowerCase());
    if (item) return item;

    // 2. Starts with digits (e.g. 601_Chithra, 601-pencil)
    const leadingDigits = base.match(/^(\d+)/);
    if (leadingDigits) {
      item = itemsList.find(i => String(i.itemCode).trim() === leadingDigits[1]);
      if (item) return item;
    }

    // 3. Contains pattern like item_601, code601, #601
    const prefixMatch = base.match(/(?:item|code|#)[_\-\s]*(\d+)/i);
    if (prefixMatch) {
      item = itemsList.find(i => String(i.itemCode).trim() === prefixMatch[1]);
      if (item) return item;
    }

    // 4. Any numbers group in filename that matches an item code
    const allNums = base.match(/\d+/g);
    if (allNums) {
      for (const num of allNums) {
        item = itemsList.find(i => String(i.itemCode).trim() === num);
        if (item) return item;
      }
    }

    return null;
  }

  function updateBulkPreview() {
    if (selectedBulkFiles.length === 0) {
      bulkPreviewContainer.style.display = 'none';
      bulkUploadSubmitBtn.disabled = true;
      bulkUploadSubmitBtn.innerHTML = '<span>Upload &amp; Link Results</span>';
      return;
    }

    bulkPreviewContainer.style.display = 'block';
    if (bulkUploadResultReport) {
      bulkUploadResultReport.style.display = 'none';
      bulkUploadResultReport.innerHTML = '';
    }

    let matchedCount = 0;
    let unmatchedCount = 0;

    bulkFilesList.innerHTML = selectedBulkFiles.map((file, index) => {
      const item = findMatchingItem(file.name);
      if (item) {
        matchedCount++;
        return `
          <div class="bulk-file-row matched">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">
              <strong>📄 ${escapeHtml(file.name)}</strong>
              <span style="color: #64748b; font-size: 0.76rem; margin-left: 6px;">(${formatBytes(file.size)})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
              <span class="bulk-badge-matched">✓ #${escapeHtml(item.itemCode)}: ${escapeHtml(item.itemName)}</span>
              <button type="button" class="btn btn-subtle btn-sm btn-remove-bulk-file" data-index="${index}" style="padding: 2px 6px; font-size: 0.72rem; color: #ef4444;" title="Remove this file">&times;</button>
            </div>
          </div>
        `;
      } else {
        unmatchedCount++;
        return `
          <div class="bulk-file-row unmatched">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;">
              <strong>📄 ${escapeHtml(file.name)}</strong>
              <span style="color: #64748b; font-size: 0.76rem; margin-left: 6px;">(${formatBytes(file.size)})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
              <span class="bulk-badge-unmatched">⚠️ No matching code</span>
              <button type="button" class="btn btn-subtle btn-sm btn-remove-bulk-file" data-index="${index}" style="padding: 2px 6px; font-size: 0.72rem; color: #ef4444;" title="Remove this file">&times;</button>
            </div>
          </div>
        `;
      }
    }).join('');

    // Attach individual remove file buttons
    bulkFilesList.querySelectorAll('.btn-remove-bulk-file').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.index, 10);
        selectedBulkFiles.splice(idx, 1);
        updateBulkPreview();
      });
    });

    bulkSelectionSummary.innerHTML = `Selected Files (${selectedBulkFiles.length}) &bull; <span style="color: #10b981; font-weight: 700;">${matchedCount} Matched</span>${unmatchedCount > 0 ? `, <span style="color: #ef4444; font-weight: 700;">${unmatchedCount} Unmatched</span>` : ''}`;

    if (matchedCount > 0) {
      bulkUploadSubmitBtn.disabled = false;
      bulkUploadSubmitBtn.innerHTML = `<span>Upload &amp; Link ${matchedCount} Result${matchedCount > 1 ? 's' : ''}</span>`;
    } else {
      bulkUploadSubmitBtn.disabled = true;
      bulkUploadSubmitBtn.innerHTML = '<span>No Matching Item Codes Found</span>';
    }
  }

  // Handle Bulk Upload Form Submit
  if (bulkUploadForm) {
    bulkUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (selectedBulkFiles.length === 0) {
        showToast('Please select at least one PDF file.', 'error');
        return;
      }

      const formData = new FormData();
      selectedBulkFiles.forEach(file => {
        formData.append('resultPdfs', file);
      });

      bulkUploadSubmitBtn.disabled = true;
      bulkUploadSubmitBtn.innerHTML = `<span class="spinner"></span> <span>Uploading &amp; linking ${selectedBulkFiles.length} file(s)...</span>`;

      try {
        const res = await fetch('/api/admin/bulk-upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          },
          body: formData
        });
        const data = await res.json();

        if (data.success) {
          const s = data.summary;
          bulkUploadResultReport.style.display = 'block';
          bulkUploadResultReport.innerHTML = `
            <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: var(--radius-md); padding: 14px; font-size: 0.85rem; color: #065f46;">
              <h4 style="font-weight: 800; font-size: 0.95rem; margin-bottom: 6px;">🎉 Bulk Upload Completed!</h4>
              <p>Successfully matched and linked <strong>${s.matchedCount}</strong> result PDF(s).</p>
              ${s.unmatchedCount > 0 ? `<p style="color: #b91c1c; margin-top: 4px;">⚠️ <strong>${s.unmatchedCount}</strong> file(s) did not match any item code and were safely skipped.</p>` : ''}
              <div style="margin-top: 10px; max-height: 140px; overflow-y: auto; background: white; border-radius: var(--radius-sm); padding: 8px; border: 1px solid #d1fae5;">
                ${s.matched.map(m => `<div style="font-size: 0.8rem; padding: 2px 0;">✓ <strong>#${escapeHtml(m.itemCode)}</strong> - ${escapeHtml(m.itemName)} <span style="color: #64748b;">(${escapeHtml(m.filename)})</span></div>`).join('')}
              </div>
            </div>
          `;

          showToast(`Successfully linked ${s.matchedCount} results!`, 'success');
          selectedBulkFiles = [];
          if (bulkPdfFilesInput) bulkPdfFilesInput.value = '';
          if (bulkPreviewContainer) bulkPreviewContainer.style.display = 'none';

          bulkUploadSubmitBtn.disabled = false;
          bulkUploadSubmitBtn.innerHTML = '<span>Upload Done! Close</span>';
          bulkUploadSubmitBtn.onclick = (ev) => {
            ev.preventDefault();
            closeBulkUploadModal();
            bulkUploadSubmitBtn.onclick = null;
          };

          loadAdminStats();
          loadAdminItems();
        } else {
          showToast(data.error || 'Bulk upload failed.', 'error');
          bulkUploadSubmitBtn.disabled = false;
          bulkUploadSubmitBtn.innerHTML = '<span>Upload &amp; Link Results</span>';
        }
      } catch (err) {
        showToast('Error uploading files: ' + err.message, 'error');
        bulkUploadSubmitBtn.disabled = false;
        bulkUploadSubmitBtn.innerHTML = '<span>Upload &amp; Link Results</span>';
      }
    });
  }

  // --- SETTINGS MODAL ---
  openSettingsBtn.addEventListener('click', () => {
    currPasswordInput.value = '';
    newPasswordInput.value = '';
    settingsModal.classList.add('active');
  });

  function closeSettingsModal() {
    settingsModal.classList.remove('active');
  }

  settingsModalCloseBtn.addEventListener('click', closeSettingsModal);
  settingsCloseBtn.addEventListener('click', closeSettingsModal);

  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = currPasswordInput.value;
    const newPassword = newPasswordInput.value;

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Password changed successfully!', 'success');
        currPasswordInput.value = '';
        newPasswordInput.value = '';
        closeSettingsModal();
      } else {
        showToast(data.error || 'Failed to change password', 'error');
      }
    } catch (err) {
      showToast('Error changing password', 'error');
    }
  });

  // Backup Download with auth
  backupBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/export', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `khayal_backup_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast('Backup JSON downloaded successfully!', 'success');
      } else {
        showToast('Failed to download backup', 'error');
      }
    } catch (err) {
      showToast('Backup download failed', 'error');
    }
  });

  // Upload & Restore Backup
  if (uploadBackupTriggerBtn && backupFileInput) {
    uploadBackupTriggerBtn.addEventListener('click', () => {
      backupFileInput.value = '';
      backupFileInput.click();
    });

    backupFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
        showToast('Please select a valid JSON backup file.', 'error');
        return;
      }

      if (!confirm(`Are you sure you want to restore the database from "${file.name}"?\nThis will update items with the data from this backup file.`)) {
        backupFileInput.value = '';
        return;
      }

      try {
        const text = await file.text();
        const backupJson = JSON.parse(text);

        showToast('Restoring backup, please wait...', 'info');

        const res = await fetch('/api/admin/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(backupJson)
        });

        const data = await res.json();
        if (data.success) {
          showToast(data.message || 'Backup restored successfully!', 'success');
          closeSettingsModal();
          loadAdminStats();
          loadAdminItems();
        } else {
          showToast(data.error || 'Failed to restore backup.', 'error');
        }
      } catch (err) {
        showToast('Error reading or restoring backup file: ' + err.message, 'error');
      } finally {
        backupFileInput.value = '';
      }
    });
  }

  // Reset to Defaults
  resetDefaultsBtn.addEventListener('click', async () => {
    if (confirm('CAUTION: This will reset all items to the original 38 school kalolsavam items. Any custom items will be overwritten. Proceed?')) {
      try {
        const res = await fetch('/api/admin/reset-defaults', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const data = await res.json();
        if (data.success) {
          showToast('Database reset to default 38 items!', 'success');
          closeSettingsModal();
          loadAdminStats();
          loadAdminItems();
        } else {
          showToast(data.error || 'Reset failed', 'error');
        }
      } catch (err) {
        showToast('Error resetting items', 'error');
      }
    }
  });

  // Global escape key to close active modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeItemModal();
      closeUploadModal();
      closeBulkUploadModal();
      closeSettingsModal();
    }
  });

  // Helper Functions
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'success' ? 'toast-success' : type === 'error' ? 'toast-error' : ''}`;
    toast.innerHTML = `
      <span>${escapeHtml(message)}</span>
      <button style="background: none; border: none; cursor: pointer; color: #94a3b8; font-size: 1.1rem;">&times;</button>
    `;
    toast.querySelector('button').addEventListener('click', () => toast.remove());
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) toast.remove();
    }, 4000);
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
});
