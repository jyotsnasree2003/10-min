/* Admin Panel Controller - Direct Text Input Fields for Product ID & Warehouse ID */

const AdminManager = {
  activeTab: 'dashboard',
  cachedUsers: [],
  cachedWarehouses: [],

  compressImageFile(file, maxWidth = 120, maxHeight = 120) {
    return new Promise((resolve) => {
      if (!file) {
        resolve('');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        };
        img.onerror = () => resolve('');
        img.src = event.target.result;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  },

  async renderAdminView() {
    const container = document.getElementById('admin-view-container');
    if (!container) return;

    if (!Auth.requireAdmin()) return;

    container.innerHTML = `
      <div class="admin-layout">
        <div class="admin-sidebar">
          <h4 style="font-weight: 900; color: var(--primary); font-size: 1.2rem; margin-bottom: 0.5rem;">⚡ QuickO Admin</h4>
          
          <div class="admin-sidebar-title">Main Menu</div>
          <div class="admin-nav-item ${this.activeTab === 'dashboard' ? 'active' : ''}" onclick="AdminManager.switchTab('dashboard')">
            📊 Overview
          </div>
          <div class="admin-nav-item ${this.activeTab === 'warehouses' ? 'active' : ''}" onclick="AdminManager.switchTab('warehouses')">
            🏬 Warehouse Catalog
          </div>
          <div class="admin-nav-item ${this.activeTab === 'products' ? 'active' : ''}" onclick="AdminManager.switchTab('products')">
            📦 Products Catalog
          </div>
          <div class="admin-nav-item ${this.activeTab === 'categories' ? 'active' : ''}" onclick="AdminManager.switchTab('categories')">
            🏷️ Categories & Brands
          </div>
          <div class="admin-nav-item ${this.activeTab === 'orders' ? 'active' : ''}" onclick="AdminManager.switchTab('orders')">
            🛒 Customer Orders
          </div>
          <div class="admin-nav-item ${this.activeTab === 'users' ? 'active' : ''}" onclick="AdminManager.switchTab('users')">
            👥 User Accounts
          </div>
        </div>

        <div class="admin-main-card" id="admin-main-content">
          <div style="text-align: center; padding: 2rem;">Loading admin dashboard...</div>
        </div>
      </div>
    `;

    this.switchTab(this.activeTab);
  },

  async switchTab(tabName) {
    if (!Auth.requireAdmin()) return;

    this.activeTab = tabName === 'inventory' ? 'dashboard' : tabName;
    const content = document.getElementById('admin-main-content');
    if (!content) return;

    document.querySelectorAll('.admin-nav-item').forEach(item => {
      item.classList.remove('active');
    });

    switch (this.activeTab) {
      case 'warehouses':
        await this.renderWarehousesTab(content);
        break;
      case 'products':
        await this.renderProductsTab(content);
        break;
      case 'categories':
        await this.renderCategoriesTab(content);
        break;
      case 'orders':
        await this.renderOrdersTab(content);
        break;
      case 'users':
        await this.renderUsersTab(content);
        break;
      case 'dashboard':
      default:
        await this.renderDashboardTab(content);
        break;
    }
  },



  // 1. Dashboard Overview
  async renderDashboardTab(container) {
    let products = [], orders = [], inventory = [];

    try { products = await API.getProducts(); } catch (e) { products = []; }
    try { orders = await API.adminGetAllOrders(); } catch (e) { orders = []; }
    try { inventory = await API.getAllInventory(); } catch (e) { inventory = []; }

    const revenue = orders.reduce((sum, o) => sum + (parseFloat(o.total_amount || o.totalAmount || 0)), 0);

    container.innerHTML = `
      <h2 style="font-weight: 800; font-size: 1.5rem; margin-bottom: 1.5rem;">Dashboard Overview</h2>

      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">📦</div>
          <div>
            <div class="metric-value">${products.length}</div>
            <div class="metric-label">Products in Catalog</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">🏬</div>
          <div>
            <div class="metric-value">${inventory.length}</div>
            <div class="metric-label">Warehouse Inventory Stock</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">🛒</div>
          <div>
            <div class="metric-value">${orders.length}</div>
            <div class="metric-label">Customer Orders</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">💰</div>
          <div>
            <div class="metric-value">${Utils.formatCurrency(revenue)}</div>
            <div class="metric-label">Total Sales Revenue</div>
          </div>
        </div>
      </div>

      <h3 style="font-weight: 800; font-size: 1.15rem; margin-bottom: 1rem;">Recent Orders</h3>
      ${orders.length === 0 ? `<p style="color: var(--medium-gray);">No customer orders recorded yet.</p>` : `
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Address</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.slice(0, 5).map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>${o.delivery_address || 'Address'}</td>
                  <td>${Utils.formatCurrency(o.total_amount || 0)}</td>
                  <td><span class="badge badge-confirmed">${o.order_status || 'Pending'}</span></td>
                  <td><button class="btn btn-outline btn-sm" onclick="AdminManager.switchTab('orders')">Manage</button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  },

  // 2. Products Catalog Tab
  async renderProductsTab(container) {
    let products = [];
    try {
      products = await API.getProducts();
    } catch (e) {
      products = [];
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-weight: 800; font-size: 1.5rem;">Products Database (${products.length})</h2>
        <button class="btn btn-primary" onclick="AdminManager.openAddProductModal()">+ Add New Product to DB</button>
      </div>

      ${products.length === 0 ? `<p style="color: var(--medium-gray);">No products found.</p>` : `
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product ID (UUID)</th>
                <th>Product Name</th>
                <th>Brand Name</th>
                <th>Category Name</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${products.map(rawP => {
                const p = ProductManager.normalizeProduct(rawP);
                const bId = rawP.brand_id || rawP.brandId || (rawP.brand && rawP.brand.id) || p.brand;
                const cId = rawP.category_id || rawP.categoryId || (rawP.category && rawP.category.id) || p.categoryId;
                return `
                  <tr onclick="event.target.tagName !== 'BUTTON' && AdminManager.showProductDetailsInModal('${p.id}')" style="cursor: pointer;" title="Click to view product details">
                    <td><img src="${p.image}" style="width: 40px; height: 40px; object-fit: contain; border-radius: 4px;" /></td>
                    <td><small style="user-select: all; background: var(--light-gray); padding: 2px 6px; border-radius: 4px;">${p.id}</small></td>
                    <td><strong>${p.name}</strong></td>
                    <td><small class="resolve-brand" data-id="${bId}">Loading...</small></td>
                    <td><small class="resolve-category" data-id="${cId}">Loading...</small></td>
                    <td>${Utils.formatCurrency(p.price)}</td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); AdminManager.openEditProductModal('${p.id}')" style="margin-right: 5px;">Edit</button>
                      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); AdminManager.deleteProduct('${p.id}')" style="color: var(--status-cancelled); border-color: var(--status-cancelled);">Delete</button>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>

          </table>
        </div>
      `}
    `;

    NameResolver.resolveElements();
  },


  async openAddProductModal() {
    let categories = [], brands = [];
    try { categories = await API.getCategories(); } catch (e) {}
    try { brands = await API.getBrands(); } catch (e) {}

    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Add New Product</h3>
      <p style="font-size: 0.85rem; color: var(--medium-gray); margin-bottom: 1.25rem;">Create a new product catalog entry.</p>

      <form id="admin-add-product-form">
        <div class="form-group">
          <label class="form-label">Product Name *</label>
          <input type="text" id="admin-p-name" class="form-control" placeholder="e.g. Fresh Organic Apples 1kg" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label">Category ID *</label>
              <button type="button" style="background: none; border: none; color: var(--primary); font-weight: 800; font-size: 0.75rem; cursor: pointer;" onclick="AdminManager.openAddCategoryModal()">+ Add Category</button>
            </div>
            <input type="text" id="admin-p-category" class="form-control" list="categories-datalist" placeholder="Type or paste Category UUID" required />
            <datalist id="categories-datalist">
              ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
            </datalist>
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <label class="form-label">Brand ID *</label>
              <button type="button" style="background: none; border: none; color: var(--primary); font-weight: 800; font-size: 0.75rem; cursor: pointer;" onclick="AdminManager.openAddBrandModal()">+ Add Brand</button>
            </div>
            <input type="text" id="admin-p-brand" class="form-control" list="brands-datalist" placeholder="Type or paste Brand UUID" required />
            <datalist id="brands-datalist">
              ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
            </datalist>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Selling Price (₹) *</label>
            <input type="number" step="0.01" id="admin-p-price" class="form-control" placeholder="120.00" required />
          </div>

          <div class="form-group">
            <label class="form-label">MRP (₹) *</label>
            <input type="number" step="0.01" id="admin-p-mrp" class="form-control" placeholder="150.00" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Upload Product Photo File 📁</label>
          <input type="file" id="admin-p-image-file" class="form-control" accept="image/*" />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea id="admin-p-desc" class="form-control" rows="2" placeholder="Product details..."></textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-block" style="padding: 0.85rem;">Save Product to Database</button>
      </form>
    `;

    modal.classList.add('active');

    const form = document.getElementById('admin-add-product-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('admin-p-name').value.trim();
        const category_id = document.getElementById('admin-p-category').value.trim();
        const brand_id = document.getElementById('admin-p-brand').value.trim();
        const price = parseFloat(document.getElementById('admin-p-price').value);
        const mrp = parseFloat(document.getElementById('admin-p-mrp').value);
        const description = document.getElementById('admin-p-desc').value.trim();
        const imageFileInput = document.getElementById('admin-p-image-file');

        if (!category_id || !brand_id) {
          Utils.showToast('Please enter valid Category ID and Brand ID', 'warning');
          return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Product...';

        try {
          const newProduct = await API.adminCreateProduct({
            name,
            category_id,
            brand_id,
            price,
            mrp,
            description
          });

          if (imageFileInput && imageFileInput.files && imageFileInput.files[0] && newProduct && newProduct.id) {
            try {
              await API.adminUploadProductImage(newProduct.id, imageFileInput.files[0]);
              Utils.showToast('Product image uploaded!', 'info');
            } catch (imgErr) {
              console.warn('Image upload error:', imgErr.message);
            }
          }

          Utils.showToast(`Product "${name}" inserted into database!`, 'success');
          modal.classList.remove('active');
          this.switchTab('products');
        } catch (err) {
          Utils.showToast(`Product Error: ${err.message}`, 'error');
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerText = 'Save Product to Database';
        }
      };
    }
  },

  async deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this product from the database?')) return;
    try {
      await API.adminDeleteProduct(id);
      Utils.showToast('Product deleted from database', 'info');
      this.switchTab('products');
    } catch (e) {
      Utils.showToast(`Delete Error: ${e.message}`, 'error');
    }
  },

  // 3. Categories & Brands Tab
  async renderCategoriesTab(container) {
    let categories = [], brands = [];
    try { categories = await API.getCategories(); } catch (e) {}
    try { brands = await API.getBrands(); } catch (e) {}

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-weight: 800; font-size: 1.5rem;">Categories & Brands Database</h2>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary btn-sm" onclick="AdminManager.openAddCategoryModal()">+ Add Category to DB</button>
          <button class="btn btn-primary btn-sm" onclick="AdminManager.openAddBrandModal()">+ Add Brand to DB</button>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
        <div style="background: var(--light-gray); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <h4 style="font-weight: 800; margin-bottom: 0.5rem; color: var(--dark);">➕ Create Category</h4>
          <form id="inline-create-category-form">
            <div class="form-group" style="margin-bottom: 0.75rem;">
              <label class="form-label" style="font-size: 0.8rem;">Category Name *</label>
              <input type="text" id="inline-c-name" class="form-control" placeholder="Category Name (e.g. Dairy & Eggs)" required />
            </div>

            <div class="form-group" style="margin-bottom: 0.75rem;">
              <label class="form-label" style="font-size: 0.8rem;">Upload Category Photo File 📁</label>
              <input type="file" id="inline-c-image-file" class="form-control" accept="image/*" />
            </div>

            <button type="submit" class="btn btn-primary btn-block btn-sm">Upload Photo & Create Category</button>
          </form>
        </div>

        <div style="background: var(--light-gray); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
          <h4 style="font-weight: 800; margin-bottom: 0.5rem; color: var(--dark);">➕ Create Brand</h4>
          <form id="inline-create-brand-form">
            <div class="form-group" style="margin-bottom: 0.75rem;">
              <label class="form-label" style="font-size: 0.8rem;">Brand Name *</label>
              <input type="text" id="inline-b-name" class="form-control" placeholder="Brand Name (e.g. Mother Dairy)" required />
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-sm">Create Brand</button>
          </form>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
        <div>
          <h3 style="font-weight: 800; margin-bottom: 1rem;">Categories Table (${categories.length})</h3>
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead><tr><th>Image</th><th>ID (UUID)</th><th>Name</th><th>Action</th></tr></thead>
              <tbody>
                ${categories.length === 0 ? '<tr><td colspan="4">No categories found in database.</td></tr>' : categories.map(c => `
                  <tr onclick="event.target.tagName !== 'BUTTON' && event.target.tagName !== 'SMALL' && AdminManager.showCategoryProducts('${c.id}', '${c.name.replace(/'/g, "\\'")}')" style="cursor: pointer;" title="Click to view related products">
                    <td><img src="${c.image_url || c.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;" /></td>
                    <td><small style="user-select: all; cursor: pointer; background: var(--light-gray); padding: 2px 4px; border-radius: 4px;" title="Click to copy">${c.id}</small></td>
                    <td><a href="javascript:void(0)" style="color: var(--primary); font-weight: 700; text-decoration: underline;">${c.name}</a></td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); AdminManager.openEditCategoryModal('${c.id}', '${c.name.replace(/'/g, "\\'")}', '${(c.image_url || c.image || '').replace(/'/g, "\\'")}')" style="margin-right: 5px;">Edit</button>
                      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); AdminManager.deleteCategory('${c.id}')" style="color: var(--status-cancelled); border-color: var(--status-cancelled);">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 style="font-weight: 800; margin-bottom: 1rem;">Brands Table (${brands.length})</h3>
          <div class="admin-table-wrapper">
            <table class="admin-table">
              <thead><tr><th>ID (UUID)</th><th>Brand Name</th><th>Action</th></tr></thead>
              <tbody>
                ${brands.length === 0 ? '<tr><td colspan="3">No brands found in database.</td></tr>' : brands.map(b => `
                  <tr onclick="event.target.tagName !== 'BUTTON' && event.target.tagName !== 'SMALL' && AdminManager.showBrandProducts('${b.id}', '${b.name.replace(/'/g, "\\'")}')" style="cursor: pointer;" title="Click to view related products">
                    <td><small style="user-select: all; cursor: pointer; background: var(--light-gray); padding: 2px 4px; border-radius: 4px;" title="Click to copy">${b.id}</small></td>
                    <td><a href="javascript:void(0)" style="color: var(--primary); font-weight: 700; text-decoration: underline;">${b.name}</a></td>
                    <td>
                      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); AdminManager.openEditBrandModal('${b.id}', '${b.name.replace(/'/g, "\\'")}')" style="margin-right: 5px;">Edit</button>
                      <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); AdminManager.deleteBrand('${b.id}')" style="color: var(--status-cancelled); border-color: var(--status-cancelled);">Delete</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>



    `;

    const catForm = document.getElementById('inline-create-category-form');
    if (catForm) {
      catForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('inline-c-name').value.trim();
        const fileInput = document.getElementById('inline-c-image-file');
        
        let image_url = '';
        if (fileInput && fileInput.files && fileInput.files[0]) {
          image_url = await this.compressImageFile(fileInput.files[0], 120, 120);
        }

        try {
          await API.adminCreateCategory({ name, image_url });
          Utils.showToast(`Category "${name}" with uploaded photo inserted into DB!`, 'success');
          this.switchTab('categories');
          if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
        } catch (err) {
          Utils.showToast(`Category Creation Error: ${err.message}`, 'error');
        }
      };
    }

    const brandForm = document.getElementById('inline-create-brand-form');
    if (brandForm) {
      brandForm.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('inline-b-name').value.trim();
        try {
          await API.adminCreateBrand({ name });
          Utils.showToast(`Brand "${name}" created in database!`, 'success');
          this.switchTab('categories');
          if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
        } catch (err) {
          Utils.showToast(`Brand Creation Error: ${err.message}`, 'error');
        }
      };
    }
  },

  // 4. Darkstore Warehouses Tab
  async renderWarehousesTab(container) {
    try {
      this.cachedWarehouses = await API.getWarehouses();
    } catch (e) {
      this.cachedWarehouses = [];
      Utils.showToast(`Error fetching warehouses: ${e.message}`, 'error');
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-weight: 800; font-size: 1.5rem; margin: 0;">🏬 Darkstore Warehouses (${this.cachedWarehouses.length})</h2>
        <button class="btn btn-primary" onclick="AdminManager.openAddWarehouseModal()">+ Add New Warehouse</button>
      </div>

      ${this.cachedWarehouses.length === 0 ? `<p style="color: var(--medium-gray);">No warehouses found.</p>` : `
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Warehouse ID</th>
                <th>Name</th>
                <th>Capacity</th>
                <th>Operating Hours</th>
                <th>Manager ID</th>
              </tr>
            </thead>
            <tbody>
              ${this.cachedWarehouses.map(w => `
                <tr onclick="event.target.tagName !== 'A' && AdminManager.showWarehouseDetails('${w.id}')" style="cursor: pointer;" title="Click to view stock inventory details">
                  <td><small style="user-select: all; font-family: monospace; background: var(--light-gray); padding: 2px 6px; border-radius: 4px;">${w.id}</small></td>
                  <td><strong>${w.name}</strong></td>
                  <td>${w.capacity || 'Unlimited'} units</td>
                  <td>${w.opening_time || '00:00'} - ${w.closing_time || '00:00'}</td>
                  <td>
                    ${w.manager_id ? `
                      <a href="javascript:void(0)" onclick="AdminManager.showWarehouseManagerDetails('${w.manager_id}')" style="color: var(--primary); font-weight: 700; text-decoration: underline;" title="Click to view manager details">
                        ${w.manager_id}
                      </a>
                    ` : '<span style="color: var(--medium-gray);">Unassigned</span>'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  },

  async openAddWarehouseModal() {
    let users = [];
    try {
      users = await API.adminGetUsers();
    } catch (e) {
      console.warn("Failed to fetch users", e);
    }
    const managers = users.filter(u => String(u.role).toLowerCase() === 'inventory manager');

    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Add New Warehouse</h3>
      <p style="font-size: 0.85rem; color: var(--medium-gray); margin-bottom: 1.25rem;">Create a new darkstore warehouse serving a specific geofenced area.</p>

      <form id="admin-add-warehouse-form">
        <div class="form-group">
          <label class="form-label">Warehouse Name *</label>
          <input type="text" id="admin-wh-name" class="form-control" placeholder="e.g. Hyderabad Hitech City Hub" required />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Capacity (units) *</label>
            <input type="number" id="admin-wh-capacity" class="form-control" min="1" placeholder="e.g. 5000" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contact Email *</label>
            <input type="email" id="admin-wh-email" class="form-control" placeholder="e.g. hitech@quicko.com" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Opening Time *</label>
            <input type="time" id="admin-wh-opening" class="form-control" value="06:00" required />
          </div>
          <div class="form-group">
            <label class="form-label">Closing Time *</label>
            <input type="time" id="admin-wh-closing" class="form-control" value="23:00" required />
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Latitude *</label>
            <input type="number" id="admin-wh-lat" class="form-control" step="any" placeholder="e.g. 17.448" required />
          </div>
          <div class="form-group">
            <label class="form-label">Longitude *</label>
            <input type="number" id="admin-wh-lng" class="form-control" step="any" placeholder="e.g. 78.374" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Assign Manager *</label>
          <select id="admin-wh-manager" class="form-control" required style="width: 100%; height: 38px; padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <option value="">-- Select Inventory Manager --</option>
            ${managers.map(m => `<option value="${m.id}">${m.name} (${m.email})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Geofence Coordinates (JSON array of [lat, lng] pairs) *</label>
          <textarea id="admin-wh-geofence" class="form-control" rows="4" style="font-family: monospace; font-size: 0.82rem; width: 100%;" required placeholder="e.g. [[17.43,78.33],[17.43,78.37],[17.47,78.37],[17.47,78.33]]"></textarea>
          <small style="color: var(--medium-gray); font-size: 0.76rem; display: block; margin-top: 4px;">Must contain at least 3 points forming a closed loop.</small>
        </div>

        <button type="submit" class="btn btn-primary btn-block" style="padding: 0.85rem; margin-top: 1rem;">Save Warehouse Record</button>
      </form>
    `;

    modal.classList.add('active');

    // Add listeners to auto-generate default geofence when lat/lng are entered
    const latInput = document.getElementById('admin-wh-lat');
    const lngInput = document.getElementById('admin-wh-lng');
    const geofenceText = document.getElementById('admin-wh-geofence');

    const updateGeofence = () => {
      const lat = parseFloat(latInput.value);
      const lng = parseFloat(lngInput.value);
      if (!isNaN(lat) && !isNaN(lng)) {
        const d = 0.015; // default geofence offset (~1.5km radius square)
        const defaultGeofence = [
          [lat - d, lng - d],
          [lat - d, lng + d],
          [lat + d, lng + d],
          [lat + d, lng - d]
        ];
        geofenceText.value = JSON.stringify(defaultGeofence);
      }
    };

    latInput.addEventListener('input', updateGeofence);
    lngInput.addEventListener('input', updateGeofence);

    const form = document.getElementById('admin-add-warehouse-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('admin-wh-name').value.trim();
        const capacity = parseInt(document.getElementById('admin-wh-capacity').value || 0);
        const contact_email = document.getElementById('admin-wh-email').value.trim();
        const opening_time = document.getElementById('admin-wh-opening').value;
        const closing_time = document.getElementById('admin-wh-closing').value;
        const lat = parseFloat(document.getElementById('admin-wh-lat').value);
        const lng = parseFloat(document.getElementById('admin-wh-lng').value);
        const manager_id = document.getElementById('admin-wh-manager').value;
        const geofenceStr = document.getElementById('admin-wh-geofence').value.trim();

        let geofence;
        try {
          geofence = JSON.parse(geofenceStr);
          if (!Array.isArray(geofence) || geofence.length < 3) {
            throw new Error();
          }
          for (let p of geofence) {
            if (!Array.isArray(p) || p.length !== 2 || typeof p[0] !== 'number' || typeof p[1] !== 'number') {
              throw new Error();
            }
          }
        } catch (err) {
          Utils.showToast('Invalid geofence format! Must be JSON list of [lat, lng] pairs (at least 3 points).', 'error');
          return;
        }

        try {
          await API.adminCreateWarehouse({
            name,
            lat,
            lng,
            geofence,
            capacity,
            opening_time,
            closing_time,
            contact_email,
            manager_id
          });
          Utils.showToast(`Warehouse "${name}" created and synced successfully!`, 'success');
          modal.classList.remove('active');
          this.switchTab('warehouses');
        } catch (err) {
          Utils.showToast(`Warehouse Creation Error: ${err.message}`, 'error');
        }
      };
    }
  },

  async showWarehouseDetails(warehouseId) {
    const warehouse = this.cachedWarehouses.find(w => String(w.id) === String(warehouseId));
    if (!warehouse) return;

    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Loading warehouse inventory details...</p>
      </div>
    `;
    modal.classList.add('active');

    try {
      let inventoryItems = [];
      try {
        inventoryItems = await API.getWarehouseProducts(warehouse.id);
      } catch (e) {
        inventoryItems = [];
      }

      modalContent.innerHTML = `
        <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          🏬 Warehouse Details
        </h3>

        <!-- Warehouse Info Grid (No Email) -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.9rem;">
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Warehouse Name</span>
            <strong style="color: var(--dark);">${warehouse.name || 'N/A'}</strong>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Operating Hours</span>
            <strong style="color: var(--dark);">${warehouse.opening_time || '00:00'} - ${warehouse.closing_time || '00:00'}</strong>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Capacity</span>
            <strong style="color: var(--dark);">${warehouse.capacity || 'Unlimited'} units</strong>
          </div>
        </div>

        <h4 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; color: var(--dark-gray); display: flex; justify-content: space-between; align-items: center;">
          <span>📦 Warehouse Inventory Stock</span>
          <span style="background: var(--primary-light); color: var(--primary); padding: 2px 8px; border-radius: 20px; font-size: 0.85rem;">${inventoryItems.length} Products</span>
        </h4>

        <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
          ${inventoryItems.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: var(--medium-gray);">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">📦</div>
              <p style="font-weight: 600;">No products found in stock for this warehouse.</p>
            </div>
          ` : `
            <div class="admin-table-wrapper" style="margin-top: 0; max-height: 250px;">
              <table class="admin-table" style="font-size: 0.82rem;">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Brand Name</th>
                    <th>Category Name</th>
                    <th>Stock</th>
                    <th>Reserved</th>
                    <th>Available</th>
                  </tr>
                </thead>
                <tbody>
                  ${inventoryItems.map(item => {
                    const prodName = item.name || item.product_name || (item.product && item.product.name) || 'Product';
                    const pId = String(item.product_id || item.productId || item.id || 'N/A');
                    const bId = item.brand_id || (item.product && item.product.brand_id) || 'N/A';
                    const cId = item.category_id || (item.product && item.product.category_id) || 'N/A';
                    const qty = item.quantity !== undefined ? item.quantity : 0;
                    const resQty = item.reserved_quantity !== undefined ? item.reserved_quantity : 0;
                    const availQty = item.available_quantity !== undefined ? item.available_quantity : (qty - resQty);
                    return `
                      <tr>
                        <td>
                          <a href="javascript:void(0)" onclick="AdminManager.showProductDetailsInModal('${pId}')" style="color: var(--primary); font-weight: 700; text-decoration: underline;" title="Click to view product details">
                            ${pId}
                          </a>
                        </td>
                        <td><strong>${prodName}</strong></td>
                        <td><small class="resolve-brand" data-id="${bId}">Loading...</small></td>
                        <td><small class="resolve-category" data-id="${cId}">Loading...</small></td>
                        <td>
                          <input type="number" class="status-select" style="width: 75px; text-align: center; font-weight: 700; padding: 2px 4px;" value="${qty}" onchange="AdminManager.updateWarehouseInventoryItem('${pId}', this.value, '${resQty}', '${warehouse.id}')" />
                        </td>
                        <td>
                          <input type="number" class="status-select" style="width: 75px; text-align: center; font-weight: 700; padding: 2px 4px;" value="${resQty}" onchange="AdminManager.updateWarehouseInventoryItem('${pId}', '${qty}', this.value, '${warehouse.id}')" />
                        </td>
                        <td><strong style="color: var(--primary);">${availQty}</strong></td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div style="text-align: right; margin-top: 1.5rem;">
          <button class="btn btn-primary" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Close</button>
        </div>
      `;

      NameResolver.resolveElements();
    } catch (err) {
      modalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--status-cancelled);">
          <h3>Error Fetching Inventory Details</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  },

  async showWarehouseManagerDetails(managerId) {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Loading details...</p>
      </div>
    `;
    modal.classList.add('active');


    try {
      const manager = await API.getUserById(managerId);

      const displayRole = manager.role || 'inventory manager';
      let badgeClass = 'badge-pending';
      if (String(displayRole).toLowerCase() === 'admin') {
        badgeClass = 'badge-packed';
      } else if (String(displayRole).toLowerCase() === 'customer') {
        badgeClass = 'badge-confirmed';
      }

      modalContent.innerHTML = `
        <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          👤 Manager Account Details
        </h3>

        <!-- Manager Information Grid (Fixed word-break overflow) -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Full Name</span>
            <strong style="font-size: 1.05rem; color: var(--dark); word-break: break-all; display: block; max-width: 100%;">${manager.name}</strong>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Email Address</span>
            <strong style="font-size: 1.05rem; color: var(--dark); word-break: break-all; display: block; max-width: 100%;">${manager.email}</strong>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Role</span>
            <span class="badge ${badgeClass}" style="display: inline-block; margin-top: 4px; font-weight: 700;">${displayRole}</span>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Manager ID (UUID)</span>
            <code style="user-select: all; font-size: 0.8rem; background: var(--light-gray); padding: 2px 6px; border-radius: 4px; font-family: monospace; display: block; margin-top: 4px; word-break: break-all; max-width: 100%;" title="Click to copy">${String(managerId)}</code>
          </div>
        </div>

        <div style="text-align: right; margin-top: 1rem;">
          <button class="btn btn-primary" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Close</button>
        </div>
      `;
    } catch (err) {
      modalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--status-cancelled);">
          <h3>Error Fetching Manager Details</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  },

  async showProductDetailsInModal(productId) {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Loading product details...</p>
      </div>
    `;
    modal.classList.add('active');

    try {
      const pIdStr = String(productId);
      const rawProduct = await API.getProduct(pIdStr);
      const p = ProductManager.normalizeProduct(rawProduct);

      const bId = rawProduct.brand_id || rawProduct.brandId || (rawProduct.brand && rawProduct.brand.id) || p.brand;
      const cId = rawProduct.category_id || rawProduct.categoryId || (rawProduct.category && rawProduct.category.id) || p.categoryId;


      modalContent.innerHTML = `
        <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          📦 Product Details
        </h3>

        <div style="display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
          <div style="flex: 1; min-width: 120px; text-align: center;">
            <img src="${p.image}" style="max-width: 120px; max-height: 120px; object-fit: contain; border-radius: 8px; border: 1px solid var(--border-color); padding: 8px; background: #fff;" alt="${p.name}" />
          </div>

          <div style="flex: 2; min-width: 200px; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; font-size: 0.88rem;">
            <div style="grid-column: span 2;">
              <span style="font-size: 0.75rem; color: var(--medium-gray); display: block; font-weight: 600;">Product Name</span>
              <strong style="font-size: 1.05rem; color: var(--dark);">${p.name}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--medium-gray); display: block; font-weight: 600;">Selling Price</span>
              <strong style="color: var(--primary); font-size: 1rem;">${Utils.formatCurrency(p.price)}</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--medium-gray); display: block; font-weight: 600;">MRP</span>
              <span style="text-decoration: line-through; color: var(--medium-gray);">${Utils.formatCurrency(p.mrp)}</span>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--medium-gray); display: block; font-weight: 600;">Category Name</span>
              <strong class="resolve-category" data-id="${cId}">Loading...</strong>
            </div>
            <div>
              <span style="font-size: 0.75rem; color: var(--medium-gray); display: block; font-weight: 600;">Brand Name</span>
              <strong class="resolve-brand" data-id="${bId}">Loading...</strong>
            </div>
            <div style="grid-column: span 2;">
              <span style="font-size: 0.75rem; color: var(--medium-gray); display: block; font-weight: 600;">Product ID (UUID)</span>
              <code style="user-select: all; font-size: 0.75rem; font-family: monospace; background: var(--light-gray); padding: 2px 6px; border-radius: 4px; word-break: break-all; display: block; max-width: 100%;">${p.id}</code>
            </div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.85rem; margin-bottom: 1.25rem; font-size: 0.85rem;">
          <strong style="display: block; margin-bottom: 4px; color: var(--dark-gray);">Description:</strong>
          <p style="margin: 0; color: var(--medium-gray); line-height: 1.45;">${p.description}</p>
        </div>

        <div style="text-align: right; margin-top: 1rem;">
          <button class="btn btn-primary" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Close</button>
        </div>
      `;

      NameResolver.resolveElements();
    } catch (err) {
      modalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--status-cancelled);">
          <h3>Error Fetching Product Details</h3>
          <p>${err.message}</p>
          <button class="btn btn-primary" style="margin-top: 1rem;" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Close</button>
        </div>
      `;
    }
  },

  async showCategoryProducts(categoryId, categoryName) {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Loading products for category ${categoryName}...</p>
      </div>
    `;
    modal.classList.add('active');

    try {
      const filtered = await API.getProductsByCategory(categoryId);


      modalContent.innerHTML = `
        <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          📁 Products in "${categoryName}"
        </h3>

        <div style="max-height: 380px; overflow-y: auto; padding-right: 4px;">
          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: var(--medium-gray);">
              <p style="font-weight: 600;">No products associated with this category.</p>
            </div>
          ` : `
            <div class="admin-table-wrapper" style="margin-top: 0; max-height: 350px;">
              <table class="admin-table" style="font-size: 0.82rem;">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Brand Name</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(rawP => {
                    const p = ProductManager.normalizeProduct(rawP);
                    const bId = rawP.brand_id || rawP.brandId || (rawP.brand && rawP.brand.id) || p.brand;

                    return `
                      <tr onclick="AdminManager.showProductDetailsInModal('${p.id}')" style="cursor: pointer;" title="Click to view details">
                        <td><img src="${p.image}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px;" /></td>
                        <td><small>${p.id}</small></td>
                        <td><strong>${p.name}</strong></td>
                        <td><small class="resolve-brand" data-id="${bId}">Loading...</small></td>
                        <td>${Utils.formatCurrency(p.price)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div style="text-align: right; margin-top: 1.5rem;">
          <button class="btn btn-primary" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Close</button>
        </div>
      `;

      NameResolver.resolveElements();
    } catch (err) {
      modalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--status-cancelled);">
          <h3>Error Fetching Products</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  },

  async showBrandProducts(brandId, brandName) {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Loading products for brand ${brandName}...</p>
      </div>
    `;
    modal.classList.add('active');

    try {
      const filtered = await API.getProductsByBrand(brandId);


      modalContent.innerHTML = `
        <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          🏷️ Products for Brand "${brandName}"
        </h3>

        <div style="max-height: 380px; overflow-y: auto; padding-right: 4px;">
          ${filtered.length === 0 ? `
            <div style="text-align: center; padding: 2rem; color: var(--medium-gray);">
              <p style="font-weight: 600;">No products associated with this brand.</p>
            </div>
          ` : `
            <div class="admin-table-wrapper" style="margin-top: 0; max-height: 350px;">
              <table class="admin-table" style="font-size: 0.82rem;">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>Category Name</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(rawP => {
                    const p = ProductManager.normalizeProduct(rawP);
                    const cId = rawP.category_id || rawP.categoryId || (rawP.category && rawP.category.id) || p.categoryId;

                    return `
                      <tr onclick="AdminManager.showProductDetailsInModal('${p.id}')" style="cursor: pointer;" title="Click to view details">
                        <td><img src="${p.image}" style="width: 36px; height: 36px; object-fit: contain; border-radius: 4px;" /></td>
                        <td><small>${p.id}</small></td>
                        <td><strong>${p.name}</strong></td>
                        <td><small class="resolve-category" data-id="${cId}">Loading...</small></td>
                        <td>${Utils.formatCurrency(p.price)}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <div style="text-align: right; margin-top: 1.5rem;">
          <button class="btn btn-primary" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Close</button>
        </div>
      `;

      NameResolver.resolveElements();
    } catch (err) {
      modalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--status-cancelled);">
          <h3>Error Fetching Products</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  },

  async openEditProductModal(productId) {
    let categories = [], brands = [];
    try { categories = await API.getCategories(); } catch (e) {}
    try { brands = await API.getBrands(); } catch (e) {}

    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Loading product details...</p>
      </div>
    `;
    modal.classList.add('active');

    try {
      const p = await API.getProduct(productId);

      modalContent.innerHTML = `
        <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Edit Product</h3>
        <p style="font-size: 0.85rem; color: var(--medium-gray); margin-bottom: 1.25rem;">Updates the selected product details.</p>

        <form id="admin-edit-product-form">
          <div class="form-group">
            <label class="form-label">Product Name *</label>
            <input type="text" id="admin-edit-p-name" class="form-control" value="${p.name || ''}" required />
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Category ID *</label>
              <input type="text" id="admin-edit-p-category" class="form-control" list="categories-datalist-edit" value="${p.category_id || p.category || ''}" required />
              <datalist id="categories-datalist-edit">
                ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
              </datalist>
            </div>

            <div class="form-group">
              <label class="form-label">Brand ID *</label>
              <input type="text" id="admin-edit-p-brand" class="form-control" list="brands-datalist-edit" value="${p.brand_id || p.brand || ''}" required />
              <datalist id="brands-datalist-edit">
                ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
              </datalist>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group">
              <label class="form-label">Price (INR) *</label>
              <input type="number" step="0.01" id="admin-edit-p-price" class="form-control" value="${p.price || ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label">MRP (INR) *</label>
              <input type="number" step="0.01" id="admin-edit-p-mrp" class="form-control" value="${p.mrp || p.price || ''}" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Product Description</label>
            <textarea id="admin-edit-p-desc" class="form-control" style="min-height: 80px;">${p.description || ''}</textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Upload New Product Image File (Optional)</label>
            <input type="file" id="admin-edit-p-image" class="form-control" accept="image/*" />
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button type="submit" class="btn btn-primary" style="flex: 1;">Save Changes</button>
            <button type="button" class="btn btn-outline" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Cancel</button>
          </div>
        </form>
      `;

      const form = document.getElementById('admin-edit-product-form');
      form.onsubmit = async (e) => {
        e.preventDefault();
        const saveButton = form.querySelector('button[type="submit"]');
        saveButton.disabled = true;
        saveButton.innerText = 'Saving Changes...';

        const name = document.getElementById('admin-edit-p-name').value.trim();
        const category_id = document.getElementById('admin-edit-p-category').value.trim();
        const brand_id = document.getElementById('admin-edit-p-brand').value.trim();
        const price = parseFloat(document.getElementById('admin-edit-p-price').value);
        const mrp = parseFloat(document.getElementById('admin-edit-p-mrp').value);
        const description = document.getElementById('admin-edit-p-desc').value.trim();
        const imageFile = document.getElementById('admin-edit-p-image').files[0];

        try {
          await API.adminUpdateProduct(productId, {
            name,
            category_id,
            brand_id,
            price,
            mrp,
            description
          });

          if (imageFile) {
            await API.adminUploadProductImage(productId, imageFile);
          }

          Utils.showToast('Product updated successfully!', 'success');
          modal.classList.remove('active');
          AdminManager.switchTab('products');
        } catch (err) {
          Utils.showToast(`Error updating product: ${err.message}`, 'error');
          saveButton.disabled = false;
          saveButton.innerText = 'Save Changes';
        }
      };
    } catch (err) {
      Utils.showToast(`Error fetching product: ${err.message}`, 'error');
    }
  },

  openEditCategoryModal(categoryId, categoryName, categoryImage) {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Edit Category</h3>
      <p style="font-size: 0.85rem; color: var(--medium-gray); margin-bottom: 1.25rem;">Updates category details in database.</p>

      <form id="admin-edit-category-form">
        <div class="form-group">
          <label class="form-label">Category Name *</label>
          <input type="text" id="admin-edit-c-name" class="form-control" value="${categoryName}" required />
        </div>

        <div class="form-group">
          <label class="form-label">Upload New Photo File (Optional)</label>
          <input type="file" id="admin-edit-c-file" class="form-control" accept="image/*" />
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save Changes</button>
          <button type="button" class="btn btn-outline" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Cancel</button>
        </div>
      </form>
    `;

    modal.classList.add('active');

    const form = document.getElementById('admin-edit-category-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const saveButton = form.querySelector('button[type="submit"]');
      saveButton.disabled = true;
      saveButton.innerText = 'Saving...';

      const name = document.getElementById('admin-edit-c-name').value.trim();
      const fileInput = document.getElementById('admin-edit-c-file');
      
      let image_url = categoryImage;
      if (fileInput && fileInput.files && fileInput.files[0]) {
        image_url = await this.compressImageFile(fileInput.files[0], 120, 120);
      }

      try {
        await API.adminUpdateCategory(categoryId, { name, image_url });
        Utils.showToast(`Category updated successfully!`, 'success');
        modal.classList.remove('active');
        this.switchTab('categories');
        if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
      } catch (err) {
        Utils.showToast(`Error updating category: ${err.message}`, 'error');
        saveButton.disabled = false;
        saveButton.innerText = 'Save Changes';
      }
    };
  },

  openEditBrandModal(brandId, brandName) {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Edit Brand</h3>
      <p style="font-size: 0.85rem; color: var(--medium-gray); margin-bottom: 1.25rem;">Updates brand details in database.</p>

      <form id="admin-edit-brand-form">
        <div class="form-group">
          <label class="form-label">Brand Name *</label>
          <input type="text" id="admin-edit-b-name" class="form-control" value="${brandName}" required />
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
          <button type="submit" class="btn btn-primary" style="flex: 1;">Save Changes</button>
          <button type="button" class="btn btn-outline" onclick="document.getElementById('order-detail-modal').classList.remove('active')">Cancel</button>
        </div>
      </form>
    `;

    modal.classList.add('active');

    const form = document.getElementById('admin-edit-brand-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const saveButton = form.querySelector('button[type="submit"]');
      saveButton.disabled = true;
      saveButton.innerText = 'Saving...';

      const name = document.getElementById('admin-edit-b-name').value.trim();

      try {
        await API.adminUpdateBrand(brandId, { name });
        Utils.showToast(`Brand updated successfully!`, 'success');
        modal.classList.remove('active');
        this.switchTab('categories');
        if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
      } catch (err) {
        Utils.showToast(`Error updating brand: ${err.message}`, 'error');
        saveButton.disabled = false;
        saveButton.innerText = 'Save Changes';
      }
    };
  },




  async updateWarehouseInventoryItem(productId, newQty, newReservedQty, warehouseId, refreshUserId = null) {
    try {
      const allInv = await API.getAllInventory();
      const invRecord = allInv.find(inv => 
        String(inv.product_id).toLowerCase() === String(productId).toLowerCase() && 
        String(inv.warehouse_id).toLowerCase() === String(warehouseId).toLowerCase()
      );
      
      if (!invRecord) {
        Utils.showToast('Inventory record not found', 'error');
        return;
      }

      await API.adminUpdateInventory(invRecord.id, {
        quantity: parseInt(newQty || 0),
        reserved_quantity: parseInt(newReservedQty || 0)
      });

      Utils.showToast('Inventory updated in database!', 'success');
      
      if (refreshUserId) {
        this.showUserDetails(refreshUserId);
      } else {
        this.showWarehouseDetails(warehouseId);
      }
    } catch (e) {
      Utils.showToast(`Update Failed: ${e.message}`, 'error');
    }
  },


  // 5. Warehouse Inventory Stock Management Tab
  async renderInventoryTab(container) {
    let inventory = [];
    try {
      inventory = await API.getAllInventory();
    } catch (e) {
      inventory = [];
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 style="font-weight: 800; font-size: 1.5rem; margin: 0;">📦 Stock Inventory (${inventory.length})</h2>
        <button class="btn btn-primary" onclick="AdminManager.openAddInventoryModal()">+ Assign Stock</button>
      </div>

      ${inventory.length === 0 ? `<p style="color: var(--medium-gray);">No stock records found.</p>` : `
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Inventory ID</th>
                <th>Product ID (UUID)</th>
                <th>Warehouse ID</th>
                <th>Total Stock</th>
                <th>Reserved Stock</th>
                <th>Available Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${inventory.map(item => `
                <tr>
                  <td><small style="user-select: all;">#${item.id}</small></td>
                  <td><strong style="user-select: all;">${item.product_id}</strong></td>
                  <td>🏬 <strong style="user-select: all;">${item.warehouse_id}</strong></td>
                  <td><span class="badge badge-confirmed">${item.quantity || 0}</span></td>
                  <td><span class="badge badge-pending">${item.reserved_quantity || 0}</span></td>
                  <td><strong style="color: var(--primary);">${item.available_quantity !== undefined ? item.available_quantity : (item.quantity - item.reserved_quantity)}</strong></td>
                  <td>
                    <button class="btn btn-outline btn-sm" onclick="AdminManager.deleteInventory('${item.id}')" style="color: var(--status-cancelled); border-color: var(--status-cancelled);">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  },




  async openAddInventoryModal() {
    let products = [], warehouses = [];
    try { products = await API.getProducts(); } catch (e) {}
    try { warehouses = await API.getWarehouses(); } catch (e) {}

    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Assign Stock to Warehouse</h3>
      <p style="font-size: 0.85rem; color: var(--medium-gray); margin-bottom: 1.25rem;">Type or paste the exact Product ID and Warehouse ID below.</p>

      <form id="admin-add-inventory-form">
        <div class="form-group">
          <label class="form-label">Product ID (Type or Paste UUID) *</label>
          <input type="text" id="admin-inv-product" class="form-control" list="inv-products-datalist" placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000" required />
          <datalist id="inv-products-datalist">
            ${products.map(p => `<option value="${p.id}">${p.name} (ID: ${p.id})</option>`).join('')}
          </datalist>
          <small style="color: var(--medium-gray); font-size: 0.78rem;">Tip: You can copy any Product ID from the Products Catalog tab.</small>
        </div>

        <div class="form-group">
          <label class="form-label">Warehouse ID (Type or Paste ID) *</label>
          <input type="text" id="admin-inv-warehouse" class="form-control" list="inv-warehouses-datalist" placeholder="e.g. wh-delhi-01 or warehouse UUID" required />
          <datalist id="inv-warehouses-datalist">
            ${warehouses.map(w => `<option value="${w.id}">${w.name || w.id}</option>`).join('')}
          </datalist>
          <small style="color: var(--medium-gray); font-size: 0.78rem;">Tip: You can type or pick from existing darkstore warehouses.</small>
        </div>

        <div class="form-group">
          <label class="form-label">Stock Quantity to Assign *</label>
          <input type="number" id="admin-inv-quantity" class="form-control" min="1" placeholder="e.g. 100" required />
        </div>

        <button type="submit" class="btn btn-primary btn-block" style="padding: 0.85rem;">Save Inventory Stock Record</button>
      </form>
    `;

    modal.classList.add('active');

    const form = document.getElementById('admin-add-inventory-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const product_id = document.getElementById('admin-inv-product').value.trim();
        const warehouse_id = document.getElementById('admin-inv-warehouse').value.trim();
        const quantity = parseInt(document.getElementById('admin-inv-quantity').value || 0);

        if (!product_id || !warehouse_id) {
          Utils.showToast('Please enter valid Product ID and Warehouse ID strings', 'warning');
          return;
        }

        try {
          await API.adminCreateInventory({ product_id, warehouse_id, quantity });
          Utils.showToast('Stock assigned to warehouse successfully!', 'success');
          modal.classList.remove('active');
          this.switchTab('inventory');
        } catch (err) {
          Utils.showToast(`Inventory Error: ${err.message}`, 'error');
        }
      };
    }
  },

  async deleteInventory(id) {
    if (!confirm('Are you sure you want to delete this inventory record?')) return;
    try {
      await API.adminDeleteInventory(id);
      Utils.showToast('Inventory record deleted', 'info');
      this.switchTab('inventory');
    } catch (e) {
      Utils.showToast(`Delete Error: ${e.message}`, 'error');
    }
  },

  openAddCategoryModal() {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Add Category</h3>
      <form id="admin-add-category-form">
        <div class="form-group">
          <label class="form-label">Category Name *</label>
          <input type="text" id="admin-c-name" class="form-control" placeholder="e.g. Fresh Fruits" required />
        </div>

        <div class="form-group">
          <label class="form-label">Upload Category Photo File 📁</label>
          <input type="file" id="admin-c-image-file" class="form-control" accept="image/*" />
        </div>

        <button type="submit" class="btn btn-primary btn-block">Upload Photo & Insert Category into Database</button>
      </form>
    `;

    modal.classList.add('active');

    const form = document.getElementById('admin-add-category-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('admin-c-name').value.trim();
        const fileInput = document.getElementById('admin-c-image-file');

        let image_url = '';
        if (fileInput && fileInput.files && fileInput.files[0]) {
          image_url = await this.compressImageFile(fileInput.files[0], 120, 120);
        }

        try {
          await API.adminCreateCategory({ name, image_url });
          Utils.showToast(`Category "${name}" created in database!`, 'success');
          modal.classList.remove('active');
          this.switchTab('categories');
          if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
        } catch (err) {
          Utils.showToast(`Error: ${err.message}`, 'error');
        }
      };
    }
  },

  openAddBrandModal() {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <h3 style="font-weight: 800; font-size: 1.3rem; margin-bottom: 0.5rem;">Add Brand</h3>
      <form id="admin-add-brand-form">
        <div class="form-group">
          <label class="form-label">Brand Name *</label>
          <input type="text" id="admin-b-name" class="form-control" placeholder="e.g. Nestle" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block">Add Brand to Database</button>
      </form>
    `;

    modal.classList.add('active');

    const form = document.getElementById('admin-add-brand-form');
    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const name = document.getElementById('admin-b-name').value.trim();
        try {
          await API.adminCreateBrand({ name });
          Utils.showToast(`Brand "${name}" created in database!`, 'success');
          modal.classList.remove('active');
          this.switchTab('categories');
          if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
        } catch (err) {
          Utils.showToast(`Error: ${err.message}`, 'error');
        }
      };
    }
  },

  async deleteCategory(id) {
    if (!confirm('Are you sure you want to delete this category from the database?')) return;
    try {
      await API.adminDeleteCategory(id);
      Utils.showToast('Category deleted from database', 'info');
      this.switchTab('categories');
      if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
    } catch (e) {
      Utils.showToast(`Delete Error: ${e.message}`, 'error');
    }
  },

  async deleteBrand(id) {
    if (!confirm('Are you sure you want to delete this brand from the database?')) return;
    try {
      await API.adminDeleteBrand(id);
      Utils.showToast('Brand deleted from database', 'info');
      this.switchTab('categories');
      if (window.HomeManager) window.HomeManager.loadCategoriesAndBrands();
    } catch (e) {
      Utils.showToast(`Delete Error: ${e.message}`, 'error');
    }
  },

  // 5. Orders Management Tab
  async renderOrdersTab(container) {
    let orders = [];
    try {
      orders = await API.adminGetAllOrders();
    } catch (e) {
      orders = [];
    }

    container.innerHTML = `
      <h2 style="font-weight: 800; font-size: 1.5rem; margin-bottom: 1.5rem;">All Customer Orders (${orders.length})</h2>

      ${orders.length === 0 ? `<p style="color: var(--medium-gray);">No orders recorded in Order Service.</p>` : `
        <div class="admin-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Delivery Address</th>
                <th>Warehouse</th>
                <th>Total</th>
                <th>Order Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${orders.map(o => `
                <tr>
                  <td><strong>#${o.id}</strong></td>
                  <td>${o.delivery_address || 'Address'}</td>
                  <td>${o.warehouse_id || 'WH'}</td>
                  <td>${Utils.formatCurrency(o.total_amount || 0)}</td>
                  <td>
                    <select class="status-select" onchange="AdminManager.updateOrderStatus('${o.id}', this.value)">
                      <option value="Pending" ${o.order_status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="Confirmed" ${o.order_status === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                      <option value="Packed" ${o.order_status === 'Packed' ? 'selected' : ''}>Packed</option>
                      <option value="Shipped" ${o.order_status === 'Shipped' ? 'selected' : ''}>Shipped</option>
                      <option value="Out For Delivery" ${o.order_status === 'Out For Delivery' ? 'selected' : ''}>Out For Delivery</option>
                      <option value="Delivered" ${o.order_status === 'Delivered' ? 'selected' : ''}>Delivered</option>
                      <option value="Cancelled" ${o.order_status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                  </td>
                  <td>
                    <button class="btn btn-outline btn-sm" style="color: var(--status-cancelled); border-color: var(--status-cancelled);" onclick="AdminManager.deleteOrder('${o.id}')">Delete</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `}
    `;
  },

  async updateOrderStatus(orderId, newStatus) {
    try {
      await API.adminUpdateOrderStatus(orderId, newStatus);
      Utils.showToast(`Order #${orderId} status updated to ${newStatus}`, 'success');
    } catch (e) {
      Utils.showToast(`Error: ${e.message}`, 'error');
    }
  },

  async deleteOrder(orderId) {
    if (!confirm('Delete order?')) return;
    try {
      await API.adminDeleteOrder(orderId);
      Utils.showToast('Order deleted', 'info');
      this.switchTab('orders');
    } catch (e) {
      Utils.showToast(`Error: ${e.message}`, 'error');
    }
  },

  // 6. Users Tab
  async renderUsersTab(container) {
    try {
      this.cachedUsers = await API.adminGetUsers();
    } catch (e) {
      this.cachedUsers = [];
      Utils.showToast(`Error fetching users: ${e.message}`, 'error');
    }

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <h2 style="font-weight: 800; font-size: 1.5rem; margin: 0;">User Accounts (<span id="user-count-display">${this.cachedUsers.length}</span>)</h2>
        
        <div style="display: flex; align-items: center; gap: 10px;">
          <select id="user-role-filter" class="status-select" style="padding: 6px 12px; font-weight: 600; border-radius: var(--radius-sm); border-color: var(--border-color); min-width: 180px;" onchange="AdminManager.filterUsersByRole(this.value)">
            <option value="all" selected>All (Customers & Managers)</option>
            <option value="customer">Customer</option>
            <option value="inventory_manager">Inventory Manager</option>
          </select>
        </div>
      </div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody id="users-table-body">
            <!-- Dynamic rows will be rendered here -->
          </tbody>
        </table>
      </div>
    `;

    this.filterUsersByRole('all');
  },

  filterUsersByRole(role) {
    let filtered = [];
    if (role === 'all') {
      filtered = this.cachedUsers.filter(u => {
        const uRole = String(u.role || 'customer').toLowerCase();
        return uRole === 'customer' || uRole === 'inventory manager' || uRole === 'inventory_manager';
      });
    } else {
      filtered = this.cachedUsers.filter(u => {
        const uRole = String(u.role || 'customer').toLowerCase();
        const matchRole = role === 'inventory_manager' ? 'inventory manager' : role;
        return uRole === matchRole;
      });
    }

    const countDisplay = document.getElementById('user-count-display');
    if (countDisplay) {
      countDisplay.innerText = filtered.length;
    }

    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: var(--medium-gray); padding: 2rem;">No matching users found in Auth Service database.</td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(u => {
      const displayRole = u.role || 'customer';
      let badgeClass = 'badge-confirmed';
      if (String(displayRole).toLowerCase() === 'inventory manager' || String(displayRole).toLowerCase() === 'inventory_manager') {
        badgeClass = 'badge-pending';
      } else if (String(displayRole).toLowerCase() === 'admin') {
        badgeClass = 'badge-packed';
      }

      return `
        <tr onclick="AdminManager.showUserDetails('${u.id}')" style="cursor: pointer;" title="Click to view details">
          <td><small style="user-select: all; font-family: monospace; background: var(--light-gray); padding: 2px 6px; border-radius: 4px;">${u.id || 'N/A'}</small></td>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge ${badgeClass}">${displayRole}</span></td>
        </tr>
      `;
    }).join('');
  },

  async showUserDetails(userId) {
    const user = this.cachedUsers.find(u => String(u.id) === String(userId));
    if (!user) {
      Utils.showToast('User not found', 'error');
      return;
    }

    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div style="padding: 2rem; text-align: center;">
        <p>Loading user details...</p>
      </div>
    `;
    modal.classList.add('active');

    try {
      const isManager = String(user.role || 'customer').toLowerCase() === 'inventory manager' || 
                        String(user.role || 'customer').toLowerCase() === 'inventory_manager';

      const displayRole = user.role || 'customer';
      let badgeClass = 'badge-confirmed';
      if (isManager) {
        badgeClass = 'badge-pending';
      } else if (String(displayRole).toLowerCase() === 'admin') {
        badgeClass = 'badge-packed';
      }

      let extraContentHTML = '';

      if (isManager) {
        // Fetch warehouse managed by this user
        let warehouse = null;
        try {
          warehouse = await API.getWarehouseByManager(user.id);
        } catch (e) {
          warehouse = null;
        }

        if (warehouse) {
          // Fetch inventory items for this warehouse
          let inventoryItems = [];
          try {
            inventoryItems = await API.getWarehouseProducts(warehouse.id);
          } catch (e) {
            inventoryItems = [];
          }

          extraContentHTML = `
            <h4 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; color: var(--dark-gray); display: flex; justify-content: space-between; align-items: center;">
              <span>🏬 Managed Darkstore Warehouse</span>
              <span style="background: var(--primary-light); color: var(--primary); padding: 2px 8px; border-radius: 20px; font-size: 0.85rem;">Active</span>
            </h4>

            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.88rem;">
              <div><strong>Warehouse Name:</strong> ${warehouse.name || 'N/A'}</div>
              <div><strong>Coordinates:</strong> Lat ${warehouse.lat || '0'}, Lng ${warehouse.lng || '0'}</div>
              <div><strong>Hours:</strong> ${warehouse.opening_time || '00:00'} - ${warehouse.closing_time || '00:00'}</div>
              <div><strong>Capacity:</strong> ${warehouse.capacity || 'Unlimited'} units</div>
            </div>

            <h4 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; color: var(--dark-gray); display: flex; justify-content: space-between; align-items: center;">
              <span>📦 Stock Inventory</span>
              <span style="background: var(--primary-light); color: var(--primary); padding: 2px 8px; border-radius: 20px; font-size: 0.85rem;">${inventoryItems.length} Products</span>
            </h4>

            <div style="max-height: 250px; overflow-y: auto; padding-right: 4px;">
              ${inventoryItems.length === 0 ? `
                <div style="text-align: center; padding: 2rem; color: var(--medium-gray);">
                  <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏬</div>
                  <p style="font-weight: 600;">No products in stock for this warehouse.</p>
                </div>
              ` : `
                <div class="admin-table-wrapper" style="margin-top: 0; max-height: 200px;">
                  <table class="admin-table" style="font-size: 0.82rem;">
                    <thead>
                      <tr>
                        <th>Product ID</th>
                        <th>Product Name</th>
                        <th>Brand Name</th>
                        <th>Category Name</th>
                        <th>Stock</th>
                        <th>Reserved</th>
                        <th>Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${inventoryItems.map(item => {
                        const prodName = item.name || item.product_name || (item.product && item.product.name) || 'Product';
                        const pId = String(item.product_id || item.productId || item.id || 'N/A');
                        const bId = item.brand_id || (item.product && item.product.brand_id) || 'N/A';
                        const cId = item.category_id || (item.product && item.product.category_id) || 'N/A';
                        const qty = item.quantity !== undefined ? item.quantity : 0;
                        const resQty = item.reserved_quantity !== undefined ? item.reserved_quantity : 0;
                        const availQty = item.available_quantity !== undefined ? item.available_quantity : (qty - resQty);
                        return `
                          <tr>
                            <td>
                              <a href="javascript:void(0)" onclick="AdminManager.showProductDetailsInModal('${pId}')" style="color: var(--primary); font-weight: 700; text-decoration: underline;" title="Click to view product details">
                                ${pId}
                              </a>
                            </td>
                            <td><strong>${prodName}</strong></td>
                            <td><small class="resolve-brand" data-id="${bId}">Loading...</small></td>
                            <td><small class="resolve-category" data-id="${cId}">Loading...</small></td>
                            <td>
                              <input type="number" class="status-select" style="width: 70px; text-align: center; font-weight: 700; padding: 2px 4px;" value="${qty}" onchange="AdminManager.updateWarehouseInventoryItem('${pId}', this.value, '${resQty}', '${warehouse.id}', '${user.id}')" />
                            </td>
                            <td>
                              <input type="number" class="status-select" style="width: 70px; text-align: center; font-weight: 700; padding: 2px 4px;" value="${resQty}" onchange="AdminManager.updateWarehouseInventoryItem('${pId}', '${qty}', this.value, '${warehouse.id}', '${user.id}')" />
                            </td>
                            <td><strong style="color: var(--primary);">${availQty}</strong></td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>


              `}
            </div>
          `;
        } else {
          extraContentHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--medium-gray); border: 1px dashed var(--border-color); border-radius: var(--radius-md);">
              <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏬</div>
              <p style="font-weight: 600;">This manager is not assigned to any darkstore warehouse.</p>
            </div>
          `;
        }
      } else {
        // Customer - Show user details and order history
        const orders = await API.adminGetAllOrders();
        const userOrders = orders.filter(o => String(o.user_id).toLowerCase() === String(user.id).toLowerCase());

        extraContentHTML = `
          <h4 style="font-size: 1.15rem; font-weight: 800; margin-bottom: 1rem; border-bottom: 2px solid var(--border-color); padding-bottom: 0.5rem; color: var(--dark-gray); display: flex; justify-content: space-between; align-items: center;">
            <span>📦 Order History</span>
            <span style="background: var(--primary-light); color: var(--primary); padding: 2px 8px; border-radius: 20px; font-size: 0.85rem;">${userOrders.length} Orders</span>
          </h4>

          <div style="max-height: 250px; overflow-y: auto; padding-right: 4px;">
            ${userOrders.length === 0 ? `
              <div style="text-align: center; padding: 2rem; color: var(--medium-gray);">
                <div style="font-size: 3rem; margin-bottom: 0.5rem;">📦</div>
                <p style="font-weight: 600;">No orders found in the Order Service database for this user.</p>
              </div>
            ` : userOrders.map(o => {
              const status = o.order_status || 'Pending';
              const oId = o.id || o.order_id;
              const dateStr = o.created_at ? new Date(o.created_at).toLocaleString() : 'Recent';
              const statusClassMap = {
                'Pending': 'badge-pending',
                'Confirmed': 'badge-confirmed',
                'Packed': 'badge-packed',
                'Shipped': 'badge-shipped',
                'Out For Delivery': 'badge-out',
                'Delivered': 'badge-delivered',
                'Cancelled': 'badge-cancelled'
              };
              const statusBadgeClass = statusClassMap[status] || 'badge-pending';

              return `
                <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem; background: var(--white); box-shadow: var(--shadow-sm);">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
                    <div>
                      <strong style="color: var(--dark); font-size: 0.95rem;">Order #${oId}</strong>
                      <span style="font-size: 0.75rem; color: var(--medium-gray); display: block; margin-top: 2px;">${dateStr}</span>
                    </div>
                    <span class="badge ${statusBadgeClass}">${status}</span>
                  </div>
                  
                  <div style="font-size: 0.85rem; color: var(--dark-gray); background: #f8fafc; padding: 8px 12px; border-radius: var(--radius-sm); margin-bottom: 0.75rem; border: 1px solid var(--border-color);">
                    <strong>📍 Address:</strong> ${o.delivery_address || 'N/A'}
                  </div>

                  <div style="margin-bottom: 0.75rem;">
                    <span style="font-size: 0.8rem; color: var(--medium-gray); font-weight: 700; display: block; margin-bottom: 4px;">Items:</span>
                    ${(o.items || []).map(item => {
                      const pId = String(item.product_id);
                      return `
                        <div style="display: flex; justify-content: space-between; font-size: 0.82rem; padding: 2px 0;">
                          <span style="color: var(--dark-gray);">
                            Product 
                            <a href="javascript:void(0)" onclick="AdminManager.showProductDetailsInModal('${pId}')" style="color: var(--primary); font-weight: 700; text-decoration: underline;" title="Click to view product details">
                              #${pId}
                            </a>
                            <span style="color: var(--medium-gray);">x${item.quantity}</span>
                          </span>
                          <strong style="color: var(--dark);">${Utils.formatCurrency(item.price)}</strong>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border-color); padding-top: 0.5rem; margin-top: 0.5rem;">
                    <span style="font-size: 0.85rem; color: var(--dark-gray); font-weight: 600;">Total Amount</span>
                    <strong style="font-size: 1rem; color: var(--primary); font-weight: 800;">${Utils.formatCurrency(o.total_amount || 0)}</strong>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
      }

      modalContent.innerHTML = `
        <h3 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 1.25rem; color: var(--primary); display: flex; align-items: center; gap: 8px;">
          👤 User Account Details
        </h3>

        <!-- User Information Grid -->
        <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Full Name</span>
            <strong style="font-size: 1.05rem; color: var(--dark); word-break: break-all; display: block; max-width: 100%;">${user.name}</strong>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Email Address</span>
            <strong style="font-size: 1.05rem; color: var(--dark); word-break: break-all; display: block; max-width: 100%;">${user.email}</strong>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">Role</span>
            <span class="badge ${badgeClass}" style="display: inline-block; margin-top: 4px; font-weight: 700;">${displayRole}</span>
          </div>
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block; font-weight: 600;">User ID (UUID)</span>
            <code id="user-details-uuid" style="user-select: all; font-size: 0.8rem; background: var(--light-gray); padding: 2px 6px; border-radius: 4px; font-family: monospace; display: block; margin-top: 4px; word-break: break-all; max-width: 100%;" title="Click to copy">${String(user.id || 'N/A')}</code>
          </div>
        </div>

        ${extraContentHTML}
      `;

      NameResolver.resolveElements();
    } catch (err) {
      modalContent.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--status-cancelled);">
          <h3>Error Fetching Details</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

};

