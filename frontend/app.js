class TonWalletExplorer {
  constructor() {
    this.app = document.getElementById('app');
    this.currentPage = 'login';
    this.walletAddress = null;
    this.walletData = null;
    this.currentTab = 'history';
    this.API_URL = 'https://tonwalletex.onrender.com';
    this.init();
  }

  init() {
    this.render();
  }

  render() {
    if (this.currentPage === 'login') {
      this.renderLogin();
    } else if (this.currentPage === 'wallet') {
      this.renderWallet();
    }
  }

  // --- LOGIN / HERO (Tonviewer lookalike) ---
  renderLogin() {
    this.app.innerHTML = `
      <div class="hero-root">
        <header class="tv-header">
          <div class="tv-logo">
            <div class="diamond" />
            <span class="brand">Tonviewer</span>
          </div>
          <div class="tv-header-right">
            <button class="ghost-btn" id="search-toggle" title="Search">🔍</button>
            <button class="ghost-btn" id="settings-toggle" title="Settings">⚙️</button>
            <button class="connect-btn" id="connect-header-btn">Connect Wallet</button>
          </div>
        </header>

        <main class="hero-main">
          <div class="hero-brand">
            <div class="diamond large"></div>
            <h1>Tonviewer</h1>
          </div>

          <div class="search-row">
            <div class="search-glow">
              <span class="search-icon">🔍</span>
              <input id="hero-search" class="search-input" placeholder="Search by address, name or transaction" />
              <button class="copy-icon" id="sample-search-btn" type="button">📋</button>
            </div>
          </div>

          <div class="stats-strip">
            <div class="stat-item">
              <div class="stat-title">Gram Price</div>
              <div class="stat-value">$1.43</div>
            </div>
            <div class="stat-item middle">
              <div class="stat-title">Market Cap</div>
              <div class="stat-value">$3.64B</div>
            </div>
            <div class="stat-item">
              <div class="stat-title">Current TPS</div>
              <div class="stat-value">43.43</div>
            </div>
          </div>

          <section class="home-grid">
            <div class="card small-card">
              <h3>🏦 Wallets</h3>
              <ul class="compact-list">
                <li><strong>Tonkeeper</strong><span class="muted">The leading non-custodial wallet on TON</span></li>
                <li><strong>Tonkeeper Pro</strong><span class="muted">Desktop wallet. Receive, buy and spend crypto</span></li>
              </ul>
            </div>

            <div class="card small-card">
              <h3>💎 Tokens</h3>
              <ul class="compact-list">
                <li><strong>Most Visited</strong></li>
                <li><strong>Recently Added</strong></li>
              </ul>
            </div>

            <div class="card small-card">
              <h3>📊 Network Stats</h3>
              <div class="small-stat-row">
                <div><strong>Jettons · 1d</strong><div class="big">360,740</div></div>
                <div><strong>NFT · 1d</strong><div class="big">25,165</div></div>
              </div>
            </div>
          </section>

          <div class="login-card-compact">
            <form id="login-form">
              <label class="form-label">Enter Wallet Address</label>
              <div class="inline-form">
                <input id="wallet-input" class="form-input" placeholder="UQD4MsK...Whot4eDv" />
                <button type="submit" class="btn-login">Lookup</button>
              </div>
            </form>
            <div id="error-container" class="error-slot"></div>
          </div>
        </main>

        <footer class="footer-min">
          <div class="footer-min-inner">© 2026 Tonviewer — lightweight explorer</div>
        </footer>
      </div>
    `;

    document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
    
    document.getElementById('sample-search-btn').addEventListener('click', () => {
      document.getElementById('wallet-input').value = 'UQD4MsKVED3zIIhyXZU31F5_7dqTVYAvQu2X9Wf3Whot4eDv';
    });

    document.getElementById('connect-header-btn').addEventListener('click', () => {
      document.querySelector('.login-card-compact').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('search-toggle').addEventListener('click', () => {
      document.getElementById('hero-search').focus();
    });
  }

  handleLogin(e) {
    e.preventDefault();
    const addressInput = document.getElementById('wallet-input');
    const address = addressInput.value.trim();
    const errorContainer = document.getElementById('error-container');

    if (!address) {
      errorContainer.innerHTML = '<div class="error-message">❌ Please enter a wallet address</div>';
      return;
    }

    if (address.length < 48) {
      errorContainer.innerHTML = '<div class="error-message">❌ Invalid wallet address format</div>';
      return;
    }

    if (!address.match(/^[UEQ][QD]/)) {
      errorContainer.innerHTML = '<div class="error-message">❌ Address must start with UQ, UE, EQ, or ED</div>';
      return;
    }

    this.walletAddress = address;
    this.fetchWalletData(address);
  }

  // --- Data fetching ---
  async fetchWalletData(address) {
    try {
      const [infoRes, txRes, balanceRes] = await Promise.all([
        fetch(`${this.API_URL}/api/wallet/${address}/info`),
        fetch(`${this.API_URL}/api/wallet/${address}/transactions?limit=15`),
        fetch(`${this.API_URL}/api/wallet/${address}/balance`)
      ]);

      const infoData = await infoRes.json();
      const txData = await txRes.json();
      const balanceData = await balanceRes.json();

      if (!infoData.success) {
        const errorContainer = document.getElementById('error-container');
        errorContainer.innerHTML = '<div class="error-message">❌ Wallet not found or invalid address</div>';
        return;
      }

      const balanceTon = String(balanceData.balance_ton || balanceData.balance || '0');
      const balanceUsd = Number(balanceData.balance_usd || 0).toFixed(4);

      this.walletData = {
        address: address,
        shortAddress: address.substring(0, 10) + '...' + address.substring(address.length - 10),
        balance: balanceTon,
        balanceUSD: balanceUsd,
        contractType: infoData.contract_type || 'wallet_v4r2',
        status: infoData.status || 'Active',
        lockedInNodes: infoData.locked || false,
        transactions: txData.transactions || []
      };

      this.currentPage = 'wallet';
      this.render();
    } catch (error) {
      console.error('Error:', error);
      const errorContainer = document.getElementById('error-container');
      errorContainer.innerHTML = '<div class="error-message">❌ Service unavailable. Please try again.</div>';
    }
  }

  // --- WALLET PAGE (Tonviewer inspired) ---
  renderWallet() {
    this.app.innerHTML = `
      <div class="page-root">
        <header class="tv-header">
          <div class="tv-logo">
            <div class="diamond" />
            <span class="brand">Tonviewer</span>
          </div>
          <div class="tv-header-right">
            <button class="ghost-btn" id="header-fav" title="Favorite">⭐</button>
            <button class="ghost-btn" id="header-settings" title="Settings">⚙️</button>
            <button class="connect-btn" id="disconnect-btn">Disconnect</button>
          </div>
        </header>

        <main class="page-content narrow">
          <!-- Address Card -->
          <div class="address-card">
            <div class="address-left">
              <div>
                <div class="address-title">Address</div>
                <div class="address-value">${this.walletData.address}</div>
              </div>

              <div class="meta-row">
                <div>
                  <div class="meta-label">Balance</div>
                  <div class="meta-value">${this.formatBalance(this.walletData.balance)} GRAM <span class="muted">≈ $${this.walletData.balanceUSD}</span></div>
                </div>
                <div>
                  <div class="meta-label">Contract Type</div>
                  <div class="meta-value">${this.walletData.contractType}</div>
                </div>
              </div>

              <div class="status-row">
                <span class="status-active">● ${this.walletData.status}</span>
                <a class="link" href="https://toncoin.org" target="_blank">toncoin.org</a>
              </div>
            </div>

            <div class="address-right">
              <div class="qr-box" id="qr-container"></div>
              <button class="ghost-small" id="copy-addr-btn" style="width: 100%; margin-top: 8px;">📋 Copy Address</button>
            </div>
          </div>

          <!-- Locked Assets Card (if applicable) -->
          ${this.walletData.lockedInNodes ? `
            <div class="locked-assets-card">
              <div class="locked-assets-header">
                <span class="locked-icon">🔒</span>
                <div>
                  <div class="locked-title">Funds Locked in Nodes</div>
                  <div class="locked-subtitle">This wallet has staked assets</div>
                </div>
              </div>
              <div class="locked-content">
                <div class="locked-item">
                  <div class="locked-item-label">LOCKED BALANCE</div>
                  <div class="locked-item-value">${this.formatBalance(this.walletData.balance)}</div>
                </div>
                <div class="locked-item">
                  <div class="locked-item-label">STAKE STATUS</div>
                  <div class="locked-item-value" style="color: var(--success);">🟢 Earning</div>
                </div>
                <div class="locked-item">
                  <div class="locked-item-label">UNLOCK DATE</div>
                  <div class="locked-item-value">TBD</div>
                </div>
              </div>
            </div>
          ` : ''}

          <!-- History Card -->
          <div class="card history-card">
            <div class="card-header">
              <h3>📜 History</h3>
              <div class="controls">
                <button class="ghost-small">↕️ Sort</button>
                <button class="ghost-small">📅 Date</button>
              </div>
            </div>
            ${this.renderHistoryTab()}
          </div>
        </main>

        <footer class="footer-min">
          <div class="footer-min-inner">© 2026 Tonviewer — lightweight explorer</div>
        </footer>
      </div>
    `;

    this.attachEventListeners();
    this.generateQR();
  }

  renderHistoryTab() {
    if (!this.walletData.transactions || this.walletData.transactions.length === 0) {
      return '<div class="empty-state"><div class="empty-state-icon">📭</div><p>No transactions found</p></div>';
    }

    const rows = this.walletData.transactions.map(tx => {
      const ts = tx.timestamp ? this.formatTime(new Date(tx.timestamp)) : '—';
      const hash = (tx.hash || tx.id || '').toString();
      const shortHash = hash.length > 14 ? hash.substring(0, 14) + '...' : hash;
      const addr = tx.from || tx.to || '—';
      const shortAddr = addr.length > 20 ? addr.substring(0, 10) + '...' + addr.substring(addr.length - 8) : addr;
      const amount = this.formatBalance(tx.amount || '0');
      const isIn = tx.type === 'in' || tx.type === 'incoming';

      return `
        <div class="tx-row">
          <div class="tx-col type">${isIn ? '📥 In' : '📤 Out'}</div>
          <div class="tx-col hash">${shortHash}</div>
          <div class="tx-col addr">${shortAddr}</div>
          <div class="tx-col time">${ts}</div>
          <div class="tx-col amount ${isIn ? 'positive' : 'negative'}">${isIn ? '+' : '-'}${amount}</div>
        </div>
      `;
    }).join('');

    return `<div class="tx-list">${rows}</div>`;
  }

  generateQR() {
    const qrContainer = document.getElementById('qr-container');
    if (!qrContainer) return;
    
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: this.walletData.address,
      width: 144,
      height: 144,
      correctLevel: QRCode.CorrectLevel.H,
      colorDark: '#000000',
      colorLight: '#ffffff'
    });
  }

  attachEventListeners() {
    document.getElementById('disconnect-btn').addEventListener('click', () => {
      this.currentPage = 'login';
      this.walletAddress = null;
      this.walletData = null;
      this.render();
    });

    document.getElementById('copy-addr-btn').addEventListener('click', () => {
      this.copyToClipboard(this.walletData.address, document.getElementById('copy-addr-btn'));
    });

    document.getElementById('header-fav').addEventListener('click', () => {
      alert('⭐ Wallet added to favorites!');
    });

    document.getElementById('header-settings').addEventListener('click', () => {
      alert('⚙️ Settings coming soon!');
    });
  }

  copyToClipboard(text, button) {
    if (!navigator.clipboard) {
      alert('Clipboard not supported');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      const original = button.textContent;
      button.textContent = '✓ Copied!';
      button.style.opacity = '0.7';
      setTimeout(() => {
        button.textContent = original;
        button.style.opacity = '1';
      }, 2000);
    });
  }

  formatBalance(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    if (num < 0.0001) return num.toFixed(8);
    return num.toFixed(4);
  }

  formatTime(date) {
    if (!date || !(date instanceof Date)) return '—';
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}

const explorer = new TonWalletExplorer();
