// Khayal 2K26 - Public Frontend Logic
document.addEventListener('DOMContentLoaded', () => {
  let allItems = [];
  let currentCategory = 'all';
  let currentSearchQuery = '';

  // DOM Elements
  const itemsContainer = document.getElementById('items-grid');
  const itemsCountText = document.getElementById('items-count-display');
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterTabs = document.querySelectorAll('.tab-btn');

  // Stat Elements
  const statTotal = document.getElementById('stat-total');
  const statPublished = document.getElementById('stat-published');
  const statPending = document.getElementById('stat-pending');
  const statRate = document.getElementById('stat-rate');
  const tabBadgeAll = document.getElementById('badge-all');
  const tabBadgeGeneral = document.getElementById('badge-general');
  const tabBadgeArabic = document.getElementById('badge-arabic');
  const tabBadgePublished = document.getElementById('badge-published');

  // PDF Viewer Modal Elements
  const pdfModal = document.getElementById('pdf-modal');
  const pdfModalTitle = document.getElementById('pdf-modal-title');
  const pdfModalMeta = document.getElementById('pdf-modal-meta');
  const pdfModalFrame = document.getElementById('pdf-modal-frame');
  const pdfOpenTabBtn = document.getElementById('pdf-open-tab-btn');
  const pdfDownloadBtn = document.getElementById('pdf-download-btn');
  const pdfCloseBtn = document.getElementById('pdf-close-btn');

  // Image Preview Modal Elements (Poster)
  const posterModal = document.getElementById('poster-modal');
  const posterPreviewTrigger = document.getElementById('poster-preview-trigger');
  const posterCloseBtn = document.getElementById('poster-close-btn');

  // Initialize
  loadStats();
  loadItems();

  // Search input event
  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.trim().toLowerCase();
    clearSearchBtn.style.display = currentSearchQuery.length > 0 ? 'block' : 'none';
    renderItems();
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearchQuery = '';
    clearSearchBtn.style.display = 'none';
    searchInput.focus();
    renderItems();
  });

  // Filter tab events
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentCategory = tab.dataset.category;
      renderItems();
    });
  });

  // Load Statistics from API
  async function loadStats() {
    try {
      const res = await fetch('/api/stats');
      const json = await res.json();
      if (json.success) {
        const stats = json.data;
        if (statTotal) statTotal.textContent = stats.total;
        if (statPublished) statPublished.textContent = stats.published;
        if (statPending) statPending.textContent = stats.pending;
        if (statRate) statRate.textContent = `${stats.publishPercentage}%`;

        if (tabBadgeAll) tabBadgeAll.textContent = stats.total;
        if (tabBadgeGeneral) tabBadgeGeneral.textContent = stats.generalTotal;
        if (tabBadgeArabic) tabBadgeArabic.textContent = stats.arabicTotal;
        if (tabBadgePublished) tabBadgePublished.textContent = stats.published;
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  // Load Items from API
  async function loadItems() {
    try {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="spinner" style="border-color: #f59e0b; border-top-color: transparent; width: 32px; height: 32px;"></div>
          <p style="margin-top: 12px; font-weight: 600;">Loading items & results...</p>
        </div>
      `;

      const res = await fetch('/api/items');
      const json = await res.json();
      if (json.success) {
        allItems = json.data;
        renderItems();
      } else {
        showError('Failed to load items.');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      showError('Unable to connect to the server. Please check your connection.');
    }
  }

  // Render Items based on active category & search query
  function renderItems() {
    let filtered = [...allItems];

    // Category filter
    if (currentCategory === 'HS General') {
      filtered = filtered.filter(item => item.category === 'HS General');
    } else if (currentCategory === 'HS Arabic') {
      filtered = filtered.filter(item => item.category === 'HS Arabic');
    } else if (currentCategory === 'published') {
      filtered = filtered.filter(item => item.hasResult);
    }

    // Search query filter
    if (currentSearchQuery) {
      filtered = filtered.filter(item => {
        const code = String(item.itemCode || '').toLowerCase();
        const en = String(item.itemName || '').toLowerCase();
        const ml = String(item.itemNameMl || '');
        return code.includes(currentSearchQuery) || en.includes(currentSearchQuery) || ml.includes(currentSearchQuery);
      });
    }

    // Update count display
    itemsCountText.textContent = `Showing ${filtered.length} item${filtered.length === 1 ? '' : 's'}`;

    if (filtered.length === 0) {
      itemsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No items found</h3>
          <p>No results match your filter or search "${escapeHtml(currentSearchQuery)}".</p>
        </div>
      `;
      return;
    }

    itemsContainer.innerHTML = filtered.map(item => createItemCardHtml(item)).join('');

    // Attach card event listeners
    itemsContainer.querySelectorAll('.btn-view-pdf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const itemId = e.currentTarget.dataset.id;
        const item = allItems.find(i => i.id === itemId);
        if (item && item.resultPdf) {
          openPdfModal(item);
        }
      });
    });
  }

  // HTML template for each item card
  function createItemCardHtml(item) {
    const isArabic = item.category === 'HS Arabic';
    const hasResult = item.hasResult && item.resultPdf;
    const catClass = isArabic ? 'arabic' : 'general';
    const catLabel = isArabic ? 'HS Arabic' : 'HS General';

    return `
      <div class="item-card ${hasResult ? 'has-result' : ''} ${isArabic ? 'is-arabic' : ''}">
        <div>
          <div class="item-card-top">
            <span class="item-code-badge">#${escapeHtml(item.itemCode)}</span>
            <span class="item-category-pill ${catClass}">${catLabel}</span>
          </div>
          
          <div class="item-body" style="margin-top: 10px;">
            <h3 class="item-name-en">${escapeHtml(item.itemName)}</h3>
            ${item.itemNameMl ? `<span class="item-name-ml font-ml">${escapeHtml(item.itemNameMl)}</span>` : ''}
            
            <div class="item-participants-info">
              <span>👥</span>
              <span>${item.participants} Participant${item.participants > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        <div class="item-footer">
          <div>
            ${hasResult ? `
              <div class="result-status-tag published">
                <span>✓</span> Result Published
              </div>
            ` : `
              <div class="result-status-tag pending">
                <span>⏳</span> Result Awaiting
              </div>
            `}
          </div>

          ${hasResult ? `
            <div class="action-buttons-row">
              <button class="btn btn-view-pdf btn-sm" data-id="${item.id}" title="View Result PDF">
                <span>👁️</span> View Result
              </button>
              <a href="${item.resultPdf.url}" download="${item.itemCode}_${sanitizeFilename(item.itemName)}_Result.pdf" class="btn btn-download-pdf btn-sm" title="Download PDF">
                <span>⬇️</span>
              </a>
            </div>
          ` : `
            <p style="font-size: 0.76rem; color: #94a3b8; font-style: italic;">
              Result will be available soon after judging.
            </p>
          `}
        </div>
      </div>
    `;
  }

  // Open PDF Viewer Modal
  function openPdfModal(item) {
    pdfModalTitle.textContent = `${item.itemCode} - ${item.itemName}`;
    pdfModalMeta.textContent = `${item.category} • ${item.participants} Participants • Published`;
    
    // Set frame source
    pdfModalFrame.src = item.resultPdf.url;
    
    // Action buttons
    pdfOpenTabBtn.href = item.resultPdf.url;
    pdfDownloadBtn.href = item.resultPdf.url;
    pdfDownloadBtn.setAttribute('download', `${item.itemCode}_${sanitizeFilename(item.itemName)}_Result.pdf`);

    // Mobile friendly hint
    const mobileHint = document.getElementById('mobile-pdf-hint');
    if (mobileHint) {
      mobileHint.style.display = (window.innerWidth <= 768 || 'ontouchstart' in window) ? 'block' : 'none';
    }

    pdfModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closePdfModal() {
    pdfModal.classList.remove('active');
    pdfModalFrame.src = '';
    document.body.style.overflow = '';
  }

  pdfCloseBtn.addEventListener('click', closePdfModal);
  pdfModal.addEventListener('click', (e) => {
    if (e.target === pdfModal) closePdfModal();
  });

  // Poster Modal triggers
  if (posterPreviewTrigger && posterModal) {
    posterPreviewTrigger.addEventListener('click', () => {
      posterModal.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

  if (posterCloseBtn && posterModal) {
    posterCloseBtn.addEventListener('click', () => {
      posterModal.classList.remove('active');
      document.body.style.overflow = '';
    });
    posterModal.addEventListener('click', (e) => {
      if (e.target === posterModal) {
        posterModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Keyboard shortcut to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (pdfModal.classList.contains('active')) closePdfModal();
      if (posterModal && posterModal.classList.contains('active')) {
        posterModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    }
  });

  // Helper Utilities
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

  function sanitizeFilename(name) {
    return (name || 'Result').replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  function showError(msg) {
    itemsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" style="color: #ef4444;">⚠️</div>
        <h3>Something went wrong</h3>
        <p>${escapeHtml(msg)}</p>
        <button class="btn btn-primary btn-sm" style="margin-top: 14px;" onclick="location.reload()">
          Retry
        </button>
      </div>
    `;
  }
});
