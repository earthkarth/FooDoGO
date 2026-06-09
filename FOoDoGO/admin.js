/* ═══════════════════════════════════════════
   admin.js — Admin Panel
   admin.html ใช้ไฟล์นี้
   ═══════════════════════════════════════════ */

/* ── State ── */
let A_MENU  = [];
let A_CATS  = [];
let A_ORDERS = [];
let EDIT_ID  = null;
let CUR_TAB  = "menu";

/* ── Boot ── */
document.addEventListener("DOMContentLoaded", async () => {
  await checkAuth();
  await Promise.all([loadMenu(), loadCats()]);
  initSidebar();
});

/* ───────────────────────────────────────────
   AUTH — ตรวจสิทธิ์แอดมินผ่าน LINE
   ─────────────────────────────────────────── */
async function checkAuth() {
  try {
    await liff.init({ liffId: CFG.LIFF_ID });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }

    const p = await liff.getProfile();
    const nameEl   = document.getElementById("a-uname");
    const avatarEl = document.getElementById("a-uavatar");
    if (nameEl)   nameEl.textContent = p.displayName;
    if (avatarEl) avatarEl.innerHTML = `<img src="${p.pictureUrl}" alt="">`;

    // ตรวจสิทธิ์จาก Apps Script
    const r = await fetch(`${CFG.GAS_URL}?action=checkAdmin&userId=${p.userId}`);
    const d = await r.json();

    if (!d.isAdmin) {
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;
                    flex-direction:column;gap:16px;font-family:'Kanit',sans-serif;background:#0D0D0D;color:#F5F0EB">
          <div style="font-size:3rem">🚫</div>
          <h2>ไม่มีสิทธิ์เข้าถึง</h2>
          <p style="color:#5C5550">คุณไม่ใช่ Admin</p>
          <a href="index.html" style="color:#FF5722;font-weight:600">← กลับหน้าหลัก</a>
        </div>`;
    }
  } catch (e) {
    console.warn("Auth:", e);
    aToast("ตรวจสอบสิทธิ์ไม่ได้", "warn");
  }
}

/* ───────────────────────────────────────────
   SIDEBAR NAV
   ─────────────────────────────────────────── */
function initSidebar() {
  document.querySelectorAll(".sb-link[data-tab]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      switchTab(el.dataset.tab);
    });
  });
}

function switchTab(tab) {
  CUR_TAB = tab;
  document.querySelectorAll(".a-tab").forEach(el => el.classList.toggle("hidden", el.dataset.tab !== tab));
  document.querySelectorAll(".sb-link[data-tab]").forEach(el => el.classList.toggle("active", el.dataset.tab === tab));
  if (tab === "orders")    loadOrders();
  if (tab === "cats")      paintCats();
  if (tab === "admins")    loadAdminList();
}

function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("mob-open");
}

/* ───────────────────────────────────────────
   MENU
   ─────────────────────────────────────────── */
async function loadMenu() {
  const grid = document.getElementById("mgrid");
  if (!grid) return;
  grid.innerHTML = `<div class="loading-state" style="grid-column:1/-1"><div class="spinner"></div></div>`;
  try {
    const r = await fetch(`${CFG.GAS_URL}?action=getMenu`);
    const d = await r.json();
    A_MENU = d.menu || [];
    paintMenu();
  } catch {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-ico">❌</div><p>โหลดไม่ได้</p></div>`;
    aToast("โหลดเมนูไม่ได้", "err");
  }
}

function paintMenu(q = "") {
  const grid = document.getElementById("mgrid");
  if (!grid) return;
  const items = q ? A_MENU.filter(m => m.name.toLowerCase().includes(q.toLowerCase())) : A_MENU;
  if (!items.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-ico">🍽️</div><h3>ยังไม่มีเมนู</h3>
      <button class="btn btn-primary mt-2" onclick="openAddMenu()">+ เพิ่มเมนูแรก</button></div>`;
    return;
  }
  grid.innerHTML = items.map(m => `
    <div class="mcard">
      <div class="mcard-img">${m.image?`<img src="${m.image}" alt="${m.name}" loading="lazy">`:"🍴"}</div>
      <div class="mcard-body">
        <div class="mcard-name">${m.name}</div>
        <div class="mcard-cat">${m.category||"ไม่มีหมวด"}</div>
        <div class="mcard-price">฿${(+m.price).toLocaleString()}</div>
        <div class="mcard-foot">
          <label class="toggle">
            <input type="checkbox" ${m.status==='available'?'checked':''} onchange="toggleStatus('${m.id}',this.checked)">
            <span class="toggle-track"></span>
          </label>
          <button class="btn btn-ghost btn-sm" onclick="openEditMenu('${m.id}')">✏️ แก้ไข</button>
          <button class="btn btn-danger btn-sm" onclick="delMenu('${m.id}')">🗑️</button>
        </div>
      </div>
    </div>`).join("");
}

function openAddMenu() {
  EDIT_ID = null;
  document.getElementById("mform-title").textContent = "เพิ่มเมนูใหม่";
  document.getElementById("mform").reset();
  fillCatSelect("mf-cat");
  openAModal("modal-menu");
}

function openEditMenu(id) {
  const m = A_MENU.find(x => x.id === id);
  if (!m) return;
  EDIT_ID = id;
  document.getElementById("mform-title").textContent = "แก้ไขเมนู";
  document.getElementById("mf-name").value   = m.name        || "";
  document.getElementById("mf-price").value  = m.price       || "";
  document.getElementById("mf-image").value  = m.image       || "";
  document.getElementById("mf-desc").value   = m.description || "";
  document.getElementById("mf-status").value = m.status      || "available";
  fillCatSelect("mf-cat", m.category);
  openAModal("modal-menu");
}

function fillCatSelect(id, sel = "") {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">-- หมวดหมู่ --</option>` +
    A_CATS.map(c => `<option value="${c.name}" ${c.name===sel?"selected":""}>${c.name}</option>`).join("");
}

async function saveMenu() {
  const name   = document.getElementById("mf-name").value.trim();
  const price  = document.getElementById("mf-price").value;
  const cat    = document.getElementById("mf-cat").value;
  const image  = document.getElementById("mf-image").value.trim();
  const desc   = document.getElementById("mf-desc").value.trim();
  const status = document.getElementById("mf-status").value;
  if (!name || !price) { aToast("กรุณากรอกชื่อและราคา","warn"); return; }

  const btn = document.getElementById("mf-save"); btn.disabled = true;
  try {
    const r = await fetch(CFG.GAS_URL, {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ action: EDIT_ID?"editMenu":"addMenu", id:EDIT_ID||"", name, price:+price, category:cat, image, description:desc, status })
    });
    const d = await r.json();
    if (d.status !== "ok") throw new Error(d.message);
    aToast(EDIT_ID?"แก้ไขเมนูแล้ว ✅":"เพิ่มเมนูแล้ว ✅","ok");
    closeAModal("modal-menu");
    await loadMenu();
  } catch (e) { aToast("บันทึกไม่ได้","err"); }
  finally { btn.disabled = false; }
}

async function delMenu(id) {
  const m = A_MENU.find(x => x.id === id);
  if (!confirm(`ลบ "${m?.name}" จริงหรือ?`)) return;
  try {
    const r = await fetch(CFG.GAS_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"deleteMenu",id}) });
    const d = await r.json();
    if (d.status !== "ok") throw new Error();
    aToast("ลบแล้ว","ok"); await loadMenu();
  } catch { aToast("ลบไม่ได้","err"); }
}

async function toggleStatus(id, on) {
  try {
    await fetch(CFG.GAS_URL, { method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({action:"toggleStatus", id, status: on?"available":"unavailable"}) });
    const m = A_MENU.find(x => x.id === id);
    if (m) m.status = on?"available":"unavailable";
    aToast(on?"เปิดขายแล้ว":"ปิดชั่วคราว","info");
  } catch { aToast("อัปเดตไม่ได้","err"); }
}

/* ───────────────────────────────────────────
   CATEGORIES
   ─────────────────────────────────────────── */
async function loadCats() {
  try {
    const r = await fetch(`${CFG.GAS_URL}?action=getCategories`);
    const d = await r.json();
    A_CATS = d.categories || [];
  } catch {}
}

function paintCats() {
  const list = document.getElementById("cat-list");
  if (!list) return;
  if (!A_CATS.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-ico">📂</div><h3>ยังไม่มีหมวดหมู่</h3></div>`;
    return;
  }
  list.innerHTML = A_CATS.map(c => `
    <div class="card flex items-c justify-b" style="padding:13px 18px;margin-bottom:10px">
      <span class="fw-7">${c.icon||"📂"} ${c.name}</span>
      <button class="btn btn-danger btn-sm" onclick="delCat('${c.name}')">🗑️ ลบ</button>
    </div>`).join("");
}

async function saveCat() {
  const name = document.getElementById("cf-name").value.trim();
  const icon = document.getElementById("cf-icon").value.trim();
  if (!name) { aToast("กรุณากรอกชื่อ","warn"); return; }
  const btn = document.getElementById("cf-save"); btn.disabled = true;
  try {
    const r = await fetch(CFG.GAS_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"addCategory",name,icon}) });
    const d = await r.json();
    if (d.status !== "ok") throw new Error(d.message);
    aToast("เพิ่มหมวดหมู่แล้ว ✅","ok");
    closeAModal("modal-cat");
    await loadCats(); paintCats();
  } catch (e) { aToast(e.message||"เพิ่มไม่ได้","err"); }
  finally { btn.disabled = false; }
}

async function delCat(name) {
  if (!confirm(`ลบหมวด "${name}" จริงหรือ?`)) return;
  try {
    const r = await fetch(CFG.GAS_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"deleteCategory",name}) });
    const d = await r.json();
    if (d.status !== "ok") throw new Error();
    aToast("ลบแล้ว","ok"); await loadCats(); paintCats();
  } catch { aToast("ลบไม่ได้","err"); }
}

/* ───────────────────────────────────────────
   ORDERS
   ─────────────────────────────────────────── */
async function loadOrders() {
  const tbody = document.getElementById("ord-tbody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px"><div class="spinner" style="margin:auto"></div></td></tr>`;
  try {
    const r = await fetch(`${CFG.GAS_URL}?action=getOrders`);
    const d = await r.json();
    A_ORDERS = d.orders || [];
    paintOrders(A_ORDERS);
  } catch { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--err);padding:40px">โหลดไม่ได้</td></tr>`; }
}

function paintOrders(list) {
  const tbody = document.getElementById("ord-tbody");
  if (!tbody) return;
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--tx-muted)">ยังไม่มีออเดอร์</td></tr>`; return; }
  tbody.innerHTML = list.map(o => `
    <tr>
      <td><span class="fw-7">#${o.orderId}</span></td>
      <td>${o.userName||"-"}</td>
      <td>${fmtDate(o.timestamp)}</td>
      <td class="fw-7 text-brand">฿${(+o.total).toLocaleString()}</td>
      <td>${statusBadge(o.status)}</td>
      <td>
        <select class="form-ctrl" style="padding:4px 8px;font-size:0.74rem;width:125px;border-radius:var(--r-sm)"
                onchange="updStatus('${o.orderId}',this.value)">
          ${["pending","confirmed","cooking","ready","delivered","cancelled"].map(s =>
            `<option value="${s}" ${o.status===s?"selected":""}>${statusLabel(s)}</option>`
          ).join("")}
        </select>
      </td>
    </tr>`).join("");
}

async function updStatus(orderId, status) {
  try {
    const r = await fetch(CFG.GAS_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"updateOrderStatus",orderId,status}) });
    const d = await r.json();
    if (d.status !== "ok") throw new Error();
    aToast(`อัปเดต #${orderId} แล้ว`,"ok");
  } catch { aToast("อัปเดตไม่ได้","err"); }
}

function filterOrders(st) {
  document.querySelectorAll(".filter-chip").forEach(b => b.classList.toggle("on", b.dataset.st === st));
  paintOrders(st === "all" ? A_ORDERS : A_ORDERS.filter(o => o.status === st));
}

/* ───────────────────────────────────────────
   ADMIN LIST (จัดการแอดมิน)
   ─────────────────────────────────────────── */
async function loadAdminList() {
  const list = document.getElementById("admin-list");
  if (!list) return;
  list.innerHTML = `<div class="loading-state"><div class="spinner"></div></div>`;
  try {
    const r = await fetch(`${CFG.GAS_URL}?action=getAdmins`);
    const d = await r.json();
    paintAdmins(d.admins || []);
  } catch { list.innerHTML = `<div class="empty-state"><div class="empty-ico">❌</div><p>โหลดไม่ได้</p></div>`; }
}

function paintAdmins(admins) {
  const list = document.getElementById("admin-list");
  if (!list) return;
  if (!admins.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-ico">👤</div><h3>ยังไม่มีแอดมิน</h3></div>`;
    return;
  }
  list.innerHTML = admins.map(a => `
    <div class="card flex items-c justify-b" style="padding:14px 18px;margin-bottom:10px">
      <div class="flex items-c gap-3">
        <div class="nav-avatar" style="width:36px;height:36px;font-size:0.8rem">
          ${a.pictureUrl?`<img src="${a.pictureUrl}" alt="">`:(a.displayName||"?")[0]}
        </div>
        <div>
          <div class="fw-7 text-sm">${a.displayName||"-"}</div>
          <div class="text-xs text-muted">${a.role==="superadmin"?"👑 Super Admin":"🔧 Admin"} · ${a.userId}</div>
        </div>
      </div>
      ${a.role!=="superadmin"
        ? `<button class="btn btn-danger btn-sm" onclick="delAdmin('${a.userId}')">ลบ</button>`
        : `<span class="badge badge-brand">Super Admin</span>`}
    </div>`).join("");
}

async function addAdmin() {
  const uid  = document.getElementById("af-uid").value.trim();
  const name = document.getElementById("af-name").value.trim();
  if (!uid || !name) { aToast("กรุณากรอกข้อมูลให้ครบ","warn"); return; }
  const btn = document.getElementById("af-save"); btn.disabled = true;
  try {
    const r = await fetch(CFG.GAS_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"addAdmin",userId:uid,displayName:name,role:"admin"}) });
    const d = await r.json();
    if (d.status !== "ok") throw new Error(d.message);
    aToast("เพิ่มแอดมินแล้ว ✅","ok");
    closeAModal("modal-admin");
    await loadAdminList();
  } catch (e) { aToast(e.message||"เพิ่มไม่ได้","err"); }
  finally { btn.disabled = false; }
}

async function delAdmin(uid) {
  if (!confirm("ลบแอดมินคนนี้จริงหรือ?")) return;
  try {
    const r = await fetch(CFG.GAS_URL, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"deleteAdmin",userId:uid}) });
    const d = await r.json();
    if (d.status !== "ok") throw new Error(d.message);
    aToast("ลบแอดมินแล้ว","ok"); await loadAdminList();
  } catch (e) { aToast(e.message||"ลบไม่ได้","err"); }
}

/* ───────────────────────────────────────────
   HELPERS
   ─────────────────────────────────────────── */
function statusBadge(s) {
  const m = {
    pending:   ["badge-warn", "⏳ รอยืนยัน"],
    confirmed: ["badge-info", "✅ ยืนยัน"],
    cooking:   ["badge-warn", "🍳 กำลังทำ"],
    ready:     ["badge-ok",   "🎉 พร้อมส่ง"],
    delivered: ["badge-muted","📦 ส่งแล้ว"],
    cancelled: ["badge-err",  "❌ ยกเลิก"],
  };
  const [cls, lbl] = m[s] || ["badge-muted", s];
  return `<span class="badge ${cls}">${lbl}</span>`;
}
function statusLabel(s) {
  return { pending:"⏳ รอยืนยัน", confirmed:"✅ ยืนยัน", cooking:"🍳 กำลังทำ", ready:"🎉 พร้อมส่ง", delivered:"📦 ส่งแล้ว", cancelled:"❌ ยกเลิก" }[s]||s;
}
function fmtDate(ts) {
  if (!ts) return "-";
  try {
    const d = new Date(ts);
    return d.toLocaleDateString("th-TH",{day:"2-digit",month:"short"})+" "+d.toLocaleTimeString("th-TH",{hour:"2-digit",minute:"2-digit"});
  } catch { return ts; }
}

function openAModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeAModal(id) { document.getElementById(id)?.classList.remove("open"); }
document.addEventListener("click", e => { if (e.target.classList.contains("modal-bg")) e.target.classList.remove("open"); });

function aToast(msg, type="info") {
  const box = document.getElementById("toasts");
  if (!box) return;
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  const ico = { ok:"✅", err:"❌", warn:"⚠️", info:"ℹ️" }[type]||"ℹ️";
  el.innerHTML = `<span>${ico}</span><span>${msg}</span>`;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}