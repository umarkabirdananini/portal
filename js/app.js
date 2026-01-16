let MASTER = [];
let currentRecord = null;

const TRACK_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwlY5uLfPqkIeNb8YnDfDbhkAVSmOPuFBwWcEiBe4C7HgtkOutVbFhq0UPYGZ-Uwl2u5g/exec";

const $ = (sel) => document.querySelector(sel);

async function loadData() {
  const res = await fetch("./data/masterlist.json", { cache: "no-store" });
  MASTER = await res.json();
}

function normalizeRef(v) {
  return String(v || "").trim().toUpperCase().replace(/\s+/g, "");
}

function findRecordByRef(ref) {
  const target = normalizeRef(ref);
  return MASTER.find((r) => normalizeRef(r.reference) === target) || null;
}

function showStatus(kind, html) {
  $("#resultArea").classList.remove("d-none");
  const card = $("#statusCard");
  card.className = `alert alert-${kind} mb-0`;
  card.innerHTML = html;
}

function togglePrint(found) {
  $("#printBtn").classList.toggle("d-none", !found);
  $("#slipPreviewWrap").classList.toggle("d-none", !found);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[m]));
}

function buildSlipHTML(r) {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const photo =
    r.photoUrl && String(r.photoUrl).trim()
      ? r.photoUrl.trim()
      : "https://via.placeholder.com/240x280.png?text=Passport";

  const edu =
    r.educationLevel && String(r.educationLevel).trim()
      ? String(r.educationLevel).trim()
      : "—";

  return `
    <div class="slip-header">
      <div class="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div class="d-flex align-items-center gap-3">
          <img class="logo" alt="Sokoto State Government Logo"
               src="https://sokotostate.gov.ng/wp-content/uploads/2024/06/Sokoto-State-Government-600-x-200-px-1.png">
          <div>
            <div class="slip-title">Selection Notification & Invitation Slip</div>
            <div class="slip-subtitle">State Recruitment Committee • Official Notice</div>
          </div>
        </div>
        <div class="text-end">
          <div class="badge-chip">📌 Serial No: <span>${escapeHtml(r.serial)}</span></div>
          <div class="small mt-2 opacity-75">Issued: ${escapeHtml(dateStr)}</div>
        </div>
      </div>
    </div>

    <div class="slip-body">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2">
        <div class="badge-chip">✅ Status: SELECTED</div>
        <div class="badge-chip">🆔 Ref: ${escapeHtml(r.reference)}</div>
      </div>

      <div class="mt-4 person-row">
        <img class="passport" alt="Applicant Passport"
             src="${escapeHtml(photo)}"
             onerror="this.src='https://via.placeholder.com/240x280.png?text=Passport'">
        <div>
          <div class="h4 fw-bold mb-1">${escapeHtml(r.name)}</div>

          <div class="meta-grid">
            <div class="meta">
              <div class="k">Course Studied</div>
              <div class="v">${escapeHtml(r.course)}</div>
            </div>
            <div class="meta">
              <div class="k">Education Level</div>
              <div class="v">${escapeHtml(edu)}</div>
            </div>
            <div class="meta">
              <div class="k">LGA</div>
              <div class="v">${escapeHtml(r.lga)}</div>
            </div>
            <div class="meta">
              <div class="k">Serial Number</div>
              <div class="v">${escapeHtml(r.serial)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 notice-box">
        <div class="fw-bold mb-1">📄 Next Steps</div>
        <div class="text-secondary">
          The printed slip should be presented at the <span class="fw-semibold">Office of the State Head of Service</span>,
          <span class="fw-semibold">Usman Faruku Secretariat</span> 🏢, together with:
          <span class="fw-semibold">Original credentials</span>.
        </div>
      </div>

      <div class="mt-4 d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <div class="small text-secondary">Signed by</div>
          <div class="signature">Barr. Gandi Umar Muhammad, mni</div>
          <div class="fw-semibold">Secretary</div>
          <div class="text-secondary">State Recruitment Committee</div>
        </div>
      </div>
    </div>
  `;
}

// ✅ super reliable tracking (GET ping)
function trackPrint(record) {
  if (!TRACK_WEBHOOK_URL) return;

  const params = new URLSearchParams({
    action: "print",
    reference: normalizeRef(record.reference),
    name: record.name || "",
    serial: record.serial || "",
    page: location.href,
    t: Date.now().toString(), // cache buster
  });

  const img = new Image();
  img.onload = () => console.log("✅ TRACK OK");
  img.onerror = () => console.log("❌ TRACK FAIL");
  img.src = `${TRACK_WEBHOOK_URL}?${params.toString()}`;
}

function printSlip() {
  if (!currentRecord) return;

  console.log("🖨️ PRINT BUTTON CLICKED", currentRecord.reference);

  // track first, then print
  trackPrint(currentRecord);

  // tiny delay so request starts before print dialog
  setTimeout(() => window.print(), 300);
}

function wireUI() {
  const form = $("#searchForm");
  const input = $("#refInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const r = findRecordByRef(input.value);
    currentRecord = r;

    if (!r) {
      showStatus(
        "dan
