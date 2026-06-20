/* modules/product.js */

const Product = {
  /* Lookup helpers */
  getBrandName(brandId) {
    const b = (APP.brands || []).find(x => x.id === brandId);
    return b ? b.name : brandId;
  },
  getBrandColor(brandId) {
    const b = (APP.brands || []).find(x => x.id === brandId);
    return b ? b.color : '#6b7280';
  },

  /* Feature name lookup */
  getFeatureName(fid) {
    const f = (APP.features || []).find(x => x.id === fid);
    return f ? f.featureName : fid;
  },

  /* Features for this category */
  getCategoryFeatures(categoryId) {
    return (APP.features || []).filter(f => f.categoryId === categoryId);
  },

  /* Render a single product card */
  renderCard(p, rank, compareList) {
    const brand    = this.getBrandName(p.brandId);
    const bColor   = this.getBrandColor(p.brandId);
    const isCompared = compareList.includes(p.id);
    const featNames  = (p.featureIds || []).map(fid => this.getFeatureName(fid));
    const rankBadge  = rank <= 3 ? `<span class="badge badge-amber" style="margin-right:6px;">#${rank}</span>` : '';
    const score = p.matchScore != null ? p.matchScore : 100;

    return `
<div class="product-card ${isCompared ? 'selected' : ''} ${rank===1 ? 'rank-1':''}" id="card-${p.id}" onclick="Product.showDetail('${p.id}')">
  <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;">
    <div style="width:56px;height:56px;border-radius:8px;background:#f3f4f6;border:1px solid #e5e7eb;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:28px;">
      ${p.image ? `<img src="${p.image}" style="width:100%;height:100%;object-fit:contain;border-radius:6px;">` : '⚙️'}
    </div>
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;margin-bottom:4px;">
        ${rankBadge}
        <span class="badge" style="background:${bColor}20;color:${bColor};">${brand}</span>
      </div>
      <div style="font-weight:700;font-size:15px;line-height:1.2;">${p.model}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:2px;">${p.description || ''}</div>
    </div>
  </div>

  ${p.price ? `<div style="font-size:20px;font-weight:800;color:#d97706;margin-bottom:6px;">${Number(p.price).toLocaleString()} <span style="font-size:13px;font-weight:400;color:#9ca3af;">บาท</span></div>` : ''}

  <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px;">
    ${featNames.slice(0,4).map(f=>`<span class="tag">${f}</span>`).join('')}
    ${featNames.length>4?`<span class="tag">+${featNames.length-4}</span>`:''}
    ${p.powerType==='battery'?`<span class="tag" style="background:#fef3c7;color:#92400e;">🔋 ไร้สาย</span>`:`<span class="tag" style="background:#dbeafe;color:#1d4ed8;">🔌 มีสาย</span>`}
    ${p.watt?`<span class="tag">${p.watt}W</span>`:''}
    ${p.warranty?`<span class="tag">🛡️ ${p.warranty}</span>`:''}
  </div>

  ${score < 100 ? `<div class="score-bar"><div class="score-fill" style="width:${score}%"></div></div><div style="font-size:11px;color:#9ca3af;margin-top:3px;">ตรงกับเงื่อนไข ${score}%</div>` : ''}

  <hr class="divider"/>
  <div style="display:flex;gap:6px;">
    <button class="btn btn-primary btn-sm" style="flex:1;" onclick="event.stopPropagation();Product.showDetail('${p.id}')">ดูรายละเอียด</button>
    <button class="btn ${isCompared?'btn-danger':'btn-outline'} btn-sm" onclick="event.stopPropagation();Compare.toggle('${p.id}')">
      ${isCompared ? '✓ เปรียบเทียบ' : '+ เปรียบเทียบ'}
    </button>
  </div>
</div>`;
  },

  /* Show all products in grid */
  renderGrid(products) {
    const grid = document.getElementById('productGrid');
    const meta = document.getElementById('resultMeta');

    if (!products || products.length === 0) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1;"><div class="empty-icon">🔍</div><div>ไม่พบสินค้าที่ตรงกับเงื่อนไข</div><div style="font-size:13px;margin-top:4px;">ลองปรับตัวกรองใหม่</div></div>`;
      meta.textContent = '';
      return;
    }

    meta.textContent = `พบ ${products.length} รายการ`;
    grid.innerHTML = products.map((p, i) => this.renderCard(p, i+1, Compare.list)).join('');
  },

  /* Detail modal */
  showDetail(productId) {
    const p = DEMO_DATA.products.find(x => x.id === productId)
           || (APP.allProducts || []).find(x => x.id === productId);
    if (!p) return;

    const brand    = this.getBrandName(p.brandId);
    const bColor   = this.getBrandColor(p.brandId);
    const catFeats = this.getCategoryFeatures(p.categoryId);
    const isCompared = Compare.list.includes(p.id);

    const featRows = catFeats.map(f => {
      const has = (p.featureIds || []).includes(f.id);
      return `<div class="feature-row">
        <div class="feature-dot ${has?'feat-on':'feat-off'}"></div>
        <span style="${has?'color:#111827;':'color:#9ca3af;'}">${f.featureName}</span>
        ${has ? '<span style="margin-left:auto;font-size:12px;color:#10b981;">✓</span>' : '<span style="margin-left:auto;font-size:12px;color:#d1d5db;">✗</span>'}
      </div>`;
    }).join('');

    document.getElementById('detailContent').innerHTML = `
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;">
  <span class="badge" style="background:${bColor}20;color:${bColor};font-size:13px;">${brand}</span>
  <button onclick="closeDetailModal()" style="background:none;border:none;font-size:20px;color:#9ca3af;cursor:pointer;">✕</button>
</div>
<div style="display:flex;gap:14px;margin-bottom:14px;">
  <div style="width:80px;height:80px;border-radius:10px;background:#f3f4f6;border:1px solid #e5e7eb;display:flex;align-items:center;justify-content:center;font-size:40px;flex-shrink:0;">
    ${p.image?`<img src="${p.image}" style="width:100%;height:100%;object-fit:contain;">`:'⚙️'}
  </div>
  <div>
    <h2 style="font-size:20px;font-weight:800;">${p.model}</h2>
    <div style="font-size:13px;color:#6b7280;margin:3px 0;">${p.description||''}</div>
    <div style="font-size:12px;color:#9ca3af;">SKU: ${p.sku}</div>
  </div>
</div>
<div style="font-size:26px;font-weight:800;color:#d97706;margin-bottom:4px;">
  ${p.price ? Number(p.price).toLocaleString() + ' บาท' : '<span style="color:#9ca3af;font-size:15px;">ติดต่อสอบถามราคา</span>'}
</div>
<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;">
  ${p.watt?`<span class="badge badge-blue">${p.watt}W</span>`:''}
  ${p.powerType==='battery'?`<span class="badge badge-amber">🔋 ไร้สาย</span>`:`<span class="badge badge-blue">🔌 มีสาย</span>`}
  ${p.warranty?`<span class="badge badge-green">🛡️ รับประกัน ${p.warranty}</span>`:''}
</div>
<hr class="divider"/>
<div style="font-weight:700;margin-bottom:8px;">ฟังก์ชันทั้งหมด</div>
<div style="display:grid;gap:2px;">${featRows || '<div style="color:#9ca3af;font-size:13px;">ไม่มีข้อมูลฟังก์ชัน</div>'}</div>
<hr class="divider"/>
<div style="display:flex;gap:8px;">
  <button class="btn btn-primary" style="flex:1;" onclick="closeDetailModal()">ปิด</button>
  <button class="btn ${isCompared?'btn-danger':'btn-outline'}" onclick="Compare.toggle('${p.id}');closeDetailModal();">
    ${isCompared?'ลบออกจากรายการเปรียบเทียบ':'+ เพิ่มเปรียบเทียบ'}
  </button>
</div>`;

    document.getElementById('detailModal').style.display = 'flex';
  },
};

function closeDetailModal() {
  document.getElementById('detailModal').style.display = 'none';
}