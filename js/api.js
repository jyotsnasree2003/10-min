/* QuickO Microservices API Client - Complete Inventory Service CRUD */

const API_CONFIG = {
  AUTH_SERVICE: 'http://localhost/api/auth/api/v1/user',
  ADMIN_SERVICE: 'http://localhost/api/auth/api/v1/admin',
  PRODUCT_SERVICE: 'http://localhost/api/products/api/v1',
  LOCATION_SERVICE: 'http://localhost/api/location/api/v1',
  WAREHOUSE_SERVICE: 'http://localhost/api/warehouses/api/v1',
  INVENTORY_SERVICE: 'http://localhost/api/inventory/api/v1',
  CART_SERVICE: 'http://localhost/api/cart/api/v1',
  ORDER_SERVICE: 'http://localhost/api/orders/api/v1',
  NOTIFICATION_SERVICE: 'http://localhost/api/notifications/api/v1'
};

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

async function request(url, options = {}, isRetry = false) {
  const token = Utils.storage.get('jwt_token');
  const headers = {
    ...(options.isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  try {
    const fetchOptions = { ...options, headers };
    delete fetchOptions.isFormData;

    const response = await fetch(url, fetchOptions);

    if (response.status === 401 && !isRetry && !url.includes('/login') && !url.includes('/refresh')) {
      const refreshToken = Utils.storage.get('refresh_token');

      if (!refreshToken) {
        Auth.logout();
        throw new Error('Unauthorized. Please login.');
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken) => {
            options.headers = {
              ...(options.headers || {}),
              'Authorization': `Bearer ${newToken}`
            };
            resolve(request(url, options, true));
          });
        });
      }

      isRefreshing = true;

      try {
        const newAccessToken = await API.refreshToken(refreshToken);
        if (newAccessToken) {
          Utils.storage.set('jwt_token', newAccessToken);
          isRefreshing = false;
          onRefreshed(newAccessToken);
          return await request(url, options, true);
        }
      } catch (refreshErr) {
        isRefreshing = false;
        Auth.logout();
        throw new Error('Session expired. Please login again.');
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: `HTTP ${response.status}: ${response.statusText}` }));
      let msg = errorData.detail || errorData.message || 'API request failed';
      if (Array.isArray(msg)) {
        msg = msg.map(e => e.msg || e.message).join(', ');
      }
      throw new Error(msg);
    }

    if (response.status === 204) return null;
    return await response.json();

  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error(`Microservice at ${url} is unreachable. Please verify service port is active.`);
    }
    throw err;
  }
}

const API = {
  // 1. Auth Service (:8000)
  async login(email, password) {
    return await request(`${API_CONFIG.AUTH_SERVICE}/login`, {
      method: 'POST',
      body: JSON.stringify({ username: email, password })
    });
  },

  async refreshToken(refreshToken) {
    const tokenToUse = refreshToken || Utils.storage.get('refresh_token');
    if (!tokenToUse) throw new Error('No refresh token available');

    const res = await request(`${API_CONFIG.AUTH_SERVICE}/refresh`, {
      method: 'POST',
      body: JSON.stringify({ refresh_token: tokenToUse })
    }, true);

    return res.access_token;
  },

  async requestOtp(name, email, password) {
    return await request(`${API_CONFIG.AUTH_SERVICE}/request-otp`, {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  },

  async verifyOtpSignup(email, otp) {
    return await request(`${API_CONFIG.AUTH_SERVICE}/signup`, {
      method: 'POST',
      body: JSON.stringify({ email, otp: parseInt(otp) })
    });
  },

  async getProfile() {
    return await request(`${API_CONFIG.AUTH_SERVICE}/profile`, { method: 'GET' });
  },

  // 2. Product Service (:8002)
  async getProducts() {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/products`, { method: 'GET' });
  },

  async getProduct(id) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/products/${id}`, { method: 'GET' });
  },

  async getCategories() {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/categories`, { method: 'GET' });
  },

  async getBrands() {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/brands`, { method: 'GET' });
  },

  async getProductImages(productId) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/product-images/product/${productId}`, { method: 'GET' });
  },

  // 3. Location Service (:8003)
  async resolveLocation(latitude, longitude) {
    return await request(`${API_CONFIG.LOCATION_SERVICE}/location/resolve`, {
      method: 'POST',
      body: JSON.stringify({ lat: parseFloat(latitude), lng: parseFloat(longitude) })
    });
  },

  async getLocationHome(latitude, longitude) {
    return await request(`${API_CONFIG.LOCATION_SERVICE}/home`, {
      method: 'POST',
      body: JSON.stringify({ lat: parseFloat(latitude), lng: parseFloat(longitude) })
    });
  },

  async getLocationSyncedWarehouses() {
    return await request(`${API_CONFIG.LOCATION_SERVICE}/warehouses/`, { method: 'GET' });
  },

  // 4. Warehouse Service (:8004)
  async getWarehouses() {
    return await request(`${API_CONFIG.WAREHOUSE_SERVICE}/warehouses/`, { method: 'GET' });
  },

  async getWarehouseById(warehouse_id) {
    return await request(`${API_CONFIG.WAREHOUSE_SERVICE}/warehouses/${warehouse_id}`, { method: 'GET' });
  },

  async getWarehouseByManager(manager_id) {
    return await request(`${API_CONFIG.WAREHOUSE_SERVICE}/warehouses/manager/${manager_id}`, { method: 'GET' });
  },

  async adminCreateWarehouse(warehouseData) {
    return await request(`${API_CONFIG.WAREHOUSE_SERVICE}/warehouses/`, {
      method: 'POST',
      body: JSON.stringify(warehouseData)
    });
  },

  // 5. INVENTORY SERVICE (:8005) - Complete Inventory Management
  async getAllInventory() {
    return await request(`${API_CONFIG.INVENTORY_SERVICE}/inventory`, { method: 'GET' });
  },

  async getWarehouseProducts(warehouse_id) {
    return await request(`${API_CONFIG.INVENTORY_SERVICE}/inventory/warehouse/${warehouse_id}`, { method: 'GET' });
  },

  async adminCreateInventory(inventoryData) {
    return await request(`${API_CONFIG.INVENTORY_SERVICE}/inventory`, {
      method: 'POST',
      body: JSON.stringify({
        product_id: inventoryData.product_id,
        warehouse_id: inventoryData.warehouse_id,
        quantity: parseInt(inventoryData.quantity || 0)
      })
    });
  },

  async adminUpdateInventory(inventoryId, updateData) {
    return await request(`${API_CONFIG.INVENTORY_SERVICE}/inventory/${inventoryId}`, {
      method: 'PUT',
      body: JSON.stringify({
        quantity: parseInt(updateData.quantity || 0),
        reserved_quantity: parseInt(updateData.reserved_quantity || 0)
      })
    });
  },

  async adminDeleteInventory(inventoryId) {
    return await request(`${API_CONFIG.INVENTORY_SERVICE}/inventory/${inventoryId}`, { method: 'DELETE' });
  },

  // 6. Cart Service (:8006)
  async getCart() {
    return await request(`${API_CONFIG.CART_SERVICE}/cart/`, { method: 'GET' });
  },

  async addToCart(productId, warehouseId, price, quantity = 1) {
    return await request(`${API_CONFIG.CART_SERVICE}/cart/`, {
      method: 'POST',
      body: JSON.stringify({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: quantity,
        price: price
      })
    });
  },

  async updateCart(cartItemId, quantity) {
    return await request(`${API_CONFIG.CART_SERVICE}/cart/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity })
    });
  },

  async deleteCart(cartItemId) {
    return await request(`${API_CONFIG.CART_SERVICE}/cart/${cartItemId}`, { method: 'DELETE' });
  },

  async clearCart() {
    return await request(`${API_CONFIG.CART_SERVICE}/cart/`, { method: 'DELETE' });
  },

  // 7. Order Service (:8007)
  async createOrder(orderData) {
    const formattedPayload = {
      warehouse_id: orderData.warehouseId,
      delivery_address: orderData.address,
      payment_method: orderData.paymentMethod || 'UPI',
      items: orderData.items.map(i => ({
        product_id: i.product_id || i.productId || i.id,
        quantity: i.quantity,
        price: i.price
      }))
    };

    return await request(`${API_CONFIG.ORDER_SERVICE}/orders/`, {
      method: 'POST',
      body: JSON.stringify(formattedPayload)
    });
  },

  async getOrders() {
    return await request(`${API_CONFIG.ORDER_SERVICE}/orders/my-orders`, { method: 'GET' });
  },

  async getOrderById(orderId) {
    return await request(`${API_CONFIG.ORDER_SERVICE}/orders/${orderId}`, { method: 'GET' });
  },

  // 8. Notification Service (:8008)
  async generateOtpNotification(userData) {
    return await request(`${API_CONFIG.NOTIFICATION_SERVICE}/generate-otp`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  // 9. Admin Methods
  async adminCreateProduct(productData) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/products`, {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  async adminUpdateProduct(id, productData) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData)
    });
  },

  async adminDeleteProduct(id) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/products/${id}`, { method: 'DELETE' });
  },

  async adminCreateCategory(categoryData) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/categories`, {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },

  async adminDeleteCategory(categoryId) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/categories/${categoryId}`, { method: 'DELETE' });
  },

  async adminUpdateCategory(categoryId, categoryData) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/categories/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData)
    });
  },

  async adminCreateBrand(brandData) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/brands`, {
      method: 'POST',
      body: JSON.stringify(brandData)
    });
  },

  async adminDeleteBrand(brandId) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/brands/${brandId}`, { method: 'DELETE' });
  },

  async adminUpdateBrand(brandId, brandData) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/brands/${brandId}`, {
      method: 'PUT',
      body: JSON.stringify(brandData)
    });
  },


  async adminUploadProductImage(productId, file) {
    const formData = new FormData();
    formData.append('product_id', productId);
    formData.append('image', file);

    return await request(`${API_CONFIG.PRODUCT_SERVICE}/product-images`, {
      method: 'POST',
      body: formData,
      isFormData: true
    });
  },

  async adminGetAllOrders() {
    return await request(`${API_CONFIG.ORDER_SERVICE}/orders/`, { method: 'GET' });
  },

  async adminUpdateOrderStatus(orderId, order_status) {
    return await request(`${API_CONFIG.ORDER_SERVICE}/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ order_status })
    });
  },

  async adminDeleteOrder(orderId) {
    return await request(`${API_CONFIG.ORDER_SERVICE}/orders/${orderId}`, { method: 'DELETE' });
  },

  async adminGetUsers() {
    return await request(`${API_CONFIG.ADMIN_SERVICE}/`, { method: 'GET' });
  },

  async adminGetUserById(userId) {
    return await request(`${API_CONFIG.ADMIN_SERVICE}/${userId}`, { method: 'GET' });
  },

  async getUserById(userId) {
    return await request(`${API_CONFIG.AUTH_SERVICE}/users/${userId}`, { method: 'GET' });
  },

  async getCategoryById(categoryId) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/categories/${categoryId}`, { method: 'GET' });
  },

  async getBrandById(brandId) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/brands/${brandId}`, { method: 'GET' });
  },

  async getProductsByCategory(categoryId) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/products/category/${categoryId}`, { method: 'GET' });
  },

  async getProductsByBrand(brandId) {
    return await request(`${API_CONFIG.PRODUCT_SERVICE}/products/brand/${brandId}`, { method: 'GET' });
  }
};



