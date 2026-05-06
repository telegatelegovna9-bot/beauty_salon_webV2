// ============================================
// PORTFOLIO PAGE - ROSE GOLD VERSION
// ============================================

const PortfolioPage = {
  activeCategory: 'all',
  items: [],
  categories: [],

  async render(params = {}) {
    await this.loadCategories();
    return `
      <div class="page page-enter" id="portfolio-page">
        <div style="margin:0 calc(-1 * var(--space-md))">
          ${CategoryTabs.render(this.categories, this.activeCategory, 'PortfolioPage.filterCategory')}
        </div>
        <div id="portfolio-grid-container" style="padding:var(--space-md)">
          <div class="portfolio-grid">
            ${Array(4).fill('').map(() => `
              <div class="skeleton" style="aspect-ratio:1;border-radius:var(--radius-md)"></div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  async afterRender(params = {}) {
    await this.loadPortfolio();
  },

  filterCategory(category) {
    this.activeCategory = category;
    // Re-render tabs
    const tabsContainer = document.querySelector('#portfolio-page .category-tabs');
    if (tabsContainer) {
      tabsContainer.outerHTML = CategoryTabs.render(this.categories, category, 'PortfolioPage.filterCategory');
    }
    this.renderGrid();
  },

  async loadCategories() {
    try {
      const { categories } = await API.services.getCategories();
      this.categories = (categories || []).map(c => c.key);
      Store.set('categoriesMeta', Object.fromEntries((categories || []).map(c => [c.key, {
        label: c.name,
        icon: c.emoji || '💆',
        emoji: c.emoji || '💆'
      }])));
    } catch (e) {
      this.categories = Object.keys(Config.CATEGORIES);
    }
  },

  async loadPortfolio() {
    try {
      const params = {};
      if (this.activeCategory !== 'all') params.category = this.activeCategory;
      const { items } = await API.portfolio.list(params);
      this.items = items;
      this.renderGrid();
    } catch (e) {
      const container = document.getElementById('portfolio-grid-container');
      if (container) container.innerHTML = EmptyState.render('⚠️', 'Ошибка загрузки', e.message);
    }
  },

  renderGrid() {
    const container = document.getElementById('portfolio-grid-container');
    if (!container) return;

    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    if (filtered.length === 0) {
      container.innerHTML = EmptyState.render('📸', 'Нет работ', 'Портфолио пока пусто');
      return;
    }

    container.innerHTML = `
      <div class="portfolio-grid">
        ${filtered.map((item, index) => `
          <div class="portfolio-item ${item.is_featured ? 'featured' : ''} stagger-item"
               onclick="PortfolioPage.openItem(${index})"
               style="animation-delay:${index * 30}ms">
            <div class="portfolio-item-image-wrap">
              <img src="${item.image_url}" alt="${item.title || item.category}"
                   loading="lazy"
                   onerror="this.parentElement.style.background='var(--color-bg-secondary)'">
              <div class="portfolio-item-overlay"></div>
            </div>
            <div class="portfolio-item-content">
              ${item.title ? `<div class="portfolio-item-title">${item.title}</div>` : ''}
              ${item.description ? `<div class="portfolio-item-desc">${item.description}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  openItem(index) {
    const filtered = this.activeCategory === 'all'
      ? this.items
      : this.items.filter(item => item.category === this.activeCategory);

    const item = filtered[index];
    if (!item) return;

    Utils.haptic('light');

    Modal.open(`
      <div style="margin:-var(--space-md)">
        <img src="${item.image_url}" alt="${item.title || ''}"
             style="width:100%;max-height:70vh;object-fit:contain;border-radius:var(--radius-md);margin-bottom:var(--space-md)">
        ${item.title ? `<div style="font-weight:600;font-size:var(--font-size-lg);margin-bottom:4px">${item.title}</div>` : ''}
        ${item.description ? `<div style="color:var(--color-text-secondary)">${item.description}</div>` : ''}
        <div style="display:flex;align-items:center;gap:8px;margin-top:var(--space-sm)">
          <span class="chip chip-primary">${Utils.getCategoryInfo(item.category).emoji} ${Utils.getCategoryInfo(item.category).label}</span>
          ${item.master_name ? `<span class="chip">👤 ${item.master_name}</span>` : ''}
        </div>
        ${index > 0 || index < filtered.length - 1 ? `
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-md)">
            ${index > 0 ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.close();PortfolioPage.openItem(${index-1})">← Пред.</button>` : ''}
            ${index < filtered.length - 1 ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.close();PortfolioPage.openItem(${index+1})">След. →</button>` : ''}
          </div>
        ` : ''}
      </div>
    `);
  }
};
