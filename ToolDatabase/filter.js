/* modules/filter.js */

const Filter = {
  state: {
    categoryId: null,
    powerType: null,
    maxPrice: null,
    minWatt: null,
    featureIds: [],
    brandId: null,
    search: '',
  },

  reset() {
    this.state = { categoryId: null, powerType: null, maxPrice: null, minWatt: null, featureIds: [], brandId: null, search: '' };
  },

  /* Read current chip selections and search box */
  collectFromUI() {
    const powerChip   = document.querySelector('.chip[data-filter="powerType"].active:not([data-val=""])');
    const priceChip   = document.querySelector('.chip[data-filter="price"].active:not([data-val=""])');
    const wattChip    = document.querySelector('.chip[data-filter="watt"].active:not([data-val=""])');
    const brandChip   = document.querySelector('.chip[data-filter="brand"].active:not([data-val=""])');
    const featureChips = document.querySelectorAll('.chip-check.active');

    this.state.powerType  = powerChip  ? powerChip.dataset.val  : null;
    this.state.maxPrice   = priceChip  ? priceChip.dataset.val  : null;
    this.state.minWatt    = wattChip   ? wattChip.dataset.val   : null;
    this.state.brandId    = brandChip  ? brandChip.dataset.val  : null;
    this.state.featureIds = Array.from(featureChips).map(c => c.dataset.val);
    this.state.search     = (document.getElementById('searchQ') || {}).value || '';
  },

  buildParams() {
    this.collectFromUI();
    return {
      categoryId:    this.state.categoryId,
      powerType:     this.state.powerType  || undefined,
      maxPrice:      this.state.maxPrice   || undefined,
      minWatt:       this.state.minWatt    || undefined,
      featureIds:    this.state.featureIds.length ? this.state.featureIds : undefined,
      search:        this.state.search     || undefined,
      preferBrandId: APP.prefBrandId       || undefined,
    };
  },
};

function toggleChip(el) {
  const filter = el.dataset.filter;
  // single-select per filter group
  document.querySelectorAll(`.chip[data-filter="${filter}"]`).forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  doSearch();
}

function toggleCheckChip(el) {
  el.classList.toggle('chip-check');
  el.classList.toggle('active');
  doSearch();
}

async function doSearch() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading"><span class="dot-loader">กำลังค้นหา</span></div>';

  const params = Filter.buildParams();
  const products = await API.call('getProducts', params);

  APP.allProducts = products;
  Product.renderGrid(products);

  API.call('logSearch', { categoryId: params.categoryId, filters: params, resultsCount: products.length });
}