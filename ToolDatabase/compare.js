/* modules/compare.js */

const Compare = {
  list: [], // product ids
  MAX: 4,

  toggle(productId) {
    if (this.list.includes(productId)) {
      this.list = this.list.filter(id => id !== productId);
    } else {
      if (this.list.length >= this.MAX) {
        alert(`เปรียบเทียบได้สูงสุด ${this.MAX} รายการ`);
        return;
      }
      this.list.push(productId);
    }
    this.updateUI();
  },

  updateUI() {
    const count = this.list.length;
    const badge = document.getElementById('compareCountBadge');
    const fab   = document.getElementById('compareFab');
    const fabN  = document.getElementById('fabCount');

    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
    fab.className = count >= 2 ? 'compare-fab show' : 'compare-fab';
    if (fabN) fabN.textContent = count;

    // refresh card states
    document.querySelectorAll('.product-card').forEach(card => {
      const id = card.id.replace('card-', '');
      card.classList.toggle('selected', this.list.includes(id));
    });

    if (document.getElementById('page-compare').classList.contains('active')) {
      this.render();
    }
  },

  render() {
    const empty = document.getElementById('compareEmpty');
    const tbl   = document.getElementById('compareTable');

    if (this.list.length === 0) {
      empty.style.display = 'block';
      tbl.innerHTML = '';
      return;
    }
    empty.style.display = 'none';

    const allProducts = [...(APP.allProducts || []), ...(DEMO_DATA.products || [])];
    const seen = new Set();
    const items = this.list.map(id => allProducts.find(p => p.id === id)).filter(p => {
      if (!p || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    if (items.length === 0) { tbl.innerHTML = ''; return; }

    // gather all feature ids used by these products
    const allFids = [...new Set(items.flatMap(p => p.featureIds || []))];
    const featMap = {};
    allFids.forEach(fid => {
      featMap[fid] = Product.getFeatureName(fid);
    });

    const headers = items.map(p => {
      const brand = Product.getBrandName(p.brandId);
      const bColor = Product.getBrandColor(p.brandId);
      return `<th><span class="badge" style="background:${bColor}20;color:${bColor};">${brand}</span><br><strong style="font-size:14px;">${p.model}</strong>
        <br><button class="btn btn-danger btn-sm" style="margin-top:6px;font-size:11px;" onclick="Compare.toggle('${p.id}')">ลบออก</button></th>`;
    }).join('');

    const priceRow = items.map(p =>
      `<td style="font-weight:700;color:#d97706;">${p.price ? Number(p.price).toLocaleString()+' ฿' : '-'}</td>`
    ).join('');

    const powerRow = items.map(p =>
      `<td>${p.powerType==='battery'?'🔋 ไร้สาย':'🔌 มีสาย'}</td>`
    ).join('');

    const wattRow = items.map(p =>
      `<td>${p.watt ? p.watt+'W' : '-'}</td>`
    ).join('');

    const warrantyRow = items.map(p =>
      `<td>${p.warranty || '-'}</td>`
    ).join('');

    const featRows = allFids.map(fid => {
      const cells = items.map(p => {
        const has = (p.featureIds || []).includes(fid);
        return `<td><span class="${has?'icon-yes':'icon-no'}">${has?'✓':'✗'}</span></td>`;
      }).join('');
      return `<tr><td class="label">${featMap[fid]}</td>${cells}</tr>`;
    }).join('');

    tbl.innerHTML = `
<table class="compare-tbl">
  <thead><tr><th class="label">รายการ</th>${headers}</tr></thead>
  <tbody>
    <tr><td class="label">ราคา</td>${priceRow}</tr>
    <tr><td class="label">ระบบไฟ</td>${powerRow}</tr>
    <tr><td class="label">กำลังไฟ</td>${wattRow}</tr>
    <tr><td class="label">รับประกัน</td>${warrantyRow}</tr>
    ${featRows}
  </tbody>
</table>`;
  },
};

function clearCompare() {
  Compare.list = [];
  Compare.updateUI();
  Compare.render();
}