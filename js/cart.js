/* Cart State Manager, Calculations & Backend Cart Sync */

const CartManager = {
  cartItems: [],

  async syncCartFromBackend() {
    if (!Auth.isLoggedIn()) {
      this.cartItems = Utils.storage.get('quicko_cart', []);
      return this.cartItems;
    }

    try {
      const backendCart = await API.getCart();
      if (Array.isArray(backendCart)) {
        this.cartItems = backendCart;
        Utils.storage.set('quicko_cart', backendCart);
      }
    } catch (e) {
      console.warn('Could not sync backend cart:', e.message);
      this.cartItems = Utils.storage.get('quicko_cart', []);
    }
    return this.cartItems;
  },

  getCartItems() {
    return Utils.storage.get('quicko_cart', []);
  },

  async handleAddToCart(productId, price, quantity = 1) {
    if (!Auth.requireAuth()) return;

    const warehouseId = Utils.storage.get('warehouse_id', 'wh-delhi-01');

    try {
      await API.addToCart(productId, warehouseId, price, quantity);
      Utils.showToast('Item added to cart! 🛒', 'success');
      await this.syncCartFromBackend();
      this.updateCartBadge();
      this.renderCartDrawer();

      if (window.HomeManager) {
        window.HomeManager.renderProducts();
      }
    } catch (err) {
      Utils.showToast(err.message || 'Failed to add item to cart', 'error');
    }
  },

  async handleBuyNow(productId, price) {
    if (!Auth.requireAuth()) return;

    await this.handleAddToCart(productId, price, 1);
    window.location.hash = '#checkout';
  },

  async updateQuantity(cartItemId, newQty) {
    if (!Auth.requireAuth()) return;

    try {
      if (newQty <= 0) {
        await API.deleteCart(cartItemId);
        Utils.showToast('Item removed from cart', 'info');
      } else {
        await API.updateCart(cartItemId, newQty);
      }
      await this.syncCartFromBackend();
      this.updateCartBadge();
      this.renderCartDrawer();

      if (window.location.hash === '#cart') {
        this.renderDedicatedCartView();
      }

      if (window.HomeManager) {
        window.HomeManager.renderProducts();
      }
    } catch (err) {
      Utils.showToast(err.message || 'Could not update cart quantity', 'error');
    }
  },

  calculateBill() {
    const items = this.getCartItems();
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * (item.quantity || 1)), 0);
    const totalMrp = items.reduce((sum, item) => sum + (parseFloat(item.mrp || item.price || 0) * (item.quantity || 1)), 0);
    const savings = Math.max(0, totalMrp - subtotal);
    const taxes = Math.round(subtotal * 0.05); // 5% GST
    const deliveryCharge = subtotal > 199 || items.length === 0 ? 0 : 15;
    const grandTotal = subtotal + taxes + deliveryCharge;

    return {
      subtotal,
      totalMrp,
      savings,
      taxes,
      deliveryCharge,
      grandTotal,
      itemCount: items.reduce((sum, item) => sum + (item.quantity || 1), 0)
    };
  },

  updateCartBadge() {
    if (Auth.isLoggedIn() && Auth.isAdmin()) {
      const badges = document.querySelectorAll('.cart-badge-count');
      badges.forEach(b => { b.innerText = '0'; });
      const floatBar = document.getElementById('mobile-cart-float-bar');
      if (floatBar) floatBar.classList.remove('active');
      return;
    }

    const bill = this.calculateBill();
    const badges = document.querySelectorAll('.cart-badge-count');
    badges.forEach(b => { b.innerText = bill.itemCount; });

    const floatBar = document.getElementById('mobile-cart-float-bar');
    if (floatBar) {
      if (bill.itemCount > 0) {
        floatBar.classList.add('active');
        floatBar.innerHTML = `
          <div>
            <span>${bill.itemCount} ITEMS</span> •
            <strong>${Utils.formatCurrency(bill.grandTotal)}</strong>
          </div>
          <button onclick="CartManager.openDrawer()" style="color: var(--white); font-weight: 800;">View Cart →</button>
        `;
      } else {
        floatBar.classList.remove('active');
      }
    }
  },

  async openDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (backdrop) {
      await this.syncCartFromBackend();
      this.renderCartDrawer();
      backdrop.classList.add('active');
    }
  },

  closeDrawer() {
    const backdrop = document.getElementById('cart-drawer-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
    }
  },

  renderCartDrawer() {
    const container = document.getElementById('cart-drawer-body');
    const footerContainer = document.getElementById('cart-drawer-footer');
    if (!container) return;

    const items = this.getCartItems();
    const bill = this.calculateBill();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
          <h3 class="empty-state-title">Your Cart is Empty</h3>
          <p class="empty-state-desc">Add products from our darkstore to view items here.</p>
        </div>
      `;
      if (footerContainer) footerContainer.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        ${items.map(item => `
          <div class="cart-item-row">
            <img src="${item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}" class="cart-item-img" alt="${item.name || 'Product'}" />
            <div class="cart-item-info">
              <h4 class="cart-item-name">${item.name || 'Product #' + (item.product_id || item.productId)}</h4>
              <div class="cart-item-price">${Utils.formatCurrency(item.price)}</div>
            </div>
            <div class="cart-item-actions">
              <div class="qty-controller">
                <button class="qty-btn" onclick="CartManager.updateQuantity('${item.id || item.product_id || item.productId}', ${item.quantity - 1})">-</button>
                <span class="qty-value">${item.quantity}</span>
                <button class="qty-btn" onclick="CartManager.updateQuantity('${item.id || item.product_id || item.productId}', ${item.quantity + 1})">+</button>
              </div>
              <span class="cart-item-remove" onclick="CartManager.updateQuantity('${item.id || item.product_id || item.productId}', 0)">🗑️</span>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="bill-card">
        <h4 class="bill-card-title">Bill Details</h4>
        <div class="bill-row">
          <span>Item Total</span>
          <span>${Utils.formatCurrency(bill.subtotal)}</span>
        </div>
        <div class="bill-row">
          <span>Delivery Charge</span>
          <span>${bill.deliveryCharge === 0 ? '<span class="free-tag">FREE</span>' : Utils.formatCurrency(bill.deliveryCharge)}</span>
        </div>
        <div class="bill-row">
          <span>Taxes (5%)</span>
          <span>${Utils.formatCurrency(bill.taxes)}</span>
        </div>
        <div class="bill-row grand-total">
          <span>Grand Total</span>
          <span>${Utils.formatCurrency(bill.grandTotal)}</span>
        </div>
      </div>
    `;

    if (footerContainer) {
      footerContainer.innerHTML = `
        <div class="cart-delivery-banner">
          ⚡ <span>10 MINS Delivery to <strong>${Utils.storage.get('user_address', 'Home')}</strong></span>
        </div>
        <button class="btn btn-primary btn-block" style="padding: 0.9rem; font-size: 1.05rem;" onclick="CartManager.closeDrawer(); window.location.hash='#checkout';">
          Proceed to Checkout (${Utils.formatCurrency(bill.grandTotal)}) →
        </button>
      `;
    }
  },

  async renderDedicatedCartView() {
    const container = document.getElementById('cart-view-container');
    if (!container) return;

    await this.syncCartFromBackend();
    const items = this.getCartItems();
    const bill = this.calculateBill();

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="background: var(--white); border-radius: var(--radius-lg); padding: 4rem 2rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
          <h2 class="empty-state-title">Your Cart is Empty</h2>
          <p class="empty-state-desc">You have no items in your cart. Add items to get superfast 10-minute delivery!</p>
          <button class="btn btn-primary" onclick="window.location.hash='#home'">Start Shopping</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="cart-view-grid">
        <div style="background: var(--white); border-radius: var(--radius-lg); padding: 1.5rem; border: 1px solid var(--border-color);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
            <h3 style="font-weight: 800;">Items in Cart (${bill.itemCount})</h3>
            <button class="btn btn-outline btn-sm" onclick="CartManager.clearCart()">Clear Cart</button>
          </div>
          ${items.map(item => `
            <div class="cart-item-row">
              <img src="${item.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100'}" class="cart-item-img" style="width: 70px; height: 70px;" />
              <div class="cart-item-info">
                <h4 class="cart-item-name" style="font-size: 1rem;">${item.name || 'Product #' + (item.product_id || item.productId)}</h4>
                <div class="cart-item-price" style="font-size: 1.1rem;">${Utils.formatCurrency(item.price)}</div>
              </div>
              <div class="cart-item-actions">
                <div class="qty-controller" style="height: 40px;">
                  <button class="qty-btn" onclick="CartManager.updateQuantity('${item.id || item.product_id || item.productId}', ${item.quantity - 1})">-</button>
                  <span class="qty-value">${item.quantity}</span>
                  <button class="qty-btn" onclick="CartManager.updateQuantity('${item.id || item.product_id || item.productId}', ${item.quantity + 1})">+</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>

        <div>
          <div class="bill-card" style="margin-top: 0; background: var(--white); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem;">
            <h4 class="bill-card-title">Order Summary</h4>
            <div class="bill-row"><span>Subtotal</span><span>${Utils.formatCurrency(bill.subtotal)}</span></div>
            <div class="bill-row"><span>Delivery Fee</span><span>${bill.deliveryCharge === 0 ? 'FREE' : Utils.formatCurrency(bill.deliveryCharge)}</span></div>
            <div class="bill-row"><span>Taxes (5%)</span><span>${Utils.formatCurrency(bill.taxes)}</span></div>
            <div class="bill-row grand-total"><span>Grand Total</span><span>${Utils.formatCurrency(bill.grandTotal)}</span></div>
            
            <button class="btn btn-primary btn-block" style="margin-top: 1.5rem; padding: 1rem;" onclick="window.location.hash='#checkout'">
              Proceed to Checkout →
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async clearCart() {
    try {
      await API.clearCart();
      Utils.storage.set('quicko_cart', []);
      this.updateCartBadge();
      this.renderDedicatedCartView();
      Utils.showToast('Cart cleared', 'info');
    } catch (e) {
      Utils.showToast('Could not clear cart', 'error');
    }
  }
};
