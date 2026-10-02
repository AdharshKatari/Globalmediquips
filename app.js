/* Global Mediquips Master Application Engine & Admin Portal Controller */

let SITE_SETTINGS = {
  featuredProductId: '2857152264362',
  founderImage: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80'
};
let pendingFounderImage = '';
let PRODUCTS_DATA = [];
let quoteBasket = [];
let activeCategoryFilter = "all";
let activeBrandFilter = "all";
let searchQuery = "";

let audioCtx = null;
let chimePlayed = false;

function playStartupChime() {
  if (chimePlayed) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    
    // Four-tone harmonious medical chime (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      const startAt = audioCtx.currentTime + i * 0.16;
      gain.gain.setValueAtTime(0, startAt);
      gain.gain.linearRampToValueAtTime(0.18, startAt + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.55);
      osc.start(startAt);
      osc.stop(startAt + 0.6);
    });
    chimePlayed = true;
  } catch (e) {
    // Autoplay blocked by browser policy until user gesture
  }
}

// Mobile and desktop gesture unlock for audio (browsers require 1 user gesture to allow audio)
['pointerdown', 'touchstart', 'click', 'keydown'].forEach(evt => {
  window.addEventListener(evt, playStartupChime, { once: true, passive: true });
});

document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  fetchCompanySettings();
  setupNavigation();
  updateQuoteBasketUI();
  setupFileInputHandler();

  // Attempt direct chime playback (will succeed if browser media engagement permits)
  playStartupChime();

  // Cinematic Movie-Title Preloader Handler (Zoom-out 1.1s + 0.7s hold = 1.8s total)
  setTimeout(() => {
    const preloader = document.getElementById("initial-loader-screen");
    if (preloader) {
      preloader.style.opacity = "0";
      setTimeout(() => preloader.style.display = "none", 400);
    }
  }, 1800);
});

// Mobile Gallery & File Input Handler
function setupFileInputHandler() {
  const fileInput = document.getElementById("admin-form-file");
  const imageUrlInput = document.getElementById("admin-form-image");

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          imageUrlInput.value = event.target.result;
          showToast("Photo loaded from device gallery!");
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// Fetch Live Inventory from Server API

// Fetch Storefront Settings (Founder Photo & Featured Product)
async function fetchCompanySettings() {
  try {
    const res = await fetch('/api/company');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.featuredProductId) SITE_SETTINGS.featuredProductId = data.data.featuredProductId;
        if (data.data.founderImage) SITE_SETTINGS.founderImage = data.data.founderImage;
        applyStorefrontSettings();
        return;
      }
    }
  } catch (err) {
    // Static host fallback
  }

  // Fallback for static platforms like Netlify
  try {
    const fallbackRes = await fetch('./database.json');
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.company) {
        if (fallbackData.company.featuredProductId) SITE_SETTINGS.featuredProductId = fallbackData.company.featuredProductId;
        if (fallbackData.company.founderImage) SITE_SETTINGS.founderImage = fallbackData.company.founderImage;
        applyStorefrontSettings();
      }
    }
  } catch(e) {}
}

// Local preview-mode setting overrides — used when the backend API is unreachable
const FEATURED_OVERRIDE_KEY = 'gm_featured_product_override';
const FOUNDER_OVERRIDE_KEY = 'gm_founder_image_override';

function getLocalSetting(key) {
  try { return localStorage.getItem(key) || ''; } catch (e) { return ''; }
}

function setLocalSetting(key, value) {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch (e) {}
}

function applyStorefrontSettings() {
  // Apply local preview overrides last so they always win when present
  const featuredOverride = getLocalSetting(FEATURED_OVERRIDE_KEY);
  if (featuredOverride) SITE_SETTINGS.featuredProductId = featuredOverride;
  const founderOverride = getLocalSetting(FOUNDER_OVERRIDE_KEY);
  if (founderOverride) SITE_SETTINGS.founderImage = founderOverride;

  const founderImg = document.getElementById("about-founder-img");
  if (founderImg && SITE_SETTINGS.founderImage) {
    founderImg.src = SITE_SETTINGS.founderImage;
  }
  applyHeroFeaturedProduct();
}

function applyHeroFeaturedProduct() {
  if (!PRODUCTS_DATA || PRODUCTS_DATA.length === 0) return;
  const featured = PRODUCTS_DATA.find(p => p.id === SITE_SETTINGS.featuredProductId) || PRODUCTS_DATA[0];
  if (!featured) return;

  const imgEl = document.getElementById("hero-featured-image");
  const titleEl = document.getElementById("hero-featured-title");
  const subtitleEl = document.getElementById("hero-featured-subtitle");
  const priceEl = document.getElementById("hero-featured-price");
  const btnEl = document.getElementById("hero-featured-btn");

  if (imgEl) imgEl.src = featured.image;
  if (titleEl) titleEl.innerText = featured.title;
  if (subtitleEl) subtitleEl.innerText = `${featured.brand || 'Global Mediquips'} • ${featured.categoryName || 'Medical Equipment'} • Verified GST`;
  if (priceEl) priceEl.innerText = featured.priceDisplay || `₹${featured.price.toLocaleString('en-IN')}`;
  if (btnEl) btnEl.setAttribute("onclick", `addToBasket('${featured.id}')`);
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        PRODUCTS_DATA = data.data;
        renderProducts();
        renderAdminProductsTable();
        applyStorefrontSettings();
        populateAdminFeaturedSelect();
        return;
      }
    }
  } catch (err) {
    // Static host fallback
  }

  // Fallback for static platforms like Netlify
  try {
    const fallbackRes = await fetch('./database.json');
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.json();
      if (fallbackData && fallbackData.products) {
        PRODUCTS_DATA = fallbackData.products;
        renderProducts();
        renderAdminProductsTable();
        applyStorefrontSettings();
        populateAdminFeaturedSelect();
      }
    }
  } catch(e) {
    console.error("Products load error", e);
  }
}

let isAdminAuthenticated = false;

// Executive Admin Authentication Gateway
function openAdminAuthModal() {
  closeMobileMenu();
  if (isAdminAuthenticated) {
    navigateToPage('admin-page');
    return;
  }
  const modal = document.getElementById("admin-auth-modal");
  const err = document.getElementById("admin-auth-error");
  const userInput = document.getElementById("admin-username-input");
  const passInput = document.getElementById("admin-pin-input");
  
  if (userInput) userInput.value = "";
  if (passInput) passInput.value = "";
  if (err) err.classList.add("hidden");

  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    if (userInput) userInput.focus();
  }
}

function closeAdminAuthModal() {
  const modal = document.getElementById("admin-auth-modal");
  if (modal) modal.classList.add("hidden"), modal.classList.remove("flex");
}

function logoutAdmin() {
  isAdminAuthenticated = false;
  showToast("Signed Out from Executive Management Portal");
  navigateToPage('home-page');
}

function handleAdminAuthSubmit(e) {
  e.preventDefault();
  const username = (document.getElementById("admin-username-input") ? document.getElementById("admin-username-input").value.trim() : "").toLowerCase();
  const password = (document.getElementById("admin-pin-input") ? document.getElementById("admin-pin-input").value.trim() : "");
  const err = document.getElementById("admin-auth-error");

  // Executive Credentials — single authorised login only
  if (username === "katari" && password === "Katari@Mediquips2026") {
    isAdminAuthenticated = true;
    closeAdminAuthModal();
    navigateToPage('admin-page');
  } else {
    if (err) err.classList.remove("hidden");
  }
}

// Global B2B Inquiry Contact Request Form Handler
async function handleGlobalContactSubmit(e) {
  e.preventDefault();
  const name = document.getElementById("contact-form-name").value.trim();
  const phone = document.getElementById("contact-form-phone").value.trim();
  const category = document.getElementById("contact-form-category").value;
  const location = document.getElementById("contact-form-location").value.trim();
  const message = document.getElementById("contact-form-message").value.trim();

  let refId = "GM-Q-" + Math.floor(100000 + Math.random() * 900000);

  try {
    const res = await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        buyerName: name,
        hospitalName: location ? `${name} (${location})` : name,
        phone: phone,
        location: location,
        items: [{ title: category, price: 0, quantity: 1, notes: message }]
      })
    });

    const data = await res.json();
    if (data.data && data.data.quoteRef) {
      refId = data.data.quoteRef;
    }
  } catch (err) {
    console.warn("Offline or direct save:", err);
  }

  // Populate Success Card Details
  const cardRef = document.getElementById('card-ref-id');
  const cardName = document.getElementById('card-buyer-name');
  const cardPhone = document.getElementById('card-buyer-phone');
  const cardCat = document.getElementById('card-buyer-category');

  if (cardRef) cardRef.innerText = refId;
  if (cardName) cardName.innerText = name;
  if (cardPhone) cardPhone.innerText = phone;
  if (cardCat) cardCat.innerText = category;

  // Swap Views: Hide Form, Display Clean Green Tick Success Card
  const formBox = document.getElementById('contact-form-container');
  const successBox = document.getElementById('enquiry-success-card');

  if (formBox) formBox.classList.add('hidden');
  if (successBox) {
    successBox.classList.remove('hidden');
    successBox.classList.add('flex');
    successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  fetchAdminDashboard();
}

function resetContactForm() {
  const formBox = document.getElementById('contact-form-container');
  const successBox = document.getElementById('enquiry-success-card');
  const form = document.getElementById('global-contact-form');

  if (form) form.reset();
  if (successBox) {
    successBox.classList.add('hidden');
    successBox.classList.remove('flex');
  }
  if (formBox) {
    formBox.classList.remove('hidden');
    formBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// SPA Multi-Page Navigation Router
function navigateToPage(pageId) {
  if (pageId === 'admin-page' && !isAdminAuthenticated) {
    openAdminAuthModal();
    return;
  }

  const publicHeader = document.querySelector("header");
  const publicFooter = document.querySelector("footer");

  if (pageId === 'admin-page') {
    if (publicHeader) publicHeader.classList.add("hidden");
    if (publicFooter) publicFooter.classList.add("hidden");
  } else {
    if (publicHeader) publicHeader.classList.remove("hidden");
    if (publicFooter) publicFooter.classList.remove("hidden");
  }

  document.querySelectorAll(".page-section").forEach(page => {
    page.classList.remove("active-page");
  });

  document.querySelectorAll(".nav-link").forEach(link => {
    link.classList.remove("text-cyan-accent", "font-bold");
    link.classList.add("text-slate-200");
  });

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add("active-page");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const navLink = document.getElementById(`nav-${pageId}`);
  if (navLink) {
    navLink.classList.remove("text-slate-200");
    navLink.classList.add("text-cyan-accent", "font-bold");
  }

  // Highlight the matching link inside the mobile hamburger menu as well
  document.querySelectorAll(`.mobile-nav-link[data-nav-page="${pageId}"]`).forEach(link => {
    link.classList.remove("text-slate-200");
    link.classList.add("text-cyan-accent", "font-bold");
  });

  // Always collapse the mobile menu after any page change
  closeMobileMenu();

  if (pageId === 'admin-page') {
    fetchAdminDashboard();
  }
}

// MOBILE HAMBURGER MENU CONTROLLER
function toggleMobileMenu() {
  const menu = document.getElementById("mobile-nav-menu");
  const btn = document.getElementById("mobile-menu-btn");
  const icon = document.getElementById("mobile-menu-icon");
  if (!menu) return;

  const willOpen = menu.classList.contains("hidden");
  menu.classList.toggle("hidden");
  if (btn) btn.setAttribute("aria-expanded", String(willOpen));
  if (icon) {
    icon.innerHTML = willOpen
      ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
      : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
  }
}

function closeMobileMenu() {
  const menu = document.getElementById("mobile-nav-menu");
  const btn = document.getElementById("mobile-menu-btn");
  const icon = document.getElementById("mobile-menu-icon");
  if (menu) menu.classList.add("hidden");
  if (btn) btn.setAttribute("aria-expanded", "false");
  if (icon) icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
}

function setupNavigation() {
  document.querySelectorAll("[data-target-page]").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const pageId = btn.getAttribute("data-target-page");
      navigateToPage(pageId);
    });
  });
}

// Render Public Equipment Grid
function renderProducts() {
  const gridContainer = document.getElementById("products-grid");
  if (!gridContainer) return;

  const filtered = PRODUCTS_DATA.filter(product => {
    const matchesCategory = activeCategoryFilter === "all" || product.category === activeCategoryFilter;
    const matchesBrand = activeBrandFilter === "all" || product.brand.toLowerCase() === activeBrandFilter.toLowerCase();
    const matchesSearch = searchQuery === "" || 
      product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.categoryName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesBrand && matchesSearch;
  });

  const countEl = document.getElementById("showing-count");
  if (countEl) countEl.innerText = filtered.length;

  if (filtered.length === 0) {
    gridContainer.innerHTML = `
      <div class="col-span-full py-12 text-center master-card p-8">
        <h3 class="text-lg font-bold text-slate-800">No medical devices found</h3>
        <p class="text-xs text-slate-500 mt-1">Try resetting your category or brand filters.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 bg-navy-primary text-white text-xs font-bold rounded-xl hover:bg-navy-dark transition">Reset All Filters</button>
      </div>
    `;
    return;
  }

  gridContainer.innerHTML = filtered.map(product => `
    <div class="master-card p-5 flex flex-col justify-between group">
      <div>
        <div class="p-3 bg-white rounded-2xl flex items-center justify-center h-56 mb-4 relative border border-slate-200/80 shadow-sm overflow-hidden">
          <img src="${product.image}" alt="${product.title}" class="w-full h-full object-contain object-center transition-transform duration-500 group-hover:scale-105">
          <span class="absolute top-3 left-3 px-2.5 py-1 bg-navy-primary text-white text-[10px] font-extrabold rounded-lg shadow-sm">
            ${product.brand}
          </span>
          ${product.inStock === false
            ? `<span class="absolute top-3 right-3 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock
          </span>`
            : `<span class="absolute top-3 right-3 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm">
            <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> In Stock
          </span>`}
        </div>

        <div class="text-[11px] text-slate-400 font-medium mb-1">${product.categoryName} • HSN ${product.hsnCode}</div>
        <h3 class="text-sm font-extrabold text-slate-900 line-clamp-2 mb-2 hover:text-navy-primary cursor-pointer transition leading-snug" onclick="openProductModal('${product.id}')">
          ${product.title}
        </h3>
        <p class="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
          ${product.description}
        </p>
      </div>

      <div class="pt-3 border-t border-slate-100 space-y-3 mt-auto">
        <div class="flex items-baseline justify-between">
          <div class="text-base font-black text-navy-primary">${product.priceDisplay} <span class="text-xs font-normal text-slate-400">/ Piece</span></div>
          <span class="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">12% GST</span>
        </div>

        <div class="grid grid-cols-2 gap-2 pt-1">
          <button onclick="addToBasket('${product.id}')" class="py-2.5 bg-cyan-accent hover:bg-cyan-hover text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1">
            <span>+ Add Quote</span>
          </button>
          <button onclick="openProductModal('${product.id}')" class="py-2.5 bg-white border border-slate-200 hover:border-navy-primary text-slate-700 hover:text-navy-primary rounded-xl text-xs font-bold transition flex items-center justify-center gap-1">
            <span>📞 Details</span>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

// Filter Handlers
function filterByCategory(category) {
  activeCategoryFilter = category;
  document.querySelectorAll(".cat-card-btn").forEach(card => card.classList.remove("active-cat"));
  const activeCard = document.getElementById(`cat-card-${category}`);
  if (activeCard) activeCard.classList.add("active-cat");

  navigateToPage('catalog-page');
  renderProducts();
}

function filterByBrand(brand) {
  activeBrandFilter = brand;
  renderProducts();
}

function resetFilters() {
  activeCategoryFilter = "all";
  activeBrandFilter = "all";
  searchQuery = "";
  const searchInput = document.getElementById("search-input");
  if (searchInput) searchInput.value = "";
  filterByCategory("all");
}

// Quote Basket & WhatsApp Integration
function addToBasket(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;

  const existing = quoteBasket.find(item => item.id === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    quoteBasket.push({ ...product, quantity: 1 });
  }

  updateQuoteBasketUI();
  showToast(`Added ${product.title} to Quote Basket`);
}

function updateQuantity(productId, delta) {
  const index = quoteBasket.findIndex(item => item.id === productId);
  if (index > -1) {
    quoteBasket[index].quantity += delta;
    if (quoteBasket[index].quantity <= 0) {
      quoteBasket.splice(index, 1);
    }
  }
  updateQuoteBasketUI();
}

function updateQuoteBasketUI() {
  const countBadge = document.getElementById("basket-count");
  const basketList = document.getElementById("basket-items-list");
  const totalAmountEl = document.getElementById("basket-total-amount");

  const totalItems = quoteBasket.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = quoteBasket.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (countBadge) countBadge.innerText = totalItems;
  if (totalAmountEl) totalAmountEl.innerText = `₹${totalAmount.toLocaleString('en-IN')}`;

  if (!basketList) return;

  if (quoteBasket.length === 0) {
    basketList.innerHTML = `<div class="py-8 text-center text-slate-400 text-xs">Your quote basket is empty.</div>`;
    return;
  }

  basketList.innerHTML = quoteBasket.map(item => `
    <div class="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
      <div class="flex-1 pr-2">
        <div class="text-xs font-bold text-slate-800 line-clamp-1">${item.title}</div>
        <div class="text-[11px] text-navy-primary font-semibold">${item.priceDisplay} × ${item.quantity}</div>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="updateQuantity('${item.id}', -1)" class="w-6 h-6 bg-white border border-slate-300 text-slate-700 font-bold rounded flex items-center justify-center text-xs">-</button>
        <span class="w-5 text-center text-xs font-bold text-slate-800">${item.quantity}</span>
        <button onclick="updateQuantity('${item.id}', 1)" class="w-6 h-6 bg-white border border-slate-300 text-slate-700 font-bold rounded flex items-center justify-center text-xs">+</button>
      </div>
    </div>
  `).join("");
}

function sendWhatsAppQuote() {
  if (quoteBasket.length === 0) {
    alert("Please add products to your quote basket first.");
    return;
  }

  fetch('/api/quotes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      buyerName: "Hospital Procurement Client",
      hospitalName: "Private Hospital / Clinic",
      items: quoteBasket
    })
  }).catch(() => {
    // Offline / static-host fallback — WhatsApp flow continues regardless
  });

  let msg = `*B2B Quote Request — Global Mediquips*%0A`;
  msg += `━━━━━━━━━━━━━━━━━━━━%0A`;
  quoteBasket.forEach((item, index) => {
    msg += `${index + 1}. *${item.title}*%0A   Qty: ${item.quantity} | Unit: ${item.priceDisplay}%0A`;
  });
  msg += `━━━━━━━━━━━━━━━━━━━━%0A`;
  const total = quoteBasket.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  msg += `*Estimated Total:* ₹${total.toLocaleString('en-IN')}%0A`;
  msg += `*GST Verification:* 36BHGPK3813B1ZS%0A%0A`;
  msg += `Hello Shivashankar Katari ji, please send your best B2B wholesale quotation.`;

  window.open(`https://wa.me/919876543210?text=${msg}`, "_blank");
}

// ADMIN PORTAL CONTROLLER & SUB-TAB NAVIGATOR
function switchAdminTab(tabName) {
  document.querySelectorAll(".admin-tab-panel").forEach(panel => {
    panel.classList.add("hidden");
  });

  document.querySelectorAll(".admin-tab-btn").forEach(btn => {
    btn.classList.remove("border-navy-primary", "text-navy-primary", "bg-white", "shadow-sm", "font-extrabold");
    btn.classList.add("border-transparent", "text-slate-600", "font-bold");
  });

  const selectedPanel = document.getElementById(`admin-tab-panel-${tabName}`);
  if (selectedPanel) {
    selectedPanel.classList.remove("hidden");
  }

  const selectedBtn = document.getElementById(`admin-tab-btn-${tabName}`);
  if (selectedBtn) {
    selectedBtn.classList.remove("border-transparent", "text-slate-600", "font-bold");
    selectedBtn.classList.add("border-navy-primary", "text-navy-primary", "bg-white", "shadow-sm", "font-extrabold");
  }
}

function setAdminStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.innerText = value;
}

async function fetchAdminDashboard() {
  let loaded = false;

  try {
    const res = await fetch('/api/admin/dashboard');
    const data = await res.json();
    if (data.success) {
      setAdminStat('admin-count-products', data.data.productsCount);
      setAdminStat('admin-count-quotes', data.data.quotesCount);
      setAdminStat('admin-pipeline-value', data.data.pipelineValue);
      setAdminStat('admin-tab-badge-inquiries', data.data.quotesCount);
      renderAdminQuotesTable(data.data.quotes);
      loaded = true;
    }
  } catch (err) {
    // API unavailable — fall back to the static database below
  }

  if (!loaded) {
    // Static-host fallback: keep inbox, inventory and Featured Product selector fully usable
    try {
      const fallbackRes = await fetch('./database.json');
      const db = await fallbackRes.json();
      const quotes = (db && db.quotes) || [];
      const products = (db && db.products) || [];
      const pipeline = quotes.reduce((sum, q) => sum + (q.totalAmount || 0), 0);
      setAdminStat('admin-count-products', products.length);
      setAdminStat('admin-count-quotes', quotes.length);
      setAdminStat('admin-pipeline-value', `₹${pipeline.toLocaleString('en-IN')}`);
      setAdminStat('admin-tab-badge-inquiries', quotes.length);
      renderAdminQuotesTable(quotes);
    } catch (err) {
      console.error("Admin dashboard fetch error", err);
    }
  }

  // Always refresh the inventory table and the Featured Product selector,
  // even if the dashboard API failed — this is what previously left them empty
  renderAdminProductsTable();
  populateAdminFeaturedSelect();
}

function renderAdminProductsTable() {
  const tableBody = document.getElementById("admin-products-body");
  if (!tableBody) return;

  tableBody.innerHTML = PRODUCTS_DATA.map((p, idx) => `
    <tr class="border-b border-slate-200 text-xs hover:bg-slate-50">
      <td class="py-3 px-3 font-mono text-slate-500">${idx + 1}</td>
      <td class="py-3 px-3 flex items-center gap-2">
        <img src="${p.image}" class="w-8 h-8 object-contain rounded bg-slate-50 p-1 border">
        <span class="font-bold text-slate-800">${p.title}</span>
      </td>
      <td class="py-3 px-3 font-semibold text-slate-600">${p.brand}</td>
      <td class="py-3 px-3 text-slate-600">${p.categoryName}</td>
      <td class="py-3 px-3 font-extrabold text-navy-primary">${p.priceDisplay}</td>
      <td class="py-3 px-3 flex items-center gap-1.5 flex-wrap">
        <button onclick="openEditProductModal('${p.id}')" class="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition">✏️ Edit</button>
        ${p.id === SITE_SETTINGS.featuredProductId 
          ? '<span class="px-2 py-1 bg-amber-100 text-amber-800 rounded-lg text-[10px] font-black border border-amber-300">⭐ HERO TOP</span>' 
          : `<button onclick="setFeaturedProductFromTable('${p.id}')" class="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold hover:bg-amber-100 transition">⭐ Feature on Top</button>`
        }
        <button onclick="deleteProductAdmin('${p.id}')" class="px-2.5 py-1 bg-rose-500 text-white rounded-lg text-[10px] font-bold hover:bg-rose-700 transition">Delete</button>
      </td>
    </tr>
  `).join("");
}

function renderAdminQuotesTable(quotes) {
  const tableBody = document.getElementById("admin-quotes-body");
  if (!tableBody) return;

  if (!quotes || quotes.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="py-10 text-center text-slate-400 text-xs">
      <div class="flex flex-col items-center gap-2">
        <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
        <span class="font-semibold text-slate-400">No B2B inquiries yet. When customers submit the form, they appear here.</span>
      </div>
    </td></tr>`;
    return;
  }

  // Newest first
  const sorted = [...quotes].reverse();

  tableBody.innerHTML = sorted.map(q => {
    const item = (q.items && q.items[0]) ? q.items[0] : {};
    const category = item.title || "Medical Equipment";
    const notes = item.notes || "—";
    const date = q.createdAt ? new Date(q.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "—";
    const isPending = q.status === 'Pending';

    return `
      <tr class="border-b border-slate-100 hover:bg-blue-50/40 transition group">
        <td class="py-4 px-3">
          <span class="font-mono text-[11px] font-extrabold text-navy-primary bg-navy-primary/10 px-2 py-1 rounded-lg">${q.quoteRef}</span>
          <div class="text-[10px] text-slate-400 mt-1">${date}</div>
        </td>
        <td class="py-4 px-3">
          <div class="font-bold text-slate-900 text-xs">${q.buyerName}</div>
          <div class="text-[10px] text-slate-400 mt-0.5">${q.hospitalName || '—'}</div>
        </td>
        <td class="py-4 px-3">
          <div class="text-xs font-bold text-emerald-700 flex items-center gap-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            ${q.phone || '—'}
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">📍 ${q.location || '—'}</div>
        </td>
        <td class="py-4 px-3">
          <span class="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">${category}</span>
        </td>
        <td class="py-4 px-3 max-w-[180px]">
          <div class="text-xs text-slate-600 italic line-clamp-2">${notes}</div>
        </td>
        <td class="py-4 px-3">
          <span class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${isPending ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-green-100 text-green-800 border border-green-200'}">
            ${q.status}
          </span>
        </td>
        <td class="py-4 px-3">
          <button onclick="updateQuoteStatusAdmin('${q.quoteRef}', 'Quotation Sent')" class="px-3 py-1.5 bg-navy-primary hover:bg-navy-dark text-white rounded-lg text-[11px] font-bold shadow-sm transition whitespace-nowrap">
            ✓ Mark Sent
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

let currentModalProduct = null;

async function handleAddProductForm(e) {
  e.preventDefault();
  const title = document.getElementById("admin-form-title").value.trim();
  const brand = document.getElementById("admin-form-brand").value.trim();
  const category = document.getElementById("admin-form-category").value;
  const price = parseFloat(document.getElementById("admin-form-price").value) || 0;
  let image = document.getElementById("admin-form-image") ? document.getElementById("admin-form-image").value.trim() : "";
  const hsnCode = document.getElementById("admin-form-hsn") ? document.getElementById("admin-form-hsn").value.trim() : "90181100";
  const countryOfOrigin = document.getElementById("admin-form-origin") ? document.getElementById("admin-form-origin").value.trim() : "Made in India";
  const application = document.getElementById("admin-form-application") ? document.getElementById("admin-form-application").value.trim() : "Hospital & Home Care";
  const pressureRange = document.getElementById("admin-form-pressure") ? document.getElementById("admin-form-pressure").value.trim() : "Standard Operating Range";
  const rampRate = document.getElementById("admin-form-ramp") ? document.getElementById("admin-form-ramp").value.trim() : "Automatic";
  const warranty = document.getElementById("admin-form-warranty") ? document.getElementById("admin-form-warranty").value.trim() : "2 Years Warranty";
  const brochureUrl = document.getElementById("admin-form-brochure") ? document.getElementById("admin-form-brochure").value.trim() : "";
  const videoUrl = document.getElementById("admin-form-video") ? document.getElementById("admin-form-video").value.trim() : "";
  const description = document.getElementById("admin-form-description").value.trim();

  // If no image URL, provide default high-res fallback
  if (!image) {
    image = "https://5.imimg.com/data5/SELLER/PDFImage/2025/8/533175945/LJ/KA/DT/25122208/philips-bipap-auto-machine-500x500.png";
  }

  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title, brand, category, price, image, description, hsnCode,
        countryOfOrigin, application, pressureRange, rampRate, warranty,
        brochureUrl, videoUrl
      })
    });
    const data = await res.json();
    if (data.success) {
      showToast("New Product Published to Catalog!");
      fetchProducts();
      fetchAdminDashboard();
      document.getElementById("add-product-form").reset();
      switchAdminTab('inventory');
    }
  } catch (err) {
    alert("Error publishing product to catalog");
  }
}

async function deleteProductAdmin(id) {
  if (!confirm("Delete this product?")) return;
  try {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast("Product Deleted");
      fetchProducts();
      fetchAdminDashboard();
    }
  } catch (err) {
    alert("Error deleting product");
  }
}

async function updateQuoteStatusAdmin(quoteRef, status) {
  try {
    const res = await fetch(`/api/admin/quotes/${quoteRef}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      showToast("Quote Status Updated!");
      fetchAdminDashboard();
    }
  } catch (err) {
    alert("Error updating status");
  }
}

// Enterprise IndiaMART-Standard Modal Controller
function openProductModal(productId) {
  const product = PRODUCTS_DATA.find(p => p.id === productId);
  if (!product) return;
  currentModalProduct = product;

  document.getElementById("modal-title").innerText = product.title;
  document.getElementById("modal-price").innerText = product.priceDisplay;
  document.getElementById("modal-brand").innerText = product.brand;
  document.getElementById("modal-hsn").innerText = `HSN Code: ${product.hsnCode || '90181100'}`;
  document.getElementById("modal-description").innerText = product.description || "Certified medical device supplied by Global Mediquips.";
  document.getElementById("modal-main-img").src = product.image;

  const breadcrumbCat = document.getElementById("modal-breadcrumb-cat");
  if (breadcrumbCat) breadcrumbCat.innerText = product.categoryName || "Medical Equipment";

  // Video & Brochure Links
  const videoLink = document.getElementById("modal-video-link");
  if (videoLink) {
    if (product.videoUrl) {
      videoLink.href = product.videoUrl;
      videoLink.classList.remove("hidden");
    } else {
      videoLink.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(product.title)}`;
    }
  }

  const brochureLink = document.getElementById("modal-brochure-link");
  if (brochureLink) {
    if (product.brochureUrl) {
      brochureLink.href = product.brochureUrl;
      brochureLink.classList.remove("hidden");
    } else {
      brochureLink.href = "#";
      brochureLink.onclick = (e) => { e.preventDefault(); alert("Official brochure request initiated. Calling sales desk..."); window.location.href="tel:+919876543210"; };
    }
  }

  // Render 2-Column Key Specification Grid
  const specsContainer = document.getElementById("modal-specs-body");
  if (specsContainer) {
    const specItems = [];
    specItems.push({ key: "Brand", value: product.brand });
    specItems.push({ key: "Type / Category", value: product.categoryName || "Medical Device" });
    if (product.pressureRange) specItems.push({ key: "Pressure Range (cm H2O)", value: product.pressureRange });
    if (product.rampRate) specItems.push({ key: "Ramp Rate", value: product.rampRate });
    if (product.dataStorage) specItems.push({ key: "Data Storage Capacity", value: product.dataStorage });
    if (product.application) specItems.push({ key: "Application / Usage", value: product.application });
    if (product.countryOfOrigin) specItems.push({ key: "Country of Origin", value: product.countryOfOrigin });
    specItems.push({ key: "GST & HSN", value: `HSN ${product.hsnCode || '90181100'} (12% GST)` });

    if (product.specs && Array.isArray(product.specs)) {
      product.specs.forEach(s => {
        if (!specItems.some(existing => existing.key.toLowerCase() === s.key.toLowerCase())) {
          specItems.push(s);
        }
      });
    }

    specsContainer.innerHTML = specItems.map(spec => `
      <tr class="border-b border-slate-100 text-xs">
        <td class="py-2.5 px-3 font-bold text-slate-700 bg-slate-50 w-2/5 border-r border-slate-100">${spec.key}</td>
        <td class="py-2.5 px-3 text-slate-800 font-medium">${spec.value}</td>
      </tr>
    `).join("");
  }

  // Connect Add to Basket button
  const addBtn = document.getElementById("modal-add-basket-btn");
  if (addBtn) {
    addBtn.onclick = () => {
      addToBasket(product.id);
      closeProductModal();
    };
  }

  // Render Related Products Carousel / Grid
  const relatedContainer = document.getElementById("modal-related-products");
  if (relatedContainer) {
    const related = PRODUCTS_DATA.filter(p => p.id !== product.id).slice(0, 4);
    relatedContainer.innerHTML = related.map(rel => `
      <div onclick="openProductModal('${rel.id}')" class="p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-cyan-accent transition space-y-2">
        <div class="h-20 flex items-center justify-center bg-white p-1 rounded-lg border border-slate-100">
          <img src="${rel.image}" class="max-h-16 max-w-full object-contain">
        </div>
        <div class="font-bold text-slate-800 text-[11px] line-clamp-1">${rel.title}</div>
        <div class="text-xs font-black text-navy-primary">${rel.priceDisplay}</div>
      </div>
    `).join("");
  }

  const modal = document.getElementById("product-detail-modal");
  if (modal) modal.classList.remove("hidden"), modal.classList.add("flex");
}

function addToBasketFromModal() {
  if (currentModalProduct) {
    addToBasket(currentModalProduct.id);
    closeProductModal();
    document.getElementById("basket-drawer").classList.remove("translate-x-full");
  }
}

function sendWhatsAppSingleQuoteModal() {
  if (!currentModalProduct) return;
  const p = currentModalProduct;
  let msg = `*Single Product Wholesale Inquiry — Global Mediquips*%0A`;
  msg += `━━━━━━━━━━━━━━━━━━━━%0A`;
  msg += `*Product:* ${p.title}%0A`;
  msg += `*Brand:* ${p.brand}%0A`;
  msg += `*Listed Price:* ${p.priceDisplay}%0A`;
  msg += `*HSN Code:* ${p.hsnCode || '90181100'}%0A`;
  msg += `*Origin:* ${p.countryOfOrigin || 'Made in India'}%0A`;
  msg += `━━━━━━━━━━━━━━━━━━━━%0A`;
  msg += `Hello Shivashankar Katari ji, I saw this product on your official catalog and would like your best B2B wholesale quotation and delivery timeline to Hyderabad/Telangana.`;

  window.open(`https://wa.me/919876543210?text=${msg}`, "_blank");
}

function closeProductModal() {
  const modal = document.getElementById("product-detail-modal");
  if (modal) modal.classList.add("hidden"), modal.classList.remove("flex");
}

function showToast(msg) {
  const toast = document.createElement("div");
  toast.className = "fixed bottom-5 left-5 bg-navy-primary text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl z-50 transition-opacity duration-300";
  toast.innerText = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}


// ==========================================
// ADMIN STOREFRONT CUSTOMIZATION HANDLERS
// ==========================================
function populateAdminFeaturedSelect() {
  const select = document.getElementById("admin-featured-product-select");
  if (!select) return;
  select.innerHTML = PRODUCTS_DATA.map(p => `
    <option value="${p.id}" ${p.id === SITE_SETTINGS.featuredProductId ? 'selected' : ''}>
      ${p.title} (${p.brand}) — ${p.priceDisplay || '₹' + p.price}
    </option>
  `).join("");
  previewFeaturedSelection(SITE_SETTINGS.featuredProductId);

  // Setup founder photo preview in admin
  const founderPreview = document.getElementById("admin-founder-preview-img");
  const founderUrlInput = document.getElementById("admin-founder-url");
  if (founderPreview && SITE_SETTINGS.founderImage) {
    founderPreview.src = SITE_SETTINGS.founderImage;
  }
  if (founderUrlInput && SITE_SETTINGS.founderImage && !SITE_SETTINGS.founderImage.startsWith('data:')) {
    founderUrlInput.value = SITE_SETTINGS.founderImage;
  }
}

function previewFeaturedSelection(productId) {
  const p = PRODUCTS_DATA.find(x => x.id === productId);
  if (!p) return;
  const img = document.getElementById("admin-featured-preview-img");
  const title = document.getElementById("admin-featured-preview-title");
  const price = document.getElementById("admin-featured-preview-price");
  if (img) img.src = p.image;
  if (title) title.innerText = p.title;
  if (price) price.innerText = p.priceDisplay || `₹${p.price.toLocaleString('en-IN')}`;
}

// Shared featured-product saver: writes to the API, and falls back to a local
// preview-mode override when the backend is unreachable (no more hard errors)
async function saveFeaturedProduct(productId) {
  if (!productId) {
    alert("Please select a product from the list first.");
    return false;
  }

  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featuredProductId: productId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Save failed');
    setLocalSetting(FEATURED_OVERRIDE_KEY, '');
  } catch (err) {
    // Server unavailable (static preview) — persist locally so the site still updates here
    setLocalSetting(FEATURED_OVERRIDE_KEY, productId);
    SITE_SETTINGS.featuredProductId = productId;
    applyHeroFeaturedProduct();
    renderAdminProductsTable();
    populateAdminFeaturedSelect();
    showToast("⭐ Featured product saved in local preview mode (server unreachable)");
    return true;
  }

  SITE_SETTINGS.featuredProductId = productId;
  applyHeroFeaturedProduct();
  renderAdminProductsTable();
  populateAdminFeaturedSelect();
  showToast("⭐ Featured product updated on the customer site!");
  return true;
}

async function handleSaveHeroFeatured() {
  const select = document.getElementById("admin-featured-product-select");
  if (!select) return;
  await saveFeaturedProduct(select.value);
}

async function setFeaturedProductFromTable(productId) {
  const p = PRODUCTS_DATA.find(x => x.id === productId);
  if (!p) return;
  await saveFeaturedProduct(productId);
}

function previewFounderUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    pendingFounderImage = e.target.result;
    const preview = document.getElementById("admin-founder-preview-img");
    if (preview) preview.src = pendingFounderImage;
  };
  reader.readAsDataURL(file);
}

function previewFounderUrl(url) {
  if (!url) return;
  pendingFounderImage = url.trim();
  const preview = document.getElementById("admin-founder-preview-img");
  if (preview) preview.src = pendingFounderImage;
}

async function handleSaveFounderPhoto() {
  const imgToSave = pendingFounderImage || (document.getElementById("admin-founder-url") ? document.getElementById("admin-founder-url").value.trim() : "");
  if (!imgToSave) {
    alert("Please select a photo file or enter an image URL first.");
    return;
  }
  try {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ founderImage: imgToSave })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Save failed');
    setLocalSetting(FOUNDER_OVERRIDE_KEY, '');
    SITE_SETTINGS.founderImage = imgToSave;
    applyStorefrontSettings();
    showToast("✅ Founder photo updated on the About page!");
  } catch (err) {
    // Server unavailable (static preview) — persist locally so the change still applies here
    setLocalSetting(FOUNDER_OVERRIDE_KEY, imgToSave);
    SITE_SETTINGS.founderImage = imgToSave;
    applyStorefrontSettings();
    showToast("✅ Founder photo saved in local preview mode (server unreachable)");
  }
}

// ==========================================
// ADMIN EDIT PRODUCT MODAL HANDLERS
// ==========================================
let editProductPendingImage = '';

// --- Dynamic specification matrix editor (add / remove / edit spec rows) ---
function escapeAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function specRowHtml(key, value) {
  return `
    <div class="flex items-center gap-2 spec-edit-row">
      <input type="text" class="spec-key w-2/5 p-2 bg-white border border-slate-300 rounded-lg outline-none text-xs font-bold" placeholder="e.g. Noise Level" value="${escapeAttr(key || '')}">
      <input type="text" class="spec-value flex-1 p-2 bg-white border border-slate-300 rounded-lg outline-none text-xs" placeholder="e.g. Ultra-Quiet (< 28 dBA)" value="${escapeAttr(value || '')}">
      <button type="button" onclick="removeSpecRow(this)" title="Remove row" class="w-7 h-7 shrink-0 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-black hover:bg-rose-100 transition">✕</button>
    </div>`;
}

function renderSpecEditor(specs) {
  const list = document.getElementById("admin-edit-specs-list");
  if (!list) return;
  const rows = (Array.isArray(specs) && specs.length) ? specs : [{ key: '', value: '' }];
  list.innerHTML = rows.map(s => specRowHtml(s.key, s.value)).join("");
}

function addSpecRow() {
  const list = document.getElementById("admin-edit-specs-list");
  if (!list) return;
  list.insertAdjacentHTML('beforeend', specRowHtml('', ''));
}

function removeSpecRow(btn) {
  const row = btn.closest('.spec-edit-row');
  const list = document.getElementById('admin-edit-specs-list');
  if (row) row.remove();
  if (list && list.children.length === 0) addSpecRow();
}

function collectSpecRows() {
  const list = document.getElementById("admin-edit-specs-list");
  if (!list) return [];
  return Array.from(list.querySelectorAll('.spec-edit-row'))
    .map(row => ({
      key: (row.querySelector('.spec-key') || {}).value ? row.querySelector('.spec-key').value.trim() : '',
      value: (row.querySelector('.spec-value') || {}).value ? row.querySelector('.spec-value').value.trim() : ''
    }))
    .filter(s => s.key && s.value);
}

function openEditProductModal(productId) {
  const p = PRODUCTS_DATA.find(x => x.id === productId);
  if (!p) return;

  const setValue = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined ? val : '';
  };

  setValue("admin-edit-id", p.id);
  setValue("admin-edit-title", p.title);
  setValue("admin-edit-brand", p.brand);
  setValue("admin-edit-category", p.category || 'cpap-bipap');
  setValue("admin-edit-price", p.price);
  setValue("admin-edit-hsn", p.hsnCode || '90181100');
  setValue("admin-edit-origin", p.countryOfOrigin || 'Made in India');
  setValue("admin-edit-application", p.application || 'Hospital / Home Care');
  setValue("admin-edit-pressure", p.pressureRange || 'Standard');
  setValue("admin-edit-ramp", p.rampRate || '0-45 Mins');
  setValue("admin-edit-warranty", p.warranty || '2 Years Manufacturer Warranty');
  setValue("admin-edit-brochure", p.brochureUrl || '');
  setValue("admin-edit-description", p.description || '');
  setValue("admin-edit-video", p.videoUrl || '');

  const stockSel = document.getElementById("admin-edit-stock");
  if (stockSel) stockSel.value = p.inStock === false ? 'false' : 'true';
  renderSpecEditor(p.specs);

  editProductPendingImage = p.image || '';
  setValue("admin-edit-image", p.image || '');
  
  const imgPreview = document.getElementById("admin-edit-preview-img");
  if (imgPreview) imgPreview.src = p.image || '';

  const modal = document.getElementById("admin-edit-product-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeEditProductModal() {
  const modal = document.getElementById("admin-edit-product-modal");
  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
}

function previewEditImageUrl(url) {
  if (!url) return;
  editProductPendingImage = url.trim();
  const imgPreview = document.getElementById("admin-edit-preview-img");
  if (imgPreview) imgPreview.src = editProductPendingImage;
}

function handleEditImageUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    editProductPendingImage = e.target.result;
    const imgPreview = document.getElementById("admin-edit-preview-img");
    const imgInput = document.getElementById("admin-edit-image");
    if (imgPreview) imgPreview.src = editProductPendingImage;
    if (imgInput) imgInput.value = '';
  };
  reader.readAsDataURL(file);
}

async function handleEditProductSubmit(event) {
  event.preventDefault();
  const productId = document.getElementById("admin-edit-id").value;
  if (!productId) return;

  const categorySelect = document.getElementById("admin-edit-category");
  const category = categorySelect.value;
  const categoryName = categorySelect.options[categorySelect.selectedIndex].text;

  const payload = {
    title: document.getElementById("admin-edit-title").value.trim(),
    brand: document.getElementById("admin-edit-brand").value.trim(),
    category: category,
    categoryName: categoryName,
    price: parseFloat(document.getElementById("admin-edit-price").value) || 0,
    hsnCode: document.getElementById("admin-edit-hsn").value.trim(),
    image: editProductPendingImage || document.getElementById("admin-edit-image").value.trim() || '/philips-dreamstation.png',
    countryOfOrigin: document.getElementById("admin-edit-origin").value.trim(),
    application: document.getElementById("admin-edit-application").value.trim(),
    pressureRange: document.getElementById("admin-edit-pressure").value.trim(),
    rampRate: document.getElementById("admin-edit-ramp").value.trim(),
    warranty: document.getElementById("admin-edit-warranty").value.trim(),
    brochureUrl: document.getElementById("admin-edit-brochure").value.trim(),
    videoUrl: document.getElementById("admin-edit-video") ? document.getElementById("admin-edit-video").value.trim() : "",
    inStock: document.getElementById("admin-edit-stock") ? document.getElementById("admin-edit-stock").value === 'true' : true,
    specs: collectSpecRows(),
    description: document.getElementById("admin-edit-description").value.trim()
  };

  try {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      // Update local array
      const idx = PRODUCTS_DATA.findIndex(p => p.id === productId);
      if (idx !== -1) {
        PRODUCTS_DATA[idx] = { ...PRODUCTS_DATA[idx], ...data.data };
      }
      renderProducts();
      renderAdminProductsTable();
      populateAdminFeaturedSelect();
      applyStorefrontSettings();
      closeEditProductModal();
      showToast("✅ Product details and photo updated in the live catalog!");
    } else {
      alert("Error updating product: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    alert("Connection error: " + err.message);
  }
}
