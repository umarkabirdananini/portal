// Selection Slip App (Bootstrap + Vanilla JS)
// Data source: ./data/masterlist.json
// Optional tracking: set TRACK_WEBHOOK_URL to a Google Apps Script Web App URL (or any endpoint that accepts POST JSON)

let MASTER = [];
let currentRecord = null;

// OPTIONAL: Tracking webhook (leave blank to disable server-side tracking)
if (TRACK_WEBHOOK_URL && TRACK_WEBHOOK_URL.startsWith("http")) {
  const params = new URLSearchParams({
    action: "print",
    reference: normalizeRef(record.reference),
    name: record.name || "",
    serial: record.serial || "",
    page: location.href
  });

  // Use an image request (CORS-proof)
  const img = new Image();
  img.src = `${TRACK_WEBHOOK_URL}?${params.toString()}`;
}
const $ = (sel) => document.querySelector(sel);

async function loadData(){
  try{
    const res = await fetch('./data/masterlist.json', { cache: 'no-store' });
    if(!res.ok) throw new Error('Unable to load masterlist.json');
    MASTER = await res.json();
  }catch(err){
    console.error(err);
    showStatus('danger', 'Data file could not be loaded. Please ensure <b>data/masterlist.json</b> exists in your GitHub Pages site.');
  }
}

function normalizeRef(v){
  return String(v || '').trim().toUpperCase().replace(/\s+/g,'');
}

function findRecordByRef(ref){
  const target = normalizeRef(ref);
  if(!target) return null;
  return MASTER.find(r => normalizeRef(r.reference) === target) || null;
}

function showStatus(kind, html){
  const area = $('#resultArea');
  const card = $('#statusCard');
  area.classList.remove('d-none');
  card.className = `alert alert-${kind} mb-0`;
  card.innerHTML = html;
}

function togglePrint(found){
  $('#printBtn').classList.toggle('d-none', !found);
  $('#slipPreviewWrap').classList.toggle('d-none', !found);
}

function escapeHtml(str){
  return String(str ?? '').replace(/[&<>"']/g, (m)=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
  }[m]));
}

function buildSlipHTML(r){
  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { year:'numeric', month:'long', day:'numeric' });

  const photo = (r.photoUrl && String(r.photoUrl).trim()) ? r.photoUrl.trim() : 'https://via.placeholder.com/240x280.png?text=Passport';
  const edu = (r.educationLevel && String(r.educationLevel).trim()) ? String(r.educationLevel).trim() : '—';

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
          The printed slip should be presented at the <span class="fw-semibold">Office of the State Head of Service</span>,
          <span class="fw-semibold">Usman Faruku Secretariat</span> 🏢, together with: <span class="fw-semibold">Original credentials</span>.
        </div>
      </div>

      </div>
      <div class="mt-4 d-flex justify-content-between align-items-end flex-wrap gap-3">
        <div>
          <div class="small text-secondary">Signed by</div>
          <div class="signature">Barr. Gandi Umar Muhammad, mni</div>
          <div class="fw-semibold">Secretary</div>
          <div class="text-secondary">State Recruitment Committee</div>
        </div>

        <div class="text-end">
          <div class="small text-secondary">Verification note</div>
          <div class="fw-semibold">Present this slip at the secretariat</div>
          <div class="text-secondary small">Do not fold, tamper, or alter.</div>
        </div>
      </div>

      <div class="mt-4 pt-3 border-top small text-secondary">
        © ${new Date().getFullYear()} Sokoto State Government — Recruitment Selection Portal
      </div>
    </div>
  `;
}

// ===== Tracking (client-side + optional server webhook) =====
function trackSuccessfulGeneration(record){
  try{
    // Local log (works offline, per device/browser)
    const key = "slip_generation_log";
    const log = JSON.parse(localStorage.getItem(key) || "[]");
    log.push({
      reference: normalizeRef(record.reference),
      name: record.name || "",
      serial: record.serial || "",
      ts: new Date().toISOString(),
      ua: navigator.userAgent
    });
    localStorage.setItem(key, JSON.stringify(log));
  }catch(e){
    console.warn("Local tracking failed:", e);
  }

  // Optional server-side log
  if(TRACK_WEBHOOK_URL && TRACK_WEBHOOK_URL.startsWith("http")){
    fetch(TRACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: normalizeRef(record.reference),
        name: record.name || "",
        serial: record.serial || "",
        timestamp: new Date().toISOString(),
        page: location.href
      })
    }).catch(()=>{ /* silently ignore */ });
  }
}

function printSlip(){
  if(!currentRecord) return;

  // Track "generated successfully"
  trackSuccessfulGeneration(currentRecord);

  // Print only the slip (CSS @media print handles visibility)
  window.print();
}

function wireUI(){
  const form = $('#searchForm');
  const input = $('#refInput');

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    e.stopPropagation();

    if(!input.value.trim()){
      form.classList.add('was-validated');
      return;
    }

    const r = findRecordByRef(input.value);
    currentRecord = r;

    if(!r){
      showStatus('danger', `
        <div class="fw-bold">Record not found</div>
        <div class="small">Your reference number was not found in the current master list. Please confirm and try again.</div>
      `);
      togglePrint(false);
      return;
    }

    // Found
    showStatus('success', `
      <div class="fw-bold">Selected ✅</div>
      <div class="small">Your record was found. Click <b>Print Slip</b> to proceed.</div>
    `);
    togglePrint(true);

    // Toast
    const toast = bootstrap.Toast.getOrCreateInstance($('#successToast'), { delay: 4500 });
    toast.show();

    // Build slip preview
    $('#slip').innerHTML = buildSlipHTML(r);
  });

  $('#printBtn').addEventListener('click', printSlip);
}

(async function init(){
  await loadData();
  wireUI();
})();
