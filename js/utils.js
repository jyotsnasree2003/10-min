/* Utility Helpers & Toast System */

const Utils = {
  // Toast Notifications
  showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      toast.addEventListener('animationend', () => toast.remove());
    }, duration);
  },

  // Currency Formatter
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  },

  // Debounce Function for Search
  debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Local Storage Wrapper
  storage: {
    get(key, defaultValue = null) {
      try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
      } catch (e) {
        console.error('Error reading localStorage:', e);
        return defaultValue;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (e) {
        console.error('Error writing localStorage:', e);
      }
    },

    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error('Error removing localStorage:', e);
      }
    },

    clear() {
      try {
        localStorage.clear();
      } catch (e) {
        console.error('Error clearing localStorage:', e);
      }
    }
  },

  // Render Skeleton Cards
  getSkeletonCardsHTML(count = 4) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="product-card skeleton" style="height: 280px;">
          <div style="height: 120px; margin-bottom: 1rem;" class="skeleton"></div>
          <div style="height: 15px; width: 60%; margin-bottom: 0.5rem;" class="skeleton"></div>
          <div style="height: 20px; width: 90%; margin-bottom: 0.5rem;" class="skeleton"></div>
          <div style="height: 25px; width: 40%; margin-top: auto;" class="skeleton"></div>
        </div>
      `;
    }
    return html;
  }
};

const NameResolver = {
  categories: {},
  brands: {},

  async getCategoryName(categoryId) {
    if (!categoryId || categoryId === 'N/A') return 'N/A';
    if (this.categories[categoryId]) return this.categories[categoryId];
    try {
      const cat = await API.getCategoryById(categoryId);
      this.categories[categoryId] = cat.name;
      return cat.name;
    } catch (e) {
      return categoryId;
    }
  },

  async getBrandName(brandId) {
    if (!brandId || brandId === 'N/A') return 'N/A';
    if (this.brands[brandId]) return this.brands[brandId];
    try {
      const brand = await API.getBrandById(brandId);
      this.brands[brandId] = brand.name;
      return brand.name;
    } catch (e) {
      return brandId;
    }
  },

  resolveElements() {
    document.querySelectorAll('.resolve-category').forEach(async el => {
      const catId = el.getAttribute('data-id');
      if (catId) {
        const name = await this.getCategoryName(catId);
        el.innerText = name;
        el.classList.remove('resolve-category');
      }
    });
    document.querySelectorAll('.resolve-brand').forEach(async el => {
      const brandId = el.getAttribute('data-id');
      if (brandId) {
        const name = await this.getBrandName(brandId);
        el.innerText = name;
        el.classList.remove('resolve-brand');
      }
    });
  }
};

