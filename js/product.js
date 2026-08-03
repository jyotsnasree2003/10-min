/* Product Card Renderer & Universal Inventory Field Normalizer */

const ProductManager = {

  normalizeProduct(p) {
    if (!p) return null;

    const id = p.id || p.product_id;
    const name = p.name || 'Grocery Item';
    
    let category = typeof p.category === 'object' ? (p.category.name || 'General') : (p.category_name || p.category || 'General');
    const categoryId = p.category_id || p.categoryId || (p.category && p.category.id) || category;
    if (typeof NameResolver !== 'undefined' && NameResolver.categories[categoryId]) {
      category = NameResolver.categories[categoryId];
    }

    let brand = typeof p.brand === 'object' ? (p.brand.name || 'Fresh') : (p.brand_name || p.brand || 'Fresh');
    const brandId = p.brand_id || p.brandId || (p.brand && p.brand.id) || p.brand;
    if (typeof NameResolver !== 'undefined' && NameResolver.brands[brandId]) {
      brand = NameResolver.brands[brandId];
    }


    
    // Extract primary image from product_images relationship or image_url
    let image = null;
    if (Array.isArray(p.images) && p.images.length > 0) {
      const primaryImg = p.images.find(imgObj => imgObj.is_primary) || p.images[0];
      if (primaryImg && primaryImg.id) {
        image = `http://localhost:8002/api/v1/product-images/${primaryImg.id}`;
      }
    }
    if (!image) {
      image = p.image_url || p.image || p.imageUrl;
      if (image && !image.startsWith('http') && !image.startsWith('data:')) {
        image = `http://localhost:8002/${image.replace(/\\/g, '/')}`;
      }
    }
    if (!image) {
      image = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
    }


    const price = parseFloat(p.price || p.base_price || p.selling_price || 0);
    const mrp = parseFloat(p.mrp || p.original_price || price);

    // Universal stock calculation across Inventory Service & Location Service responses
    let stock = 10;
    if (p.available_quantity !== undefined && p.available_quantity !== null) {
      stock = parseInt(p.available_quantity);
    } else if (p.quantity !== undefined && p.quantity !== null) {
      stock = parseInt(p.quantity);
    } else if (p.in_stock !== undefined) {
      stock = p.in_stock ? 10 : 0;
    }

    const isOutOfStock = stock <= 0;

    return {
      id,
      name,
      category,
      categoryId,
      brand,
      image,
      price,
      mrp,
      stock,
      isOutOfStock,
      description: p.description || 'Fresh item delivered in 10 minutes.'
    };
  },

  createCardHTML(rawProduct) {
    const p = this.normalizeProduct(rawProduct);
    if (!p) return '';

    const discountPercentage = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
    const cartQuantity = CartManager.getItemQuantity(p.id);

    let actionButtonHTML = '';

    if (p.isOutOfStock) {
      actionButtonHTML = `<div class="out-of-stock-badge">OUT OF STOCK</div>`;
    } else if (cartQuantity > 0) {
      actionButtonHTML = `
        <div class="card-qty-control">
          <button onclick="event.stopPropagation(); CartManager.updateQuantity('${p.id}', ${cartQuantity - 1})">-</button>
          <span>${cartQuantity}</span>
          <button onclick="event.stopPropagation(); CartManager.updateQuantity('${p.id}', ${cartQuantity + 1})">+</button>
        </div>
      `;
    } else {
      actionButtonHTML = `
        <button class="add-to-cart-btn" onclick="event.stopPropagation(); CartManager.addItem('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
          ADD
        </button>
      `;
    }

    return `
      <div class="product-card ${p.isOutOfStock ? 'out-of-stock' : ''}" onclick="ProductManager.viewDetail('${p.id}')">
        <div class="product-image-container">
          <img src="${p.image}" class="product-image" alt="${p.name}" loading="lazy" onError="this.onerror=null;this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';" />
          ${discountPercentage > 0 ? `<div class="discount-badge">${discountPercentage}% OFF</div>` : ''}
          <div class="delivery-time-badge">⚡ 10 MINS</div>
        </div>

        <div class="product-info">
          <div class="product-weight">${p.brand} • ${p.category}</div>
          <h3 class="product-title" title="${p.name}">${p.name}</h3>
          
          <div class="product-footer">
            <div class="price-container">
              <span class="price-current">${Utils.formatCurrency(p.price)}</span>
              ${p.mrp > p.price ? `<span class="price-mrp">${Utils.formatCurrency(p.mrp)}</span>` : ''}
            </div>

            <div class="card-action-slot">
              ${actionButtonHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  async viewDetail(productId) {
    window.location.hash = `#product-${productId}`;
    const container = document.getElementById('product-detail-view');
    if (!container) return;

    container.innerHTML = `<div style="text-align: center; padding: 3rem;">Loading product details...</div>`;

    try {
      const rawProduct = await API.getProduct(productId);
      const p = this.normalizeProduct(rawProduct);

      container.innerHTML = `
        <div class="product-detail-card" style="max-width: 900px; margin: 2rem auto; background: var(--white); border-radius: var(--radius-lg); padding: 2rem; box-shadow: var(--shadow-md); display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          <div>
            <img src="${p.image}" style="width: 100%; height: 350px; object-fit: contain; border-radius: var(--radius-md);" alt="${p.name}" />
          </div>
          <div>
            <span style="color: var(--primary); font-weight: 800; font-size: 0.85rem; text-transform: uppercase;">${p.brand} • ${p.category}</span>
            <h1 style="font-weight: 800; font-size: 1.8rem; margin: 0.5rem 0 1rem;">${p.name}</h1>
            
            <div style="font-size: 1.8rem; font-weight: 900; color: var(--dark); margin-bottom: 1rem;">
              ${Utils.formatCurrency(p.price)}
              ${p.mrp > p.price ? `<span style="font-size: 1.1rem; color: var(--medium-gray); text-decoration: line-through; margin-left: 10px;">${Utils.formatCurrency(p.mrp)}</span>` : ''}
            </div>

            <p style="color: var(--medium-gray); font-size: 0.95rem; margin-bottom: 1.5rem; line-height: 1.6;">${p.description}</p>

            <div style="display: flex; gap: 1rem;">
              <button class="btn btn-primary" style="flex: 1; padding: 0.9rem;" onclick="CartManager.addItem('${p.id}', '${p.name.replace(/'/g, "\\'")}', ${p.price}, '${p.image}')">
                🛒 Add to Cart
              </button>
              <button class="btn btn-outline" style="padding: 0.9rem;" onclick="window.location.hash='#home'">
                Back to Shopping
              </button>
            </div>
          </div>
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="empty-state">Failed to load product details: ${e.message}</div>`;
    }
  }
};
