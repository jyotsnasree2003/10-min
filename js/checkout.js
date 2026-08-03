/* Checkout Manager & Backend Order Creation */

const CheckoutManager = {
  renderCheckoutView() {
    const container = document.getElementById('checkout-view-container');
    if (!container) return;

    if (!Auth.requireAuth()) return;

    const items = CartManager.getCartItems();
    if (items.length === 0) {
      window.location.hash = '#cart';
      return;
    }

    const bill = CartManager.calculateBill();
    const address = Utils.storage.get('user_address', 'Default Address');
    const warehouseId = Utils.storage.get('warehouse_id', 'wh-delhi-01');

    container.innerHTML = `
      <div class="checkout-grid">
        <div class="checkout-left-col">
          
          <!-- Step 1: Delivery Address & Warehouse -->
          <div class="checkout-section-card">
            <div class="checkout-card-header">
              <span class="step-badge">1</span>
              <span>Delivery Address & Darkstore</span>
            </div>
            <div class="address-box">
              <div class="address-details-text">
                <h4>📍 Delivery Address</h4>
                <p>${address}</p>
                <div class="warehouse-chip-info">
                  🏬 Darkstore Warehouse: <strong>${warehouseId}</strong>
                </div>
              </div>
              <button class="btn btn-outline btn-sm" onclick="window.location.hash='#location'">Change</button>
            </div>
          </div>

          <!-- Step 2: Items Review -->
          <div class="checkout-section-card">
            <div class="checkout-card-header">
              <span class="step-badge">2</span>
              <span>Order Items (${bill.itemCount})</span>
            </div>
            <div>
              ${items.map(item => `
                <div class="cart-item-row">
                  <div class="cart-item-info">
                    <h4 class="cart-item-name">${item.name || 'Product #' + (item.product_id || item.productId)}</h4>
                    <div class="cart-item-price">${item.quantity} x ${Utils.formatCurrency(item.price)}</div>
                  </div>
                  <div style="font-weight: 800; font-size: 1rem;">
                    ${Utils.formatCurrency(item.quantity * item.price)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Step 3: Payment Options -->
          <div class="checkout-section-card">
            <div class="checkout-card-header">
              <span class="step-badge">3</span>
              <span>Select Payment Method</span>
            </div>
            <div class="payment-options-grid">
              <label class="payment-option-card selected">
                <input type="radio" name="payment_mode" value="UPI" checked />
                <div>
                  <div class="payment-option-title">⚡ Instant UPI / GPay / PhonePe</div>
                  <div class="payment-option-subtitle">Fastest 10-sec checkout</div>
                </div>
              </label>

              <label class="payment-option-card">
                <input type="radio" name="payment_mode" value="Card" />
                <div>
                  <div class="payment-option-title">💳 Credit / Debit Card</div>
                  <div class="payment-option-subtitle">Visa, Mastercard, RuPay</div>
                </div>
              </label>

              <label class="payment-option-card">
                <input type="radio" name="payment_mode" value="COD" />
                <div>
                  <div class="payment-option-title">💵 Cash on Delivery</div>
                  <div class="payment-option-subtitle">Pay cash at doorstep</div>
                </div>
              </label>
            </div>
          </div>

        </div>

        <!-- Right Bill Column -->
        <div class="checkout-right-col">
          <div class="bill-card" style="margin-top: 0; background: var(--white); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1.5rem; position: sticky; top: 90px;">
            <h4 class="bill-card-title">Payment Summary</h4>
            <div class="bill-row"><span>Items Subtotal</span><span>${Utils.formatCurrency(bill.subtotal)}</span></div>
            <div class="bill-row"><span>Delivery Fee (10 Mins)</span><span>${bill.deliveryCharge === 0 ? 'FREE' : Utils.formatCurrency(bill.deliveryCharge)}</span></div>
            <div class="bill-row"><span>Govt Taxes (5%)</span><span>${Utils.formatCurrency(bill.taxes)}</span></div>
            <div class="bill-row grand-total"><span>Total Payable</span><span>${Utils.formatCurrency(bill.grandTotal)}</span></div>

            <button id="btn-place-order" class="btn btn-primary btn-block" style="margin-top: 1.5rem; padding: 1rem; font-size: 1.1rem;" onclick="CheckoutManager.placeOrder()">
              Place Order (${Utils.formatCurrency(bill.grandTotal)}) 🚀
            </button>
          </div>
        </div>
      </div>
    `;
  },

  async placeOrder() {
    const btn = document.getElementById('btn-place-order');
    if (btn) {
      btn.disabled = true;
      btn.innerText = 'Calling Order Service...';
    }

    try {
      const items = CartManager.getCartItems();
      const bill = CartManager.calculateBill();
      const paymentMode = document.querySelector('input[name="payment_mode"]:checked')?.value || 'UPI';

      const orderData = {
        items,
        totalAmount: bill.grandTotal,
        paymentMethod: paymentMode,
        address: Utils.storage.get('user_address', 'Default Address'),
        warehouseId: Utils.storage.get('warehouse_id', 'wh-delhi-01')
      };

      const createdOrder = await API.createOrder(orderData);

      Utils.storage.set('last_placed_order', createdOrder);
      await API.clearCart().catch(() => {});
      Utils.storage.set('quicko_cart', []);
      CartManager.updateCartBadge();

      window.location.hash = '#order-success';
    } catch (err) {
      Utils.showToast(`Order Service Error: ${err.message}`, 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerText = 'Place Order';
      }
    }
  },

  renderOrderSuccessView() {
    const container = document.getElementById('order-success-view-container');
    if (!container) return;

    const order = Utils.storage.get('last_placed_order', {});
    const orderId = order.id || order.order_id || order.orderId || 'Order-Submitted';

    container.innerHTML = `
      <div class="success-card">
        <div class="success-icon-animated">✓</div>
        <h2 style="font-size: 1.8rem; font-weight: 900; margin-bottom: 0.5rem; color: var(--dark);">Order Created in Order Service!</h2>
        <p style="color: var(--medium-gray); font-size: 1rem;">Backend Order ID: <strong style="color: var(--dark);">${orderId}</strong></p>

        <div class="delivery-eta-badge">
          ⚡ Estimated Delivery in <span>10 Mins</span> 🚀
        </div>

        <p style="color: var(--dark-gray); max-width: 420px; margin: 0 auto 2rem auto; font-size: 0.95rem;">
          Your order record has been created in the backend Order Service database.
        </p>

        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button class="btn btn-outline" onclick="window.location.hash='#home'">Continue Shopping</button>
          <button class="btn btn-primary" onclick="window.location.hash='#orders'">View Orders in Backend</button>
        </div>
      </div>
    `;
  }
};
