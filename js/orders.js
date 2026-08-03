/* Orders Manager, Backend History & Tracking */

const OrdersManager = {
  async renderOrdersView() {
    const container = document.getElementById('orders-view-container');
    if (!container) return;

    if (!Auth.requireAuth()) return;

    container.innerHTML = `<div style="text-align: center; padding: 3rem;">Fetching your orders from Order Service...</div>`;

    try {
      const orders = await API.getOrders();

      if (!orders || orders.length === 0) {
        container.innerHTML = `
          <div class="empty-state" style="background: var(--white); border-radius: var(--radius-lg); padding: 4rem 2rem;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">📦</div>
            <h2 class="empty-state-title">No Orders Found</h2>
            <p class="empty-state-desc">You have no order history in the Order Service database.</p>
            <button class="btn btn-primary" onclick="window.location.hash='#home'">Explore Products</button>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <div class="orders-list-container">
          <h2 style="font-weight: 800; font-size: 1.5rem; margin-bottom: 0.5rem;">My Orders</h2>
          ${orders.map(order => this.createOrderCardHTML(order)).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = `
        <div class="empty-state" style="background: var(--white); border-radius: var(--radius-lg); padding: 3rem;">
          <h3 style="color: var(--status-cancelled);">Error Loading Orders</h3>
          <p>${e.message}</p>
        </div>
      `;
    }
  },

  createOrderCardHTML(order) {
    const statusClassMap = {
      'Pending': 'badge-pending',
      'Confirmed': 'badge-confirmed',
      'Packed': 'badge-packed',
      'Shipped': 'badge-shipped',
      'Out For Delivery': 'badge-out',
      'Delivered': 'badge-delivered',
      'Cancelled': 'badge-cancelled'
    };

    const status = order.order_status || order.status || 'Pending';
    const badgeClass = statusClassMap[status] || 'badge-pending';
    const items = order.items || [];
    const orderId = order.id || order.order_id || order.orderId;
    const totalAmount = order.total_amount !== undefined ? order.total_amount : order.totalAmount;
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleString() : (order.orderedDate || 'Recent');

    return `
      <div class="order-card">
        <div class="order-card-header">
          <div class="order-id-info">
            <h3>Order #${orderId}</h3>
            <span class="order-date">${dateStr}</span>
          </div>
          <span class="badge ${badgeClass}">${status}</span>
        </div>

        <div class="order-items-preview">
          ${items.map(item => `
            <div style="font-size: 0.88rem; font-weight: 700; color: var(--dark-gray); padding: 4px 8px; background: var(--light-gray); border-radius: var(--radius-sm);">
              Product #${item.product_id || item.productId} (x${item.quantity})
            </div>
          `).join('')}
        </div>

        <div class="order-card-footer">
          <div>
            <span style="font-size: 0.8rem; color: var(--medium-gray); display: block;">Total Amount</span>
            <span class="order-total-price">${Utils.formatCurrency(totalAmount)}</span>
          </div>
          <button class="btn btn-outline btn-sm" onclick="OrdersManager.openOrderDetailModal('${orderId}')">
            View Details & Tracker
          </button>
        </div>
      </div>
    `;
  },

  async openOrderDetailModal(orderId) {
    const modal = document.getElementById('order-detail-modal');
    const modalContent = document.getElementById('order-detail-modal-body');
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `<div style="padding: 2rem; text-align: center;">Fetching order details from backend...</div>`;
    modal.classList.add('active');

    try {
      const order = await API.getOrderById(orderId);
      const steps = ['Pending', 'Confirmed', 'Packed', 'Out For Delivery', 'Delivered'];
      const status = order.order_status || order.status || 'Pending';
      const currentStepIndex = steps.indexOf(status) !== -1 ? steps.indexOf(status) : 0;

      modalContent.innerHTML = `
        <h3 style="font-size: 1.25rem; font-weight: 800; margin-bottom: 0.25rem;">Order Tracker #${order.id || orderId}</h3>
        <p style="font-size: 0.88rem; color: var(--medium-gray); margin-bottom: 1.5rem;">Payment Status: <strong>${order.payment_status || 'Paid'}</strong></p>

        <!-- Status Timeline -->
        <div class="order-timeline">
          ${steps.map((step, idx) => `
            <div class="timeline-step ${idx <= currentStepIndex ? 'completed' : ''}">
              <div class="timeline-step-icon">${idx <= currentStepIndex ? '✓' : idx + 1}</div>
              <span>${step}</span>
            </div>
          `).join('')}
        </div>

        <div style="background: var(--light-gray); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.9rem; font-weight: 800; margin-bottom: 6px;">📍 Delivery Address</h4>
          <p style="font-size: 0.88rem; color: var(--dark-gray);">${order.delivery_address || order.address || 'Address'}</p>
          <p style="font-size: 0.8rem; color: var(--primary); font-weight: 700; margin-top: 4px;">Warehouse ID: ${order.warehouse_id || 'Hub'}</p>
        </div>

        <h4 style="font-size: 0.95rem; font-weight: 800; margin-bottom: 0.75rem;">Order Items</h4>
        <div>
          ${(order.items || []).map(item => `
            <div class="cart-item-row" style="padding: 0.5rem 0;">
              <div class="cart-item-info">
                <div style="font-size: 0.88rem; font-weight: 700;">Product #${item.product_id}</div>
                <div style="font-size: 0.8rem; color: var(--medium-gray);">${item.quantity} x ${Utils.formatCurrency(item.price)}</div>
              </div>
              <div style="font-weight: 800;">${Utils.formatCurrency(item.subtotal || item.quantity * item.price)}</div>
            </div>
          `).join('')}
        </div>

        <div class="bill-row grand-total" style="border-top: 1px solid var(--border-color); padding-top: 0.75rem; margin-top: 1rem;">
          <span>Total Paid</span>
          <span>${Utils.formatCurrency(order.total_amount || order.totalAmount)}</span>
        </div>
      `;
    } catch (e) {
      modalContent.innerHTML = `<div style="padding: 2rem; color: var(--status-cancelled);">Error: ${e.message}</div>`;
    }
  }
};
