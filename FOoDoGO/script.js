/* ═══════════════════════════════════════════
   script.js — Customer Frontend
   index.html ใช้ไฟล์นี้
   ═══════════════════════════════════════════ */

/* ── State ── */
let MENU_ALL   = [];
let CATS       = [];
let CART       = JSON.parse(localStorage.getItem("fg_cart") || "[]");
let ME         = null;   // LINE profile
let CUR_CAT    = "all";
let DRAWER_OPEN = false;

/* ── Boot ── */
document.addEventListener("DOMContentLoaded", async () => {
  await bootLiff();
  await Promise.all([fetchCats(), fetchMenu()]);
  paintCart();
  updatePill();
});

/* ───────────────────────────────────────────
   LIFF
   ─────────────────────────────────────────── */
async function bootLiff() {
  try {
    await liff.init({ liffId: CFG.LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
    ME = await liff.getProfile();
    const nameEl   = document.getElementById("uname");
    const avatarEl = document.getElementById("uavatar");
    if (nameEl)   nameEl.textContent = ME.displayName;
    if (avatarEl) avatarEl.innerHTML = `<img src="${ME.pictureUrl}" alt="">`;
  } catch (e) {
    console.warn("LIFF:", e);
    toast("เชื่อม LINE ไม่ได้", "warn");
  }
}

/* ───────────────────────────────────────────
   MENU
   ─────────────────────────────────────────── */
async function fetchCats() {
  try {
    const r = await fetch(`${CFG.GAS_URL}?action=getCategories`);
    const d = await r.json();
    CATS = d.categories || [];
    buildCatBar();
  } catch (e) { console.warn("cats:", e); }
}

function buildCatBar() {
  const bar = document.getElementById("cat-bar");
  if (!bar) return;
  bar.innerHTML = `<button class="cat-chip on" data-cat="all" onclick="filterCat('all')">🍽️ ทั้งหมด</button>` +
    CATS.map(c => `<button class="cat-chip" data-cat="${c.name}" onclick="filterCat('${c.name}')">${c.icon||"🍴"} ${c.name}</button>`).join("");
}

async function fetchMenu() {
  const grid = document.getElementById("food-grid");
  if (!grid) return;
  grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1"><div class="spinner"></div><span>กำลังโหลดเมนู…</span></div>`;
  try {
    const r = await fetch(`${CFG.GAS_URL}?action=getMenu`);
    const d = await r.json();
    MENU_ALL = (d.menu || []).filter(m => m.status !== "hidden");
    paintMenu(MENU_ALL);
  } catch (e) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-ico">⚠️</div><h3>โหลดเมนูไม่ได้</h3>
      <button class="btn btn-primary mt-2" onclick="fetchMenu()">ลองใหม่</button></div>`;
    toast("โหลดเมนูไม่สำเร็จ", "err");
  }
}

function paintMenu(items) {
  const grid = document.getElementById("food-grid");
  if (!grid) return;
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">🍽️</div><h3>ไม่พบเมนู</h3></div>`;
    return;
  }
  grid.innerHTML = items.map(m => `
    <div class="food-card ${m.status==='unavailable'?'sold-out':''}" onclick="showDetail('${m.id}')">
      <div class="food-img">${m.image?`<img src="${m.image}" alt="${m.name}" loading="lazy">`:"🍴"}</div>
      <div class="food-body">
        <div class="food-name">${m.name}</div>
        <div class="food-price">฿${(+m.price).toLocaleString()}</div>
        ${m.status==='unavailable'
          ? `<div class="badge badge-muted w-full text-c">หมด</div>`
          : `<button class="food-add" onclick="event.stopPropagation();addCart('${m.id}')">+ เพิ่มลงตะกร้า</button>`}
      </div>
    </div>`).join("");
}

function filterCat(cat) {
  CUR_CAT = cat;
  document.querySelectorAll(".cat-chip").forEach(b => b.classList.toggle("on", b.dataset.cat === cat));
  paintMenu(cat === "all" ? MENU_ALL : MENU_ALL.filter(m => m.category === cat));
}

/* ───────────────────────────────────────────
   DETAIL MODAL
   ─────────────────────────────────────────── */
function showDetail(id) {
  const m = MENU_ALL.find(x => x.id === id);
  if (!m) return;
  document.getElementById("det-img").innerHTML   = m.image ? `<img src="${m.image}" alt="${m.name}" style="width:100%;height:200px;object-fit:cover;border-radius:var(--r-md)">` : `<div style="font-size:4rem;text-align:center;padding:20px">🍴</div>`;
  document.getElementById("det-name").textContent  = m.name;
  document.getElementById("det-price").textContent = `฿${(+m.price).toLocaleString()}`;
  document.getElementById("det-desc").textContent  = m.description || "ไม่มีคำอธิบาย";
  const btn = document.getElementById("det-add");
  btn.disabled = m.status === "unavailable";
  btn.textContent = m.status === "unavailable" ? "หมดชั่วคราว" : "+ เพิ่มลงตะกร้า";
  btn.onclick = () => { addCart(id); closeModal("modal-detail"); };
  openModal("modal-detail");
}

/* ───────────────────────────────────────────
   CART
   ─────────────────────────────────────────── */
function addCart(id) {
  const m = MENU_ALL.find(x => x.id === id);
  if (!m) return;
  const ex = CART.find(c => c.id === id);
  ex ? ex.qty++ : CART.push({ id:m.id, name:m.name, price:+m.price, image:m.image||"", qty:1 });
  saveCart(); paintCart(); updatePill();
  toast(`เพิ่ม "${m.name}"`, "ok");
}

function changeQty(id, d) {
  const i = CART.findIndex(c => c.id === id);
  if (i < 0) return;
  CART[i].qty += d;
  if (CART[i].qty <= 0) CART.splice(i, 1);
  saveCart(); paintCart(); updatePill();
}

function saveCart() { localStorage.setItem("fg_cart", JSON.stringify(CART)); }

function paintCart() {
  const body    = document.getElementById("cart-body");
  const empty   = document.getElementById("cart-empty");
  const foot    = document.getElementById("cart-foot");
  const totalEl = document.getElementById("cart-total");
  const cntEl   = document.getElementById("cart-cnt");
  if (!body) return;

  const total = CART.reduce((s,c) => s + c.price * c.qty, 0);
  const cnt   = CART.reduce((s,c) => s + c.qty, 0);
  if (cntEl) cntEl.textContent = `${cnt} รายการ`;

  if (!CART.length) {
    body.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    if (foot)  foot.classList.add("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");
  if (foot)  foot.classList.remove("hidden");
  if (totalEl) totalEl.textContent = `฿${total.toLocaleString()}`;

  body.innerHTML = CART.map(c => `
    <div class="cart-item">
      <div class="cart-thumb">${c.image?`<img src="${c.image}" alt="">`:"🍴"}</div>
      <div class="cart-info">
        <div class="cart-iname">${c.name}</div>
        <div class="cart-iprice">฿${(c.price*c.qty).toLocaleString()}</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty('${c.id}',-1)">−</button>
        <span class="qty-num">${c.qty}</span>
        <button class="qty-btn" onclick="changeQty('${c.id}',1)">+</button>
      </div>
    </div>`).join("");
}

function updatePill() {
  const pill = document.getElementById("cart-pill");
  const badge = document.getElementById("cart-badge");
  const cnt = CART.reduce((s,c) => s + c.qty, 0);
  if (pill)  pill.classList.toggle("has-items", cnt > 0);
  if (badge) { badge.textContent = cnt; badge.classList.toggle("hidden", cnt === 0); }
}

function toggleDrawer() {
  DRAWER_OPEN = !DRAWER_OPEN;
  const el = document.getElementById("cart-drawer");
  if (el) el.classList.toggle("open", DRAWER_OPEN);
}

/* ───────────────────────────────────────────
   CHECKOUT
   ─────────────────────────────────────────── */
function openCheckout() {
  if (!CART.length) { toast("ตะกร้าว่างเปล่า", "warn"); return; }
  if (!ME)          { toast("กรุณา Login ก่อน", "warn"); return; }
  const sum = document.getElementById("co-sum");
  const total = CART.reduce((s,c) => s + c.price*c.qty, 0);
  sum.innerHTML = CART.map(c => `
    <div class="order-line">
      <span class="n">${c.name} × ${c.qty}</span>
      <span class="p">฿${(c.price*c.qty).toLocaleString()}</span>
    </div>`).join("") +
    `<div class="order-line mt-2" style="border-top:1px solid var(--line);padding-top:10px">
       <span class="fw-7">รวม</span>
       <span class="fw-7 text-brand">฿${total.toLocaleString()}</span>
     </div>`;
  openModal("modal-checkout");
}

async function submitOrder() {
  const addr = document.getElementById("co-addr")?.value.trim();
  const note = document.getElementById("co-note")?.value.trim() || "";
  if (!addr) { toast("กรุณากรอกที่อยู่", "warn"); return; }

  const btn = document.getElementById("co-btn");
  btn.disabled = true; btn.textContent = "กำลังส่ง…";

  try {
    const r = await fetch(CFG.GAS_URL, {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        action:   "createOrder",
        userId:   ME?.userId   || "guest",
        userName: ME?.displayName || "Guest",
        items:    JSON.stringify(CART),
        total:    CART.reduce((s,c) => s + c.price*c.qty, 0),
        address:  addr, note,
        timestamp: new Date().toISOString(),
      })
    });
    const d = await r.json();
    if (d.status !== "ok") throw new Error(d.message);
    CART = []; saveCart(); paintCart(); updatePill();
    closeModal("modal-checkout");
    toast(`สั่งสำเร็จ! 🎉 #${d.orderId}`, "ok");
  } catch (e) {
    toast("ส่งคำสั่งไม่ได้ กรุณาลองใหม่", "err");
  } finally {
    btn.disabled = false; btn.textContent = "✅ ยืนยันสั่งอาหาร";
  }
}

/* ───────────────────────────────────────────
   MODAL / TOAST
   ─────────────────────────────────────────── */
function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }
document.addEventListener("click", e => { if (e.target.classList.contains("modal-bg")) e.target.classList.remove("open"); });

function toast(msg, type = "info") {
  const box = document.getElementById("toasts");
  if (!box) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const ico = { ok:"✅", err:"❌", warn:"⚠️", info:"ℹ️" }[type] || "ℹ️";
  el.innerHTML = `<span>${ico}</span><span>${msg}</span>`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}