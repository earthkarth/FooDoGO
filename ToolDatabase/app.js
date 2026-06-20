/* app.js — Main application controller */

const APP = {
  brands: [],
  categories: [],
  features: [],
  allProducts: [],
  prefBrandId: localStorage.getItem(CONFIG.PREF_BRAND_KEY) || null,
};

/* ── INIT ── */
window.addEventListener('DOMContentLoaded', async () => {
  const data = await API.call('getInit');
  APP.brands     = data.brands     || [];
  APP.categories = data.categories || [];
  APP.features   = data.features   || [];

  renderCategoryGrid();
  renderBrandModal();
  renderQuizCatSelect();
  updateTopBrand();
});

/* ── CATEGORY GRID ── */
function renderCategoryGrid() {
  const grid = document.getElementById('catGrid');
  grid.innerHTML = APP.categories.map(cat => `
<div class="product-card" style="cursor:pointer;text-align:center;padding:20px 16px;" onclick="selectCategory('${cat.id}','${cat.name}')">
  <div style="font-size:40px;margin-bottom:8px;">${cat.icon}</div>
  <div style="font-weight:700;font-size:15px;">${cat.name}</div>
</div>`).join('');
}

/* ── SELECT CATEGORY ── */
function selectCategory(catId, catName) {
  Filter.state.categoryId = catId;
  document.getElementById('catSelect').style.display    = 'none';
  document.getElementById('filterSection').style.display = 'block';
  document.getElementById('catLabel').textContent = catName;

  // render feature chips for this category
  const catFeats = (APP.features || []).filter(f => f.categoryId === catId);
  const chips = document.getElementById('featureChips');
  chips.innerHTML = catFeats.map(f =>
    `<button class="chip chip-check" data-filter="feature" data-val="${f.id}" onclick="toggleCheckChip(this)">${f.featureName}</button>`
  ).join('');

  // render brand chips
  const brandChips = document.getElementById('brandChips');
  brandChips.innerHTML = `<button class="chip active" data-filter="brand" data-val="" onclick="toggleChip(this)">ทั้งหมด</button>` +
    APP.brands.map(b =>
      `<button class="chip" data-filter="brand" data-val="${b.id}" onclick="toggleChip(this)" style="border-color:${b.color}50;">${b.name}</button>`
    ).join('');

  doSearch();
}

function backToCategories() {
  Filter.reset();
  document.getElementById('catSelect').style.display    = 'block';
  document.getElementById('filterSection').style.display = 'none';
  document.getElementById('productGrid').innerHTML = '';
}

/* ── TABS ── */
function showTab(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  document.querySelectorAll('.nav-tab').forEach(t => {
    if (t.textContent.toLowerCase().includes(name === 'search' ? 'ค้นหา' : name === 'compare' ? 'เปรียบ' : 'ทดสอบ'))
      t.classList.add('active');
  });

  if (name === 'compare') Compare.render();
  if (name === 'quiz')    loadQuiz();
}

/* ── BRAND MODAL ── */
function renderBrandModal() {
  const list = document.getElementById('brandList');
  const allBrands = [{ id: '', name: 'พนักงานทั่วไป (ไม่เลือกแบรนด์)', color: '#6b7280' }, ...APP.brands];
  list.innerHTML = allBrands.map(b => `
<button class="btn ${APP.prefBrandId === b.id ? 'btn-primary' : 'btn-outline'}" style="width:100%;text-align:left;display:flex;align-items:center;gap:8px;" onclick="selectBrand('${b.id}','${b.name}')">
  <span style="width:12px;height:12px;border-radius:50%;background:${b.color};display:inline-block;flex-shrink:0;"></span>
  ${b.name}
  ${APP.prefBrandId === b.id ? '<span style="margin-left:auto;">✓</span>' : ''}
</button>`).join('');
}

function selectBrand(id, name) {
  APP.prefBrandId = id || null;
  localStorage.setItem(CONFIG.PREF_BRAND_KEY, id || '');
  updateTopBrand(name);
  closeBrandModal();
  renderBrandModal();
}

function updateTopBrand(name) {
  const badge = document.getElementById('topBrandBadge');
  if (APP.prefBrandId) {
    const b = APP.brands.find(x => x.id === APP.prefBrandId);
    badge.textContent = name || (b ? b.name : '');
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

function openBrandModal()  { document.getElementById('brandModal').style.display = 'flex'; }
function closeBrandModal() { document.getElementById('brandModal').style.display = 'none'; }

/* ── QUIZ CAT SELECT ── */
function renderQuizCatSelect() {
  const sel = document.getElementById('quizCatSelect');
  APP.categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.id;
    opt.textContent = cat.icon + ' ' + cat.name;
    sel.appendChild(opt);
  });
}

/* close modals on backdrop click */
document.addEventListener('click', e => {
  if (e.target.id === 'brandModal') closeBrandModal();
  if (e.target.id === 'detailModal') closeDetailModal();
});