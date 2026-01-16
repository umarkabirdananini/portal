/* =========================================================
   Selection Slip App – FINAL (Desktop + iPhone SAFE)
   ========================================================= */

let MASTER = [];
let currentRecord = null;

/* MUST be HTTPS */
const TRACK_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwMKQajX5j3s3iS5SJvcIkI7TCa_SQWDUcVs9eYQiwvCvm3JpI42ijke5gyCL7wNS_tvQ/exec";

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
   Slip HTML
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

  return `
  <div class="slip-header">
    <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex gap-3 align-items-center">
        <img class="logo"
             src="https://sokotostate.gov.ng/wp-content/uploads/2024/06/Sokoto-State-Government-600-x-200-px-1.png">
        <div>
          <div class="slip-title">Interview Notification Slip</div>
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

    <div class="person-row">
      <img class="passport" src="${photo}"
           onerror="this.src='https://via.placeholder.com/240x280.png?text=Passport'">
      <div>
        <h4>${escapeHtml(r.name)}</h4>

        <div class="meta-grid">
          <div class="meta"><div class="k">Course Studied</div><div class="v">${escapeHtml(r.course)}</div></div>
          <div class="meta"><div class="k">Education Level</div><div class="v">${escapeHtml(edu)}</div></div>
          <div class="meta"><div class="k">LGA</div><div class="v">${escapeHtml(r.lga)}</div></div>
          <div class="meta"><div class="k">Serial Number</div><div class="v">${escapeHtml(r.serial)}</div></div>
        </div>
      </div>
    </div>

    <div class="notice-box mt-4">
      <strong>📄 Next Steps</strong><br>
      The printed slip should be presented at the
      <strong>Office of the State Head of Service</strong>,
      <strong>Usman Faruku Secretariat</strong> 🏢,
      together with <strong>Original credentials</strong>.
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

    /* ❌ NOT FOUND MESSAGE (exact text requested) */
    if (!r) {
      showStatus(
        "danger",
        `<div class="fw-bold">Not Selected</div>
         <div class="small">Sorry! Your Reference Number is either wrong or not among the selected.</div>`
      );
      togglePrint(false);
      return;
    }

    /* ✅ FOUND MESSAGE */
    showStatus(
      "success",
      `<div class="fw-bold">Congratulations!</div>
       <div class="small">You have been selected. Click <b>Print Slip</b> to proceed.</div>`
    );

    togglePrint(true);
    $("#slip").innerHTML = buildSlipHTML(r);
  });

  /* Guaranteed print binding */
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
