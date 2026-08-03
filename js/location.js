/* Location Manager - Aligned with Location Service Routers */

const LocationManager = {
  map: null,
  marker: null,
  currentLat: 28.6139,
  currentLng: 77.2090,

  async initLocationPage() {
    const lat = Utils.storage.get('latitude', 28.6139);
    const lng = Utils.storage.get('longitude', 77.2090);
    this.currentLat = lat;
    this.currentLng = lng;

    const detectBtn = document.getElementById('btn-detect-location');
    if (detectBtn) {
      detectBtn.onclick = () => this.detectLocation();
    }

    this.setupAddressSearch();
    await this.initMap(lat, lng);
    await this.loadSyncedWarehousesOnMap();
  },

  async initMap(lat, lng) {
    const mapElement = document.getElementById('location-map');
    if (!mapElement) return;

    if (typeof L === 'undefined') {
      setTimeout(() => this.initMap(lat, lng), 400);
      return;
    }

    if (this.map) {
      this.map.setView([lat, lng], 14);
      if (this.marker) this.marker.setLatLng([lat, lng]);
      return;
    }

    this.map = L.map('location-map').setView([lat, lng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
    this.marker.bindPopup('📍 Selected Delivery Pin').openPopup();

    this.marker.on('dragend', async () => {
      const pos = this.marker.getLatLng();
      this.currentLat = pos.lat;
      this.currentLng = pos.lng;
      await this.saveLocationAndResolve(pos.lat, pos.lng);
    });

    this.map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      this.currentLat = lat;
      this.currentLng = lng;
      this.marker.setLatLng([lat, lng]);
      this.marker.bindPopup('📍 Selected Delivery Pin').openPopup();
      await this.saveLocationAndResolve(lat, lng);
    });

    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 300);
  },

  async loadSyncedWarehousesOnMap() {
    if (!this.map) return;

    try {
      // Endpoint: GET /api/v1/warehouses/ (Location Service read-only synced copy)
      let warehouses = [];
      try {
        warehouses = await API.getLocationSyncedWarehouses();
      } catch (e) {
        warehouses = await API.getWarehouses();
      }

      if (!Array.isArray(warehouses) || warehouses.length === 0) return;

      warehouses.forEach(wh => {
        if (wh.lat && wh.lng) {
          const whMarker = L.marker([wh.lat, wh.lng], {
            icon: L.divIcon({
              className: 'wh-map-pin',
              html: `<div style="background: var(--dark); color: var(--accent); padding: 4px 8px; border-radius: 20px; font-weight: 800; font-size: 0.75rem; border: 2px solid var(--white); white-space: nowrap;">🏬 ${wh.name || wh.id}</div>`
            })
          }).addTo(this.map);

          whMarker.bindPopup(`
            <div style="padding: 4px;">
              <strong>🏬 Synced Warehouse: ${wh.name}</strong><br/>
              <small>ID: ${wh.id}</small><br/>
              <small>Status: ${wh.is_active !== false ? 'Active ⚡' : 'Inactive'}</small>
            </div>
          `);
        }

        if (Array.isArray(wh.geofence) && wh.geofence.length > 0) {
          L.polygon(wh.geofence, {
            color: '#0c831f',
            fillColor: '#10b981',
            fillOpacity: 0.15,
            weight: 2
          }).addTo(this.map);
        }
      });

    } catch (e) {
      console.warn('Location Service Warehouses error:', e.message);
    }
  },

  async detectLocation() {
    const btn = document.getElementById('btn-detect-location');
    if (btn) btn.innerText = '🛰️ Contacting Geolocation API...';

    if (!navigator.geolocation) {
      Utils.showToast('Geolocation is not supported by your browser', 'error');
      if (btn) btn.innerText = '📍 Detect Current Location (Browser Geolocation API)';
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        this.currentLat = lat;
        this.currentLng = lng;

        if (this.map) {
          this.map.flyTo([lat, lng], 15);
          if (this.marker) this.marker.setLatLng([lat, lng]);
        }

        await this.saveLocationAndResolve(lat, lng);
        if (btn) btn.innerText = '📍 Detect Current Location (Browser Geolocation API)';
      },
      async (error) => {
        console.warn('Geolocation error:', error.message);
        Utils.showToast('Could not auto-detect location. Move pin on map.', 'warning');
        if (btn) btn.innerText = '📍 Detect Current Location (Browser Geolocation API)';
      },
      { timeout: 10000 }
    );
  },

  setupAddressSearch() {
    const searchInput = document.getElementById('location-search-input');
    const suggestionsList = document.getElementById('location-suggestions');

    if (!searchInput || !suggestionsList) return;

    searchInput.oninput = Utils.debounce(async (e) => {
      const query = e.target.value.trim();
      if (!query || query.length < 3) {
        suggestionsList.innerHTML = '';
        return;
      }

      suggestionsList.innerHTML = `<li class="suggestion-item">🔍 Searching places...</li>`;

      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const results = await response.json();

        if (!results || results.length === 0) {
          suggestionsList.innerHTML = `<li class="suggestion-item">No places found for "${query}"</li>`;
          return;
        }

        suggestionsList.innerHTML = results.map(place => `
          <li class="suggestion-item" data-lat="${place.lat}" data-lng="${place.lon}" data-name="${place.display_name}">
            📍 <div>
              <strong style="display:block; font-size: 0.9rem;">${place.display_name.split(',')[0]}</strong>
              <small style="color: var(--medium-gray);">${place.display_name}</small>
            </div>
          </li>
        `).join('');

        document.querySelectorAll('.suggestion-item').forEach(item => {
          item.onclick = () => {
            const lat = parseFloat(item.dataset.lat);
            const lng = parseFloat(item.dataset.lng);
            const name = item.dataset.name;

            suggestionsList.innerHTML = '';
            searchInput.value = name.split(',')[0];

            if (this.map) {
              this.map.flyTo([lat, lng], 15);
              if (this.marker) this.marker.setLatLng([lat, lng]);
            }

            this.saveLocationAndResolve(lat, lng, name);
          };
        });
      } catch (err) {
        console.warn('Geocoding error:', err);
        suggestionsList.innerHTML = '';
      }
    }, 300);
  },

  async saveLocationAndResolve(lat, lng, customAddress = null) {
    try {
      Utils.showToast('Calling Location Service POST /api/v1/location/resolve...', 'info');

      // Endpoint: POST /api/v1/location/resolve { lat, lng }
      const res = await API.resolveLocation(lat, lng);

      if (res.serviceable === false || !res.warehouse_id) {
        Utils.showToast('Location is outside Location Service geofences.', 'warning');
      }

      const warehouse_id = res.warehouse_id;
      const address = customAddress || res.warehouse_name || `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;

      Utils.storage.set('latitude', lat);
      Utils.storage.set('longitude', lng);
      if (warehouse_id) Utils.storage.set('warehouse_id', warehouse_id);
      Utils.storage.set('user_address', address.split(',')[0]);

      this.updateNavbarPill();
      this.renderWarehouseBadge(warehouse_id || 'unassigned', address, res.serviceable !== false);
      Utils.showToast(`Location Service resolved! Warehouse ID: ${warehouse_id || 'None'}`, 'success');

      if (window.HomeManager) {
        window.HomeManager.loadWarehouseProducts();
      }
    } catch (e) {
      Utils.showToast(`Location Service Error: ${e.message}`, 'error');
    }
  },

  renderWarehouseBadge(warehouseId, address, serviceable = true) {
    const container = document.getElementById('location-warehouse-status');
    if (!container) return;

    container.innerHTML = `
      <div class="warehouse-result-badge" style="background: ${serviceable ? '#ecfdf5' : '#fff7ed'}; border-color: ${serviceable ? '#a7f3d0' : '#fed7aa'};">
        <div>
          <span style="font-size: 0.8rem; color: var(--medium-gray); display: block;">Location Service Status:</span>
          <span class="warehouse-id-tag" style="color: ${serviceable ? 'var(--primary)' : '#c2410c'};">
            ${serviceable ? `🏬 Resolved Darkstore: <strong>${warehouseId}</strong>` : '⚠️ Location Outside Service Geofence'}
          </span>
        </div>
        <button class="btn btn-primary btn-sm" onclick="window.location.hash='#home'">
          Confirm & View Darkstore Inventory ⚡
        </button>
      </div>
    `;
  },

  updateNavbarPill() {
    const addressPill = document.getElementById('nav-address-text');
    const warehouseId = Utils.storage.get('warehouse_id');
    const address = Utils.storage.get('user_address');

    if (addressPill) {
      if (address && warehouseId) {
        addressPill.innerText = `${address} (${warehouseId})`;
      } else {
        addressPill.innerText = 'Select Delivery Location';
      }
    }
  }
};
