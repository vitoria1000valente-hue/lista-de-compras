/**
 * Lista de Compras App
 * Simples, moderno, rápido e persistente via localStorage.
 */

// Key for localStorage
const STORAGE_KEY = 'lista_compras_items_v1';
const THEME_KEY = 'lista_compras_theme_v1';

// Available categories with emojis and default sort order
const CATEGORY_MAP = {
  'Alimentos': { emoji: '🍎', order: 1 },
  'Bebidas': { emoji: '🧃', order: 2 },
  'Limpeza': { emoji: '🧹', order: 3 },
  'Higiene': { emoji: '🧼', order: 4 },
  'Outros': { emoji: '📦', order: 5 }
};

// Initial Sample Data for first-time users
const DEFAULT_ITEMS = [
  { id: '1', name: 'Leite Integral', qty: '2 Litros', category: 'Alimentos', completed: false, createdAt: Date.now() - 3000 },
  { id: '2', name: 'Café Torrado', qty: '500g', category: 'Alimentos', completed: false, createdAt: Date.now() - 2000 },
  { id: '3', name: 'Suco de Laranja', qty: '1 Frasco', category: 'Bebidas', completed: true, createdAt: Date.now() - 1000 },
  { id: '4', name: 'Detergente Neutro', qty: '2 un', category: 'Limpeza', completed: false, createdAt: Date.now() }
];

// App State
let items = [];
let activeFilter = 'all'; // 'all' | 'pending' | 'completed'

// DOM Elements
const itemForm = document.getElementById('itemForm');
const productNameInput = document.getElementById('productName');
const productQtyInput = document.getElementById('productQty');
const productCategorySelect = document.getElementById('productCategory');

const categoriesContainer = document.getElementById('categoriesContainer');
const emptyState = document.getElementById('emptyState');
const addSampleBtn = document.getElementById('addSampleBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

const statTotalEl = document.getElementById('statTotal');
const statRemainingEl = document.getElementById('statRemaining');
const statCompletedEl = document.getElementById('statCompleted');
const progressBarFill = document.getElementById('progressBarFill');

const filterBtns = document.querySelectorAll('.filter-btn');
const themeBtns = document.querySelectorAll('.theme-btn');
const toastContainer = document.getElementById('toastContainer');

// --- Initialization ---
function init() {
  loadTheme();
  loadItems();
  setupEventListeners();
  render();
}

// --- Theme Management ---
function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  const validThemes = ['light', 'dark', 'yellow', 'blue'];
  const targetTheme = validThemes.includes(theme) ? theme : 'light';

  if (targetTheme === 'light') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', targetTheme);
  }

  // Update active state on theme buttons
  themeBtns.forEach(btn => {
    if (btn.dataset.themeVal === targetTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  localStorage.setItem(THEME_KEY, targetTheme);
}

// --- Storage Handlers ---
function loadItems() {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      items = JSON.parse(data);
    } catch (e) {
      console.error('Erro ao ler do localStorage:', e);
      items = [...DEFAULT_ITEMS];
    }
  } else {
    // First time user gets initial samples
    items = [...DEFAULT_ITEMS];
    saveItems();
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// --- Event Listeners ---
function setupEventListeners() {
  // Add product form submit
  itemForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = productNameInput.value.trim();
    const qty = productQtyInput.value.trim();
    const category = productCategorySelect.value;

    if (!name) return;

    addItem(name, qty, category);
    
    // Reset form
    productNameInput.value = '';
    productQtyInput.value = '';
    productNameInput.focus();
  });

  // Filter tabs
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // Clear completed items button
  clearCompletedBtn.addEventListener('click', () => {
    const completedCount = items.filter(i => i.completed).length;
    if (completedCount === 0) {
      showToast('Nenhum item comprado para limpar.', 'info');
      return;
    }
    
    items = items.filter(i => !i.completed);
    saveItems();
    render();
    showToast(`${completedCount} item(ns) comprado(s) removido(s)!`);
  });

  // Theme buttons click events
  themeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const themeVal = btn.dataset.themeVal;
      applyTheme(themeVal);
    });
  });

  // Add sample items if empty
  if (addSampleBtn) {
    addSampleBtn.addEventListener('click', () => {
      items = [...DEFAULT_ITEMS];
      saveItems();
      render();
      showToast('Itens de exemplo adicionados!');
    });
  }
}

// --- Core Actions ---
function addItem(name, qty, category) {
  const newItem = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    name,
    qty,
    category,
    completed: false,
    createdAt: Date.now()
  };

  items.unshift(newItem);
  saveItems();
  render();
  showToast(`"${name}" adicionado à lista!`);
}

function toggleItem(id) {
  const item = items.find(i => i.id === id);
  if (item) {
    item.completed = !item.completed;
    saveItems();
    render();
  }
}

function deleteItem(id) {
  const item = items.find(i => i.id === id);
  const name = item ? item.name : 'Item';
  
  items = items.filter(i => i.id !== id);
  saveItems();
  render();
  showToast(`"${name}" removido.`);
}

// --- Rendering Logic ---
function render() {
  updateMetrics();
  renderList();
}

function updateMetrics() {
  const total = items.length;
  const completed = items.filter(i => i.completed).length;
  const remaining = total - completed;

  statTotalEl.textContent = total;
  statRemainingEl.textContent = remaining;
  statCompletedEl.textContent = completed;

  const percentage = total > 0 ? (completed / total) * 100 : 0;
  progressBarFill.style.width = `${percentage}%`;
}

function renderList() {
  // Filter items based on tab selection
  let filteredItems = items;
  if (activeFilter === 'pending') {
    filteredItems = items.filter(i => !i.completed);
  } else if (activeFilter === 'completed') {
    filteredItems = items.filter(i => i.completed);
  }

  // Show or hide empty state
  if (filteredItems.length === 0) {
    categoriesContainer.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  } else {
    emptyState.classList.add('hidden');
  }

  // Group filtered items by category
  const grouped = {};
  filteredItems.forEach(item => {
    const cat = item.category || 'Outros';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  // Sort categories according to defined order
  const categoriesPresent = Object.keys(grouped).sort((a, b) => {
    const orderA = CATEGORY_MAP[a] ? CATEGORY_MAP[a].order : 99;
    const orderB = CATEGORY_MAP[b] ? CATEGORY_MAP[b].order : 99;
    return orderA - orderB;
  });

  // Build HTML for categories
  let html = '';

  categoriesPresent.forEach(category => {
    const categoryItems = grouped[category];
    const catMeta = CATEGORY_MAP[category] || { emoji: '📦' };

    html += `
      <section class="category-group">
        <div class="category-header">
          <div class="category-title">
            <span>${catMeta.emoji}</span>
            <span>${escapeHTML(category)}</span>
            <span class="category-badge badge-${escapeHTML(category)}">${categoryItems.length}</span>
          </div>
          <span class="category-count">${categoryItems.filter(i => i.completed).length}/${categoryItems.length} comprados</span>
        </div>
        <ul class="items-list">
    `;

    categoryItems.forEach(item => {
      html += `
        <li class="product-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
          <div class="product-main">
            <label class="checkbox-container" title="${item.completed ? 'Marcar como não comprado' : 'Marcar como comprado'}">
              <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleItem('${item.id}')">
              <span class="checkmark">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
            </label>

            <div class="product-details">
              <span class="product-name">${escapeHTML(item.name)}</span>
              ${item.qty ? `<span class="product-qty">${escapeHTML(item.qty)}</span>` : ''}
            </div>
          </div>

          <button class="btn-delete" title="Excluir produto" onclick="deleteItem('${item.id}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </li>
      `;
    });

    html += `
        </ul>
      </section>
    `;
  });

  categoriesContainer.innerHTML = html;
}

// Utility: Prevent XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Toast notification helper
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// Run app init on DOM Content Loaded
document.addEventListener('DOMContentLoaded', init);
