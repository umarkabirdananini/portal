/* =========================================================
   Selection Slip App – FINAL (Desktop + iPhone SAFE + QR BALANCED)
   ========================================================= */

let MASTER = [];
let currentRecord = null;

/* MUST be HTTPS */
const TRACK_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbxLSML3csbZjm-0DKVcg0BDBQM2Nz9iqzXxUunrA98Ydeq115PlLiD1hRyn_MRnK8t33A/exec";

const $ = (sel) => document.querySelector(sel);

/* ------------------------------
   Load master list
-------------------------------- */
async function loadData() {
  try {
    const res = await fetch("./data/masterlist.json", { cache: "no-store" });
    if (!res.ok) throw new Error("masterlist.json not found");
    MASTER = await res.json();
  } catch (err) {
    showStatus(
      "danger",
      "Master list could not be loaded. Please contact support."
    );
  }
}

/* ------------------------------
   Helpers
-------------------------------- */
function normalizeRef(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function findRecordByRef(ref) {
  const target = normalizeRef(ref);
  return MASTER.find((r) => normalizeRef(r.reference) === target) || null;
}

function showStatus(type, html) {
  $("#resultArea").classList.remove("d-none");
  const card = $("#statusCard");
  card.className = `alert alert-${type}`;
  card.innerHTML = html;
}

function togglePrint(show) {
  $("#printBtn").classList.toggle("d-none", !show);
  $("#slipPreviewWrap").classList.toggle("d-none", !show);
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

/* ------------------------------
   Slip HTML (PROFESSIONAL BALANCED VERSION)
-------------------------------- */
function buildSlipHTML(r) {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const photo =
    r.photoUrl && r.photoUrl.trim()
      ? r.photoUrl.trim()
      : "https://via.placeholder.com/240x280.png?text=Passport";

  const edu =
    r.educationLevel && r.educationLevel.trim()
      ? r.educationLevel.trim()
      : "—";

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    normalizeRef(r.reference)
  )}`;

  return `
  <div class="slip-header">
    <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex gap-3 align-items-center">
        <img class="logo"
             src="https://sokotostate.gov.ng/wp-content/uploads/2024/06/Sokoto-State-Government-600-x-200-px-1.png">
        <div>
          <div class="slip-title">Appointment Notification Slip</div>
          <div class="slip-subtitle">State Recruitment Committee</div>
        </div>
      </div>
      <div class="text-end">
        <div class="badge-chip">Serial No: ${escapeHtml(r.serial)}</div>
        <div class="small">Issued: ${dateStr}</div>
      </div>
    </div>
  </div>

  <div class="slip-body">

    <div class="d-flex justify-content-between mb-3">
      <div class="badge-chip">✅ SELECTED</div>
      <div class="badge-chip">Ref: ${escapeHtml(r.reference)}</div>
    </div>

    <!-- PHOTO + QR -->
    <div style="display:flex; justify-content:center; gap:60px; margin-bottom:30px;">

      <div style="text-align:center;">
        <img src="${photo}"
             style="width:190px; height:220px; object-fit:cover; border:1px solid #222;"
             onerror="this.src='https://via.placeholder.com/240x280.png?text=Passport'">
        <div class="small mt-2">Passport Photograph</div>
      </div>

      <div style="text-align:center;">
        <img src="${qrUrl}"
             style="width:180px; height:180px; border:1px solid #222;">
        <div class="small mt-2">Scan for Verification</div>
        <div class="small">${escapeHtml(r.reference)}</div>
      </div>

    </div>

    <!-- NAME -->
    <div style="text-align:center; margin-bottom:25px;">
      <h4 style="margin:0;">${escapeHtml(r.name)}</h4>
    </div>

    <!-- BALANCED INFO GRID -->
    <div style="
      display:grid;
      grid-template-columns: 1fr 1fr;
      gap:18px;
      border-top:1px solid #ccc;
      padding-top:25px;
    ">

      <div style="border:1px solid #ddd; padding:14px;">
        <div style="font-size:12px; color:#666;">Course Studied</div>
        <div style="font-weight:600; margin-top:4px;">${escapeHtml(r.course)}</div>
      </div>

      <div style="border:1px solid #ddd; padding:14px;">
        <div style="font-size:12px; color:#666;">Education Level</div>
        <div style="font-weight:600; margin-top:4px;">${escapeHtml(edu)}</div>
      </div>

      <div style="border:1px solid #ddd; padding:14px;">
        <div style="font-size:12px; color:#666;">Local Government Area</div>
        <div style="font-weight:600; margin-top:4px;">${escapeHtml(r.lga)}</div>
      </div>

      <div style="border:1px solid #ddd; padding:14px;">
        <div style="font-size:12px; color:#666;">Serial Number</div>
        <div style="font-weight:600; margin-top:4px;">${escapeHtml(r.serial)}</div>
      </div>

    </div>

    <div class="notice-box mt-4">
      <strong>📄 Next Steps</strong><br>
      <strong>The printed slip should be presented at the Office of the State Head of Service</strong>, 
      <strong>Usman Faruku Secretariat</strong> 🏢, 
      together with the <strong>copies of your credentials at a date to be communicated later</strong>.
    </div>

    <div class="mt-4">
      <div class="small">Signed by</div>
      <strong>Barr. Gandi Umar Muhammad, mni</strong><br>
      Secretary, State Recruitment Committee
    </div>

  </div>
  `;
}

/* ------------------------------
   Tracking (GET – reliable)
-------------------------------- */
function trackEvent(action, record) {
  try {
    const url = TRACK_WEBHOOK_URL.replace(/^http:\/\//i, "https://");
    const params = new URLSearchParams({
      action,
      reference: normalizeRef(record.reference),
      name: record.name || "",
      serial: String(record.serial || ""),
      page: location.href,
      t: Date.now().toString(),
    });
    new Image().src = `${url}?${params.toString()}`;
  } catch (e) {}
}

/* ------------------------------
   Print (iPhone safe)
-------------------------------- */
function printSlip() {
  if (!currentRecord) return;

  trackEvent("generated", currentRecord);

  try {
    sessionStorage.setItem("SLIP_HTML", buildSlipHTML(currentRecord));
    sessionStorage.setItem("SLIP_REF", normalizeRef(currentRecord.reference));
    sessionStorage.setItem("SLIP_NAME", currentRecord.name || "");
    sessionStorage.setItem("SLIP_SERIAL", String(currentRecord.serial || ""));
  } catch (e) {}

  window.open("./print.html", "_blank");
}

/* ------------------------------
   UI wiring
-------------------------------- */
function wireUI() {
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const ref = $("#refInput").value.trim();
    if (!ref) return;

    const r = findRecordByRef(ref);
    currentRecord = r;

    if (!r) {
      showStatus(
        "danger",
        `<div class="fw-bold">Not Selected</div>
         <div class="small">Sorry! Your Reference Number is either wrong or not among the selected.</div>`
      );
      togglePrint(false);
      return;
    }

    showStatus(
      "success",
      `<div class="fw-bold">Congratulations!</div>
       <div class="small">You have been selected. Click <b>Print Slip</b> to proceed.</div>`
    );

    togglePrint(true);
    $("#slip").innerHTML = buildSlipHTML(r);
  });

  document.addEventListener("click", (e) => {
    if (e.target.closest("#printBtn")) {
      e.preventDefault();
      printSlip();
    }
  });
}

/* ------------------------------
   Init
-------------------------------- */
window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  wireUI();
});
