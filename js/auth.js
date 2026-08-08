/* Auth Manager - JWT Access Token & Refresh Token Handler */

const Auth = {
  pendingSignupData: null,
  otpCountdownTimer: null,

  isLoggedIn() {
    const token = Utils.storage.get('jwt_token');
    return !!token;
  },

  getToken() {
    return Utils.storage.get('jwt_token');
  },

  getRefreshToken() {
    return Utils.storage.get('refresh_token');
  },

  getUser() {
    return Utils.storage.get('user_info', { name: 'Customer', email: '', role: 'customer' });
  },

  isAdmin() {
    const user = this.getUser();
    if (!user || !user.role) return false;
    const role = String(user.role).toLowerCase();
    return role === 'admin';
  },

  parseJwt(token) {
    try {
      if (!token) return null;
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  },

  setSession(accessToken, refreshToken, user) {
    if (accessToken) Utils.storage.set('jwt_token', accessToken);
    if (refreshToken) Utils.storage.set('refresh_token', refreshToken);

    const decoded = this.parseJwt(accessToken);
    const userRole = (decoded && decoded.role) || (user && user.role) || 'customer';

    const fullUser = {
      id: (decoded && decoded.id) || (user && user.id) || 'u-101',
      name: (decoded && decoded.name) || (user && user.name) || (user && user.email ? user.email.split('@')[0] : 'Customer'),
      email: (decoded && decoded.email) || (user && user.email) || '',
      role: userRole
    };

    Utils.storage.set('user_info', fullUser);
    this.updateUI();
  },

  updateAccessToken(newAccessToken) {
    Utils.storage.set('jwt_token', newAccessToken);
  },

  logout() {
    Utils.storage.remove('jwt_token');
    Utils.storage.remove('refresh_token');
    Utils.storage.remove('user_info');
    Utils.showToast('Session expired. Please login again.', 'info');
    this.updateUI();
    window.location.hash = '#login';
  },

  requireAuth(actionCallback) {
    if (!this.isLoggedIn()) {
      Utils.showToast('Please login to continue', 'warning');
      window.location.hash = '#login';
      return false;
    }
    if (actionCallback && typeof actionCallback === 'function') {
      actionCallback();
    }
    return true;
  },

  requireAdmin() {
    if (!this.isLoggedIn()) {
      Utils.showToast('Authentication required for Admin Panel', 'warning');
      window.location.hash = '#login';
      return false;
    }

    if (!this.isAdmin()) {
      Utils.showToast('Access Denied: Admin privileges required!', 'error');
      window.location.hash = '#home';
      return false;
    }

    return true;
  },

  updateUI() {
    const user = this.getUser();
    const userBtn = document.getElementById('user-profile-btn');
    const adminNavLink = document.getElementById('admin-nav-link');
    const adminMobileLink = document.getElementById('admin-mobile-link');

    const cartNavBtn = document.getElementById('cart-nav-btn');
    const mobileCartNav = document.querySelector('.mobile-nav-item[href="#cart"]');
    const mobileCartFloatBar = document.getElementById('mobile-cart-float-bar');

    if (this.isLoggedIn() && this.isAdmin()) {
      if (adminNavLink) adminNavLink.style.display = 'inline-flex';
      if (adminMobileLink) adminMobileLink.style.display = 'flex';
      if (cartNavBtn) cartNavBtn.style.display = 'none';
      if (mobileCartNav) mobileCartNav.style.display = 'none';
      if (mobileCartFloatBar) mobileCartFloatBar.style.display = 'none';
    } else {
      if (adminNavLink) adminNavLink.style.display = 'none';
      if (adminMobileLink) adminMobileLink.style.display = 'none';
      if (cartNavBtn) cartNavBtn.style.display = 'inline-flex';
      if (mobileCartNav) mobileCartNav.style.display = 'flex';
    }

    if (userBtn) {
      if (this.isLoggedIn()) {
        const roleBadge = '';
        userBtn.innerHTML = `👤 <span>${user.name || 'Account'}${roleBadge}</span>`;
        userBtn.onclick = () => { window.location.hash = '#profile'; };
      } else {
        userBtn.innerHTML = `👤 <span>Login</span>`;
        userBtn.onclick = () => { window.location.hash = '#login'; };
      }
    }
  },

  initLoginForm() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        Utils.showToast('Please enter your email and password', 'warning');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Logging...';

      try {
        const res = await API.login(email, password);
        const accessToken = res.access_token;
        const refreshToken = res.refresh_token;

        this.setSession(accessToken, refreshToken, { name: email.split('@')[0], email });
        
        try {
          const profile = await API.getProfile();
          if (profile && profile.role) {
            const currentObj = this.getUser();
            Utils.storage.set('user_info', { ...currentObj, role: profile.role, name: profile.name || currentObj.name });
            this.updateUI();
          }
        } catch (pe) {}

        Utils.showToast(`Logged in successfully!`, 'success');

        if (this.isAdmin()) {
          window.location.hash = '#admin';
        } else {
          const warehouseId = Utils.storage.get('warehouse_id');
          window.location.hash = warehouseId ? '#home' : '#location';
        }
      } catch (err) {
        Utils.showToast(`Auth Service Error: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Login';
      }
    };
  },

  initSignupForm() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value;
      const confirmPassword = document.getElementById('signup-confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
        Utils.showToast('Please fill in all registration fields', 'warning');
        return;
      }

      if (password !== confirmPassword) {
        Utils.showToast('Passwords do not match', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Generating OTP...';

      try {
        await API.requestOtp(name, email, password);
        this.pendingSignupData = { name, email, password };

        const modal = document.getElementById('otp-modal');
        const emailLabel = document.getElementById('otp-sent-email');
        if (emailLabel) emailLabel.innerText = email;
        if (modal) modal.classList.add('active');

        this.startOtpTimer(60);
        Utils.showToast('OTP code sent via Notification Service!', 'success');

      } catch (err) {
        Utils.showToast(`Notification Service Error: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign Up & Send OTP';
      }
    };

    this.initOtpVerificationForm();
  },

  startOtpTimer(seconds = 60) {
    if (this.otpCountdownTimer) clearInterval(this.otpCountdownTimer);

    let timeLeft = seconds;
    const counterDisplay = document.getElementById('otp-timer-counter');
    const resendBtn = document.getElementById('resend-otp-btn');
    if (resendBtn) resendBtn.disabled = true;

    this.otpCountdownTimer = setInterval(() => {
      timeLeft--;
      if (counterDisplay) counterDisplay.innerText = `${timeLeft}s`;

      if (timeLeft <= 0) {
        clearInterval(this.otpCountdownTimer);
        if (counterDisplay) counterDisplay.innerText = 'Expired';
        if (resendBtn) resendBtn.disabled = false;
        Utils.showToast('OTP expired. Click Resend OTP.', 'warning');
      }
    }, 1000);
  },

  async resendOtp() {
    if (!this.pendingSignupData) {
      Utils.showToast('Registration details missing. Please re-fill form.', 'error');
      return;
    }
    try {
      const { name, email, password } = this.pendingSignupData;
      await API.requestOtp(name, email, password);
      this.startOtpTimer(60);
      Utils.showToast('New OTP generated and sent to email!', 'success');
    } catch (e) {
      Utils.showToast(`Resend Failed: ${e.message}`, 'error');
    }
  },

  initOtpVerificationForm() {
    const form = document.getElementById('otp-verification-form');
    if (!form) return;

    form.onsubmit = async (e) => {
      e.preventDefault();
      const otpInput = document.getElementById('otp-input-field').value.trim();

      if (!otpInput || otpInput.length < 6) {
        Utils.showToast('Please enter the 6-digit OTP', 'warning');
        return;
      }

      if (!this.pendingSignupData) {
        Utils.showToast('Session expired. Please fill signup form again.', 'error');
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerText = 'Verifying OTP...';

      try {
        const { name, email, password } = this.pendingSignupData;

        await API.verifyOtpSignup(email, otpInput);
        Utils.showToast('Account created! Logging in...', 'success');

        const loginRes = await API.login(email, password);
        this.setSession(loginRes.access_token, loginRes.refresh_token, { name, email, role: 'customer' });

        const modal = document.getElementById('otp-modal');
        if (modal) modal.classList.remove('active');

        window.location.hash = '#location';
      } catch (err) {
        Utils.showToast(`OTP Verification Error: ${err.message}`, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Verify & Register Account';
      }
    };
  }
};
