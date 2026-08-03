/* Profile Page Manager */

const ProfileManager = {
  renderProfileView() {
    const container = document.getElementById('profile-view-container');
    if (!container) return;

    if (!Auth.requireAuth()) return;

    const user = Auth.getUser();
    const address = Utils.storage.get('user_address', 'Default Address, New Delhi');
    const warehouseId = Utils.storage.get('warehouse_id', 'wh-delhi-01');
    const isAdmin = String(user.role || '').toLowerCase() === 'admin';

    container.innerHTML = `
      <div class="profile-grid">
        <div class="profile-sidebar-card">
          <div class="profile-avatar-circle">
            ${(user.name || 'U').charAt(0).toUpperCase()}
          </div>
          <h2 class="profile-name">${user.name || 'Customer'}</h2>
          <p class="profile-email">${user.email || 'customer@quicko.com'}</p>

          <div class="profile-nav-menu">
            ${isAdmin ? '' : `
              <button class="profile-nav-btn active" onclick="window.location.hash='#profile'">👤 My Profile</button>
              <button class="profile-nav-btn" onclick="window.location.hash='#orders'">📦 My Orders</button>
              <button class="profile-nav-btn" onclick="window.location.hash='#location'">📍 Saved Location</button>
            `}
            <button class="profile-nav-btn" style="color: var(--status-cancelled);" onclick="Auth.logout()">🚪 Logout</button>
          </div>

        </div>

        <div class="profile-content-card">
          <h3 style="font-size: 1.3rem; font-weight: 800; margin-bottom: 1.5rem;">Account Information</h3>

          <form id="edit-profile-form">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="profile-name-input" class="form-control" value="${user.name || ''}" required />
            </div>

            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="profile-email-input" class="form-control" value="${user.email || ''}" required disabled />
              <small style="color: var(--medium-gray);">Email address cannot be modified</small>
            </div>

            ${isAdmin ? '' : `
              <div class="form-group">
                <label class="form-label">Saved Delivery Address</label>
                <textarea id="profile-address-input" class="form-control" rows="3">${address}</textarea>
              </div>

              <div style="background: var(--primary-light); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
                <strong>Connected Warehouse:</strong> <span class="badge badge-confirmed">${warehouseId}</span>
              </div>
            `}

            <div style="display: flex; gap: 1rem;">
              <button type="submit" class="btn btn-primary">Save Changes</button>
              <button type="button" class="btn btn-outline" onclick="Auth.logout()">Logout</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const form = document.getElementById('edit-profile-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const updatedName = document.getElementById('profile-name-input').value.trim();

        const updatedUser = { ...user, name: updatedName };
        Utils.storage.set('user_info', updatedUser);

        if (!isAdmin) {
          const updatedAddress = document.getElementById('profile-address-input').value.trim();
          Utils.storage.set('user_address', updatedAddress);
        }

        Auth.updateUI();
        LocationManager.updateNavbarPill();
        Utils.showToast('Profile updated successfully!', 'success');
      };
    }
  }
};
