/* Main Application Router & Event Dispatcher */

const App = {
  init() {
    this.setupRouter();
    this.setupSearch();
    this.setupUI();

    Auth.updateUI();
    LocationManager.updateNavbarPill();
    CartManager.updateCartBadge();

    Auth.initLoginForm();
    Auth.initSignupForm();
    LocationManager.initLocationPage();

    HomeManager.init();
  },

  setupRouter() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute(); // Initial call
  },

  handleRoute() {
    const hash = window.location.hash || '#home';
    const views = document.querySelectorAll('.view-section');
    views.forEach(v => v.classList.remove('active'));

    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (hash.startsWith('#product-detail/')) {
      const productId = hash.split('/')[1];
      const detailView = document.getElementById('view-product-detail');
      if (detailView) {
        detailView.classList.add('active');
        ProductManager.renderProductDetails(productId);
      }
      return;
    }

    let targetViewId = 'view-home';

    switch (hash) {
      case '#login':
        targetViewId = 'view-login';
        break;
      case '#signup':
        targetViewId = 'view-signup';
        break;
      case '#location':
        targetViewId = 'view-location';
        break;
      case '#cart':
        targetViewId = 'view-cart';
        CartManager.renderDedicatedCartView();
        break;
      case '#checkout':
        targetViewId = 'view-checkout';
        CheckoutManager.renderCheckoutView();
        break;
      case '#order-success':
        targetViewId = 'view-order-success';
        CheckoutManager.renderOrderSuccessView();
        break;
      case '#orders':
        targetViewId = 'view-orders';
        OrdersManager.renderOrdersView();
        break;
      case '#profile':
        targetViewId = 'view-profile';
        ProfileManager.renderProfileView();
        break;
      case '#admin':
        targetViewId = 'view-admin';
        AdminManager.renderAdminView();
        break;
      case '#home':
      default:
        targetViewId = 'view-home';
        break;
    }

    const targetView = document.getElementById(targetViewId);
    if (targetView) {
      targetView.classList.add('active');
    }

    // Update Mobile Nav Active state
    document.querySelectorAll('.mobile-nav-item').forEach(item => {
      if (item.getAttribute('href') === hash) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  },

  setupSearch() {
    const searchInput = document.getElementById('global-search-input');
    const clearBtn = document.getElementById('search-clear-btn');

    if (searchInput) {
      searchInput.oninput = Utils.debounce((e) => {
        const query = e.target.value;
        if (query.trim().length > 0) {
          if (clearBtn) clearBtn.style.display = 'block';
        } else {
          if (clearBtn) clearBtn.style.display = 'none';
        }

        if (window.location.hash !== '#home') {
          window.location.hash = '#home';
        }

        HomeManager.setSearchQuery(query);
      }, 250);
    }

    if (clearBtn) {
      clearBtn.onclick = () => {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        HomeManager.setSearchQuery('');
      };
    }
  },

  setupUI() {
    // Close Modals on backdrop click
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('active');
        }
      };
    });

    // Close Modal X buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.onclick = () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) modal.classList.remove('active');
      };
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
