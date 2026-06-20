/* services/api.js
   Centralised fetch wrapper for Apps Script backend.
   Falls back to DEMO_DATA when CONFIG.API_URL is not set.        */

const API = {
  async call(action, params = {}) {
    if (!CONFIG.API_URL || CONFIG.API_URL.includes('YOUR_DEPLOYMENT')) {
      return API._demo(action, params);
    }
    try {
      const res = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: JSON.stringify({ action, params }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      return json.data;
    } catch (e) {
      console.warn('API error, using demo data:', e.message);
      return API._demo(action, params);
    }
  },

  /* ── DEMO DATA (ใช้เมื่อยังไม่ได้เชื่อม Google Sheets) ── */
  _demo(action, params) {
    if (action === 'getInit') return DEMO_DATA.init;
    if (action === 'getProducts') return API._demoFilter(params);
    if (action === 'getQuiz') return DEMO_DATA.quiz;
    if (action === 'logSearch') return { ok: true };
    return { ok: true };
  },

  _demoFilter(params) {
    let items = [...DEMO_DATA.products];

    if (params && params.categoryId)
      items = items.filter(p => p.categoryId === params.categoryId);
    if (params && params.powerType)
      items = items.filter(p => p.powerType === params.powerType);
    if (params && params.maxPrice)
      items = items.filter(p => Number(p.price) <= Number(params.maxPrice));
    if (params && params.minWatt)
      items = items.filter(p => !p.watt || Number(p.watt) >= Number(params.minWatt));
    if (params && params.featureIds && params.featureIds.length)
      items = items.filter(p =>
        params.featureIds.every(fid => (p.featureIds || []).includes(fid))
      );
    if (params && params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(p =>
        (p.model||'').toLowerCase().includes(q) ||
        (p.sku||'').toLowerCase().includes(q) ||
        (p.description||'').toLowerCase().includes(q)
      );
    }

    // score
    const total = (params && params.featureIds ? params.featureIds.length : 0) +
      (params && params.maxPrice ? 1 : 0) + (params && params.minWatt ? 1 : 0);
    items.forEach(p => {
      let s = 0;
      if (params && params.featureIds)
        s += params.featureIds.filter(fid => (p.featureIds||[]).includes(fid)).length;
      if (params && params.maxPrice && Number(p.price) <= Number(params.maxPrice)) s++;
      if (params && params.minWatt  && (!p.watt || Number(p.watt) >= Number(params.minWatt))) s++;
      p.matchScore = total > 0 ? Math.round((s / total) * 100) : 100;
    });

    items.sort((a, b) => {
      if (params && params.preferBrandId) {
        const aP = a.brandId === params.preferBrandId ? 1 : 0;
        const bP = b.brandId === params.preferBrandId ? 1 : 0;
        if (aP !== bP) return bP - aP;
      }
      return (b.matchScore||0) - (a.matchScore||0);
    });

    return items;
  },
};

/* ── DEMO DATA ── */
const DEMO_DATA = {
  init: {
    brands: [
      {id:'b1', name:'YOSHINO', color:'#f59e0b'},
      {id:'b2', name:'NASH',    color:'#ef4444'},
      {id:'b3', name:'Makita',  color:'#007dc1'},
      {id:'b4', name:'Bosch',   color:'#00a0c6'},
      {id:'b5', name:'Dewalt',  color:'#fbbf24'},
    ],
    categories: [
      {id:'c1', name:'สว่าน',          icon:'🔩'},
      {id:'c2', name:'เครื่องเจียร',    icon:'⚙️'},
      {id:'c3', name:'เลื่อย',          icon:'🪚'},
      {id:'c4', name:'เครื่องสกัด',     icon:'🔨'},
      {id:'c5', name:'เครื่องเป่าลม',   icon:'💨'},
      {id:'c6', name:'ตู้เชื่อม',       icon:'⚡'},
    ],
    features: [
      {id:'f1',  categoryId:'c1', featureName:'เจาะเหล็ก'},
      {id:'f2',  categoryId:'c1', featureName:'เจาะไม้'},
      {id:'f3',  categoryId:'c1', featureName:'เจาะปูน'},
      {id:'f4',  categoryId:'c1', featureName:'ขันสกรู'},
      {id:'f5',  categoryId:'c1', featureName:'กระแทก'},
      {id:'f6',  categoryId:'c1', featureName:'Brushless'},
      {id:'f7',  categoryId:'c1', featureName:'SDS Plus'},
      {id:'f8',  categoryId:'c1', featureName:'ปรับสปีด'},
      {id:'f9',  categoryId:'c1', featureName:'กลับทางหมุน'},
      {id:'f10', categoryId:'c1', featureName:'คลัตช์ปรับแรงบิด'},
      {id:'f11', categoryId:'c2', featureName:'เจียรตัด'},
      {id:'f12', categoryId:'c2', featureName:'เจียรขัด'},
      {id:'f13', categoryId:'c2', featureName:'Brushless'},
      {id:'f14', categoryId:'c2', featureName:'Soft Start'},
      {id:'f15', categoryId:'c3', featureName:'ตัดไม้'},
      {id:'f16', categoryId:'c3', featureName:'ตัดเหล็ก'},
      {id:'f17', categoryId:'c3', featureName:'Brushless'},
      {id:'f18', categoryId:'c3', featureName:'ตัดโค้ง (ฉลุ)'},
    ],
  },
  products: [
    {id:'p1', brandId:'b1', model:'CLG-21BL', sku:'10423748', categoryId:'c2', price:2890, watt:null, powerType:'battery', image:'', warranty:'2 ปี', description:'เครื่องเจียรไร้สาย 4 นิ้ว 21V Brushless', featureIds:['f11','f12','f13','f14']},
    {id:'p2', brandId:'b2', model:'DGA-21NASH', sku:'10416537', categoryId:'c2', price:1990, watt:null, powerType:'battery', image:'', warranty:'1 ปี', description:'เครื่องเจียรไร้สาย 4" 21V Nash Brushless', featureIds:['f11','f12','f13']},
    {id:'p3', brandId:'b1', model:'CLR-21BL', sku:'10423714', categoryId:'c1', price:3490, watt:null, powerType:'battery', image:'', warranty:'2 ปี', description:'สว่านโรตารี่ไร้สาย 21V Brushless SDS Plus', featureIds:['f1','f2','f3','f6','f7','f8']},
    {id:'p4', brandId:'b1', model:'RD26-900YN', sku:'10423749', categoryId:'c1', price:1890, watt:900, powerType:'electric', image:'', warranty:'2 ปี', description:'สว่านโรตารี่ 900W SDS Plus มีสาย', featureIds:['f1','f2','f3','f5','f7','f8']},
    {id:'p5', brandId:'b1', model:'RD24-640YN', sku:'10423750', categoryId:'c1', price:1490, watt:640, powerType:'electric', image:'', warranty:'2 ปี', description:'สว่านโรตารี่ 640W SDS Plus มีสาย', featureIds:['f1','f2','f3','f5','f7']},
    {id:'p6', brandId:'b1', model:'DM30-1600', sku:'10423751', categoryId:'c4', price:4990, watt:1600, powerType:'electric', image:'', warranty:'2 ปี', description:'เครื่องสกัดคอนกรีต 15 กก. 1600W', featureIds:['f3']},
    {id:'p7', brandId:'b3', model:'HP1630', sku:'HP1630', categoryId:'c1', price:1790, watt:710, powerType:'electric', image:'', warranty:'1 ปี', description:'Makita HP1630 สว่านกระแทก 710W', featureIds:['f1','f2','f3','f5','f8','f9']},
    {id:'p8', brandId:'b4', model:'GSB550', sku:'GSB550', categoryId:'c1', price:1590, watt:550, powerType:'electric', image:'', warranty:'1 ปี', description:'Bosch GSB550 สว่านกระแทก 550W', featureIds:['f1','f2','f3','f5','f8']},
    {id:'p9', brandId:'b1', model:'CLCS-21BL', sku:'10423713', categoryId:'c3', price:4290, watt:null, powerType:'battery', image:'', warranty:'2 ปี', description:'เลื่อยโซ่ไร้สาย 11.5 นิ้ว 21V Brushless', featureIds:['f15','f17']},
    {id:'p10',brandId:'b1', model:'CLC-21BL',  sku:'10423717', categoryId:'c3', price:3890, watt:null, powerType:'battery', image:'', warranty:'2 ปี', description:'เลื่อยวงเดือนไร้สาย 6.5" 21V Brushless', featureIds:['f15','f16','f17']},
    {id:'p11',brandId:'b1', model:'CLB-21YN',  sku:'10423715', categoryId:'c5', price:1690, watt:null, powerType:'battery', image:'', warranty:'2 ปี', description:'เครื่องเป่าลมไร้สาย 21V 2-in-1 เป่า/ดูด', featureIds:[]},
    {id:'p12',brandId:'b2', model:'BL21NASH',  sku:'10416546', categoryId:'c5', price:1290, watt:null, powerType:'battery', image:'', warranty:'1 ปี', description:'เครื่องเป่าลมไร้สาย 21V Nash 2-in-1', featureIds:[]},
    {id:'p13',brandId:'b1', model:'CLIW-21BL', sku:'10423712', categoryId:'c1', price:3790, watt:null, powerType:'battery', image:'', warranty:'2 ปี', description:'บล็อกกระแทกไร้สาย 1/2" 21V Brushless 350N.m', featureIds:['f4','f6','f9']},
    {id:'p14',brandId:'b1', model:'CLJ-21YN',  sku:'10423716', categoryId:'c3', price:2190, watt:null, powerType:'battery', image:'', warranty:'2 ปี', description:'เลื่อยฉลุไร้สาย 21V ตัดไม้ 100mm / เหล็ก 6mm', featureIds:['f15','f16','f18']},
  ],
  quiz: [
    {id:'q1', categoryId:'c1', question:'Yoshino CLR-21BL ใช้หัวจับดอกสว่านประเภทใด?', optA:'SDS-Plus', optB:'Hex Shank', optC:'Keyless Chuck', optD:'T-Shank', answer:'A', explanation:'CLR-21BL ใช้ SDS-Plus / SDS Click Bit ซึ่งเหมาะสำหรับเจาะคอนกรีตแรงสูง'},
    {id:'q2', categoryId:'c1', question:'สว่านแบบ Brushless มีข้อดีหลักคืออะไร?', optA:'ราคาถูกกว่า', optB:'อายุการใช้งานยาวนานและประสิทธิภาพสูงกว่า', optC:'น้ำหนักเบากว่าเสมอ', optD:'ชาร์จเร็วกว่า', answer:'B', explanation:'มอเตอร์ไร้แปรงถ่าน (Brushless) ไม่มีชิ้นส่วนเสียดสี ทำให้ทนทานกว่า ประสิทธิภาพพลังงานสูงกว่า 20-30%'},
    {id:'q3', categoryId:'c2', question:'Yoshino CLG-21BL เป็นเครื่องเจียรขนาดใบตัดเท่าไหร่?', optA:'3 นิ้ว', optB:'4 นิ้ว', optC:'5 นิ้ว', optD:'7 นิ้ว', answer:'B', explanation:'CLG-21BL ใช้ใบตัดขนาด 100mm หรือ 4 นิ้ว พร้อม Brushless Motor'},
    {id:'q4', categoryId:'c1', question:'เครื่องสกัด DM30-1600 มีพลังงานกระแทกสูงสุดเท่าไหร่?', optA:'10 จูล', optB:'30 จูล', optC:'50 จูล', optD:'100 จูล', answer:'C', explanation:'DM30-1600 มีพลังงานกระแทก 50 จูล เหมาะกับงานสกัดคอนกรีตหนัก น้ำหนักเครื่อง 15 กก.'},
    {id:'q5', categoryId:'c1', question:'ข้อใดคือความแตกต่างระหว่าง Impact Drill กับ Rotary Drill?', optA:'Impact Drill ใช้แรงกระแทกหมุน, Rotary Drill ใช้แรงกระแทกตรง', optB:'Rotary Drill ใช้ SDS และกระแทกตรงๆ เหมาะกับคอนกรีต, Impact Drill กระแทกหมุนเหมาะไม้-เหล็ก', optC:'ไม่มีความแตกต่าง', optD:'Rotary Drill ใช้แบตเตอรี่เท่านั้น', answer:'B', explanation:'Rotary Drill (โรตารี่) กระแทกในแนวตรง เหมาะเจาะคอนกรีตด้วยดอก SDS. Impact Drill กระแทกแบบหมุน เหมาะเจาะไม้-เหล็กและขันสกรู'},
  ],
};