// ===== Selection Slip App (Bootstrap + Vanilla JS) =====
// Data source: ./data/masterlist.json
// Tracking: Google Apps Script Web App URL (MUST be HTTPS)

let MASTER = [];
let currentRecord = null;

const TRACK_WEBHOOK_URL =
  "https://script.google.com/macros/s/AKfycbwMH0dOU_k1OeksFhuTgCoN-Rqi3ohNSFOJfkddia0UcLo3SdABQHYYCPdvnMsbsjNT6g/exec";

const $ = (sel) => document.querySelector(sel);

async function loadData() {
  try {
    const res = await fetch("./data/masterlist.json", { cache: "no-store" });
    if (!res.ok) throw new Error("masterlist.json not found or blocked");
    MASTER = await res.json();
    console.log("✅ Masterlist loaded:", MASTER.length, "records");
  } catch (err) {
    console.error("❌ Data load error:", err);
    showStatus(
      "danger",
      `Data file could not be loaded. Please confirm <b>data/masterlist.json</b> exists and is committed to GitHub Pages.`
    );
  }
}

function normalizeRef(v) {
  return String(v || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function findRecordByRef(ref) {
  const target = normalizeRef(ref);
  if (!target) return null;
  return MASTER.find((r) => normalizeRef(r.reference) === target) || null;
}

function showStatus(kind, html) {
  const area = $("#resultArea");
  const card = $("#statusCard");
  area.classList.remove("d-none");
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
          <div class="text-secondary mb-3">
            Congratulations! You have been selected and offered an appointment, subject to verification of your credentials.
          </div>

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
          The printed slip should be presented at the Office of the State Head of Service,
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

      <div class="mt-4 pt-3 border-top small text-secondary">
        © ${new Date().getFullYear()} Sokoto State Government — Recruitment Selection Portal
      </div>
    </div>
  `;
}

// ===== Tracking (Reliable on GitHub Pages) =====
// Uses GET "image ping" => no CORS, no preflight
function trackPrint(record) {
  try {
    if (!TRACK_WEBHOOK_URL) return;

    // Force HTTPS (prevents Mixed Content)
    const url = TRACK_WEBHOOK_URL.replace(/^http:\/\//i, "https://");

    // Only attempt if it is a Google script https URL
    if (!/^https:\/\/script\.google\.com\//i.test(url)) {
      console.warn("⚠️ Tracking URL does not look like a Google Apps Script HTTPS URL.");
      return;
    }

    const params = new URLSearchParams({
      action: "print",
      reference: normalizeRef(record.reference),
      name: record.name || "",
      serial: String(record.serial || ""),
      page: location.href,
      t: Date.now().toString(), // cache-buster
    });

    const img = new Image();
    img.onload = () => console.log("✅ TRACK OK");
    img.onerror = () => console.log("❌ TRACK FAIL");
    img.src = `${url}?${params.toString()}`;
  } catch (e) {
    console.log("❌ TRACK ERROR", e);
  }
}

function printSlip() {
  if (!currentRecord) return;

  console.log("🖨️ PRINT CLICKED:", currentRecord.reference);

  // Track first, then print
  trackPrint(currentRecord);

  // small delay so request starts before print dialog
  setTimeout(() => window.print(), 250);
}

function wireUI() {
  const form = $("#searchForm");
  const input = $("#refInput");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const refVal = input.value.trim();
    if (!refVal) return;

    const r = findRecordByRef(refVal);
    currentRecord = r;

    if (!r) {
      showStatus(
        "danger",
        `<div class="fw-bold">Record not found</div>
         <div class="small">Your reference number was not found in the current master list. Please confirm and try again.</div>`
      );
      togglePrint(false);
      return;
    }

    showStatus(
      "success",
      `<div class="fw-bold">Selected ✅</div>
       <div class="small">Your record was found. Click <b>Print Slip</b> to proceed.</div>`
    );

    togglePrint(true);

    // Toast (if present)
    const toastEl = $("#successToast");
    if (toastEl && window.bootstrap?.Toast) {
      bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 }).show();
    }

    // Build slip preview
    $("#slip").innerHTML = buildSlipHTML(r);
  });

  // ✅ Event delegation = button always works even if DOM changes
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("#printBtn");
    if (btn) {
      e.preventDefault();
      printSlip();
    }
  });

  console.log("✅ App wired: print listener active");
}

window.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  wireUI();
});
