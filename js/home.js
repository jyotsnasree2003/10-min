/* Home Page Manager - Direct Inventory Service Table Fetch & Rendering */

const HomeManager = {
  allProducts: [],
  categories: [],
  brands: [],
  activeCategory: 'all',
  activeBrand: 'all',
  searchQuery: '',

  async init() {
    this.renderSkeletons();
    await this.loadCategoriesAndBrands();
    await this.loadWarehouseProducts();
  },

  renderSkeletons() {
    const popularGrid = document.getElementById('popular-products-grid');
    const dealsGrid = document.getElementById('deals-products-grid');
    if (popularGrid) popularGrid.innerHTML = Utils.getSkeletonCardsHTML(4);
    if (dealsGrid) dealsGrid.innerHTML = Utils.getSkeletonCardsHTML(4);
  },

  async loadCategoriesAndBrands() {
    try {
      this.categories = await API.getCategories();
      if (typeof NameResolver !== 'undefined') {
        this.categories.forEach(c => {
          NameResolver.categories[c.id] = c.name;
        });
      }
    } catch (e) {
      console.warn('Product Service Categories Error:', e.message);
      this.categories = [];
    }

    try {
      this.brands = await API.getBrands();
      if (typeof NameResolver !== 'undefined') {
        this.brands.forEach(b => {
          NameResolver.brands[b.id] = b.name;
        });
      }
    } catch (e) {
      console.warn('Product Service Brands Error:', e.message);
      this.brands = [];
    }

    this.renderCategoryGrid();
    this.renderCategorySubnav();
    this.renderBrandChips();
  },


  /*
   * DIRECT INVENTORY SERVICE FETCH & ENRICHMENT PIPELINE:
   * 1. Calls GET http://localhost:8005/api/v1/inventory to fetch all records in inventory_db.
   * 2. For each inventory record, fetches catalog details from Product Service GET /products/{product_id}.
   * 3. Merges product details with available_quantity & warehouse_id from inventory_db.
   * 4. Renders the warehouse inventory products directly on the frontend!
   */
  async loadWarehouseProducts() {
    const lat = Utils.storage.get('latitude', 28.6139);
    const lng = Utils.storage.get('longitude', 77.2090);
    const warehouseId = Utils.storage.get('warehouse_id');

    this.renderSkeletons();

    // Step 1: Location Service POST /api/v1/home { lat, lng }
    try {
      const homeResponse = await API.getLocationHome(lat, lng);

      if (homeResponse && homeResponse.serviceable && Array.isArray(homeResponse.products) && homeResponse.products.length > 0) {
        if (homeResponse.warehouse_id) {
          Utils.storage.set('warehouse_id', homeResponse.warehouse_id);
        }
        if (homeResponse.warehouse_name) {
          Utils.storage.set('user_address', homeResponse.warehouse_name);
          LocationManager.updateNavbarPill();
        }

        this.allProducts = homeResponse.products;
        Utils.showToast(`Loaded ${this.allProducts.length} items from Inventory Service!`, 'success');
        this.renderProducts();
        return;
      }
    } catch (e) {
      console.warn('Location Service /home notice:', e.message);
    }

    // Step 2: Direct Warehouse Inventory fetch from Inventory Service (:8005)
    if (warehouseId) {
      try {
        const warehouseInventory = await API.getWarehouseProducts(warehouseId);
        if (Array.isArray(warehouseInventory) && warehouseInventory.length > 0) {
          this.allProducts = warehouseInventory;
          Utils.showToast(`Loaded ${this.allProducts.length} items for Warehouse ${warehouseId}!`, 'info');
          this.renderProducts();
          return;
        }
      } catch (we) {
        console.warn('Warehouse inventory notice:', we.message);
      }
    }

    // Step 3: Fetch all inventory entries directly from Inventory Service table (GET /inventory)
    try {
      const rawInventory = await API.getAllInventory();

      if (Array.isArray(rawInventory) && rawInventory.length > 0) {
        const enrichedItems = [];

        for (const item of rawInventory) {
          try {
            const product = await API.getProduct(item.product_id);
            if (product) {
              enrichedItems.push({
                ...product,
                quantity: item.quantity,
                available_quantity: item.available_quantity !== undefined ? item.available_quantity : item.quantity,
                reserved_quantity: item.reserved_quantity || 0,
                warehouse_id: item.warehouse_id
              });
            }
          } catch (pe) {
            console.warn(`Product ${item.product_id} details fetch error:`, pe.message);
          }
        }

        if (enrichedItems.length > 0) {
          this.allProducts = enrichedItems;
          Utils.showToast(`Enriched ${this.allProducts.length} inventory records from Inventory Service DB!`, 'info');
          this.renderProducts();
          return;
        }
      }
    } catch (ie) {
      console.warn('GET /inventory table error:', ie.message);
    }

    // Step 4: Product Catalog Fallback (:8002)
    try {
      const catalogProducts = await API.getProducts();
      if (Array.isArray(catalogProducts) && catalogProducts.length > 0) {
        this.allProducts = catalogProducts;
        this.renderProducts();
        return;
      }
    } catch (pe) {}

    this.allProducts = [];
    this.renderProductsError('No inventory records found in inventory_db.');
  },

  renderProductsError(errorMessage) {
    const popularGrid = document.getElementById('popular-products-grid');
    const dealsGrid = document.getElementById('deals-products-grid');

    const user = typeof Auth !== 'undefined' ? Auth.getUser() : null;
    const isAdmin = user && String(user.role || '').toLowerCase() === 'admin';

    let errorHTML = '';
    if (isAdmin) {
      errorHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏬</div>
          <h3 class="empty-state-title">No Inventory Items Found</h3>
          <p class="empty-state-desc">Assign product stock to darkstores in the Admin Dashboard under <strong>Warehouse Catalog</strong>.</p>
          <p style="font-size: 0.8rem; color: var(--status-cancelled); margin-bottom: 1rem;">${errorMessage}</p>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash='#admin'">⚙️ Manage Inventory in Admin</button>
        </div>
      `;
    } else {
      errorHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏬</div>
          <h3 class="empty-state-title">No Items Available</h3>
          <p class="empty-state-desc">No products are currently available at your nearest darkstore warehouse. We are stocking up items shortly!</p>
        </div>
      `;
    }

    if (popularGrid) popularGrid.innerHTML = errorHTML;
    if (dealsGrid) dealsGrid.innerHTML = '';
  },


  renderCategoryGrid() {
    const grid = document.getElementById('category-grid-container');
    if (!grid) return;

    if (!this.categories || this.categories.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; color: var(--medium-gray); font-size: 0.9rem;">No categories returned from Product Service.</div>`;
      return;
    }

    grid.innerHTML = this.categories.map(cat => {
      const imgSrc = cat.image_url || cat.image;
      const iconHTML = imgSrc 
        ? `<div class="category-icon-wrapper"><img src="${imgSrc}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 6px;" alt="${cat.name}" /></div>`
        : `<div class="category-icon-wrapper">${cat.icon || '🛍️'}</div>`;

      return `
        <div class="category-card" onclick="HomeManager.filterByCategory('${cat.id || cat.name}')">
          ${iconHTML}
          <div class="category-name">${cat.name}</div>
        </div>
      `;
    }).join('');
  },

  renderCategorySubnav() {
    const container = document.getElementById('cat-subnav-container');
    if (!container) return;

    if (!this.categories || this.categories.length === 0) {
      container.innerHTML = `
        <div class="cat-subnav-item active" onclick="HomeManager.filterByCategory('all')">
          🌟 All Items
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="cat-subnav-item ${this.activeCategory === 'all' ? 'active' : ''}" onclick="HomeManager.filterByCategory('all')">
        🌟 All Items
      </div>
      ${this.categories.map(cat => `
        <div class="cat-subnav-item ${this.activeCategory === (cat.id || cat.name) ? 'active' : ''}" onclick="HomeManager.filterByCategory('${cat.id || cat.name}')">
          ${cat.image_url || cat.image ? `<img src="${cat.image_url || cat.image}" style="width: 18px; height: 18px; object-fit: contain; border-radius: 4px;" />` : (cat.icon || '🛍️')} ${cat.name}
        </div>
      `).join('')}
    `;
  },

  renderBrandChips() {
    const container = document.getElementById('brand-chips-container');
    if (!container) return;

    if (!this.brands || this.brands.length === 0) {
      container.innerHTML = `<div style="color: var(--medium-gray); font-size: 0.9rem;">No brands returned from Brand Service.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="brand-chip ${this.activeBrand === 'all' ? 'active' : ''}" onclick="HomeManager.filterByBrand('all')">
        All Brands
      </div>
      ${this.brands.map(b => `
        <div class="brand-chip ${this.activeBrand === b.name ? 'active' : ''}" onclick="HomeManager.filterByBrand('${b.name}')">
          ${b.name}
        </div>
      `).join('')}
    `;
  },

  async filterByCategory(catId) {
    this.activeCategory = catId;
    this.activeBrand = 'all';
    this.renderCategorySubnav();
    this.renderBrandChips();

    if (catId === 'all') {
      await this.loadWarehouseProducts();
    } else {
      this.renderSkeletons();
      try {
        this.allProducts = await API.getProductsByCategory(catId);
        this.renderProducts();
      } catch (e) {
        this.allProducts = [];
        this.renderProductsError(`Failed to load products for category: ${e.message}`);
      }
    }
  },

  async filterByBrand(brandName) {
    this.activeBrand = brandName;
    this.activeCategory = 'all';
    this.renderCategorySubnav();
    this.renderBrandChips();

    if (brandName === 'all') {
      await this.loadWarehouseProducts();
    } else {
      this.renderSkeletons();
      try {
        let brandId = brandName;
        const found = this.brands.find(b => b.name === brandName || b.id === brandName);
        if (found) {
          brandId = found.id;
        }
        this.allProducts = await API.getProductsByBrand(brandId);
        this.renderProducts();
      } catch (e) {
        this.allProducts = [];
        this.renderProductsError(`Failed to load products for brand: ${e.message}`);
      }
    }
  },

  setSearchQuery(query) {
    this.searchQuery = query.toLowerCase().trim();
    this.renderProducts();
  },

  getFilteredProducts() {
    if (!Array.isArray(this.allProducts)) return [];

    return this.allProducts.filter(rawP => {
      const p = ProductManager.normalizeProduct(rawP);
      if (!p) return false;

      const matchSearch = !this.searchQuery || 
        p.name.toLowerCase().includes(this.searchQuery) ||
        p.brand.toLowerCase().includes(this.searchQuery) ||
        p.category.toLowerCase().includes(this.searchQuery);

      return matchSearch;
    });
  },

  renderProducts() {
    const popularGrid = document.getElementById('popular-products-grid');
    const dealsGrid = document.getElementById('deals-products-grid');
    const filteredGrid = document.getElementById('filtered-products-grid');
    const filteredSection = document.getElementById('filtered-section');
    const defaultSections = document.getElementById('default-home-sections');

    if (!this.allProducts || this.allProducts.length === 0) {
      return;
    }

    const filtered = this.getFilteredProducts();

    const sectionTitleEl = document.querySelector('#filtered-section .section-title');
    if (sectionTitleEl) {
      if (this.searchQuery) {
        sectionTitleEl.innerHTML = `🔍 Search Results for "${this.searchQuery}"`;
      } else if (this.activeCategory !== 'all') {
        const catName = NameResolver.categories[this.activeCategory] || this.activeCategory;
        sectionTitleEl.innerHTML = `📁 Category: ${catName}`;
      } else if (this.activeBrand !== 'all') {
        sectionTitleEl.innerHTML = `🏷️ Brand: ${this.activeBrand}`;
      }
    }

    if (this.activeCategory !== 'all' || this.activeBrand !== 'all' || this.searchQuery) {
      if (defaultSections) defaultSections.style.display = 'none';
      if (filteredSection) filteredSection.style.display = 'block';

      if (filteredGrid) {
        if (filtered.length === 0) {
          filteredGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1;">
              <h3>No products found for selected filters</h3>
              <p>Try resetting filters or search term.</p>
            </div>
          `;
        } else {
          filteredGrid.innerHTML = filtered.map(p => ProductManager.createCardHTML(p)).join('');
        }
      }
    } else {
      if (defaultSections) defaultSections.style.display = 'block';
      if (filteredSection) filteredSection.style.display = 'none';

      if (popularGrid) {
        popularGrid.innerHTML = filtered.map(p => ProductManager.createCardHTML(p)).join('');
      }

      if (dealsGrid) {
        const deals = filtered.filter(p => p.mrp > p.price);
        if (deals.length > 0) {
          dealsGrid.innerHTML = deals.map(p => ProductManager.createCardHTML(p)).join('');
        } else {
          dealsGrid.innerHTML = filtered.slice(0, 4).map(p => ProductManager.createCardHTML(p)).join('');
        }
      }
    }
  }
};
window.HomeManager = HomeManager;

