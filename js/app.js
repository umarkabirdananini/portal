// Selection Slip App (Bootstrap + Vanilla JS)
// Data source: ./data/masterlist.json
// Tip: If you add an image URL column to the Excel later, re-export masterlist.json and use key: photoUrl

let MASTER = [];
let currentRecord = null;

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

function toggleActions(found){
  $('#openSlipBtn').classList.toggle('d-none', !found);
  $('#downloadBtn').classList.toggle('d-none', !found);
  $('#printBtn').classList.toggle('d-none', !found);
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
        <img class="passport" alt="Applicant Passport" src="${escapeHtml(photo)}" onerror="this.src='https://via.placeholder.com/240x280.png?text=Passport'">
        <div>
          <div class="h4 fw-bold mb-1">${escapeHtml(r.name)}</div>
          <div class="text-secondary mb-3">Congratulations! You have been selected and offered an appointment, subject to verification of your credentials.</div>

          <div class="meta-grid">
            <div class="meta">
              <div class="k">Course Studied</div>
              <div class="v">${escapeHtml(r.course)}</div>
            </div>
            <div class="meta">
              <div class="k">LGA</div>
              <div class="v">${escapeHtml(r.lga)}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-4 notice-box">
        <div class="fw-bold mb-1">📄 Notification & Next Steps</div>
        <div class="text-secondary">
          The printed slip should be presented at the <span class="fw-semibold">Office of the State Head of Service</span>,
          <span class="fw-semibold">Usman Faruku Secretariat</span> 🏢, together with:
          <ul class="mb-0 mt-2">
            <li>Original credentials</li>
            <li>Portal receipt 🧾</li>
          </ul>
          <div class="mt-2">
            This serves as evidence of notification and invitation for the collection of appointment letters 📬.
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

async function downloadPDF(){
  if(!currentRecord) return;

  const slipEl = $('#slip');

  // Render at higher scale for crisp PDF
  const canvas = await html2canvas(slipEl, {
    scale: 2,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff'
  });

  const imgData = canvas.toDataURL('image/png');
  const { jsPDF } = window.jspdf;

  // A4 portrait: 210 x 297 mm
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Compute image dimensions in mm preserving aspect ratio
  const imgWidth = pageWidth - 16; // margins
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let y = 8;

  if(imgHeight <= pageHeight - 16){
    pdf.addImage(imgData, 'PNG', 8, y, imgWidth, imgHeight);
  }else{
    // Multi-page
    let remaining = imgHeight;
    let sourceY = 0;

    // Convert mm->px scaling factor for slicing
    const pxPerMm = canvas.width / imgWidth;

    while(remaining > 0){
      const sliceHeightMm = Math.min(pageHeight - 16, remaining);
      const sliceHeightPx = Math.floor(sliceHeightMm * pxPerMm);

      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = sliceHeightPx;

      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

      const sliceImg = sliceCanvas.toDataURL('image/png');
      pdf.addImage(sliceImg, 'PNG', 8, 8, imgWidth, sliceHeightMm);

      remaining -= sliceHeightMm;
      sourceY += sliceHeightPx;

      if(remaining > 0) pdf.addPage();
    }
  }

  const safeRef = normalizeRef(currentRecord.reference).replace(/[^A-Z0-9-]/g,'');
  pdf.save(`Selection_Slip_${safeRef || 'Candidate'}.pdf`);
}

function printSlip(){
  // Open modal first (in case user printed from outside modal)
  const modalEl = $('#slipModal');
  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();

  // Small delay so the slip is fully visible before printing
  setTimeout(() => window.print(), 350);
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
      toggleActions(false);
      return;
    }

    // Found
    showStatus('success', `
      <div class="fw-bold">Selected ✅</div>
      <div class="small">Your record was found. Click <b>View / Print Slip</b> to proceed.</div>
    `);
    toggleActions(true);

    // Toast
    const toast = bootstrap.Toast.getOrCreateInstance($('#successToast'), { delay: 4500 });
    toast.show();

    // Build slip content
    $('#slip').innerHTML = buildSlipHTML(r);
  });

  // Action buttons (outside modal)
  $('#downloadBtn').addEventListener('click', downloadPDF);
  $('#printBtn').addEventListener('click', printSlip);

  // Modal buttons
  $('#modalDownloadBtn').addEventListener('click', downloadPDF);
  $('#modalPrintBtn').addEventListener('click', ()=>window.print());

  // Also rebuild slip when modal opens (ensures latest)
  $('#slipModal').addEventListener('show.bs.modal', ()=>{
    if(currentRecord) $('#slip').innerHTML = buildSlipHTML(currentRecord);
  });
}

(async function init(){
  await loadData();
  wireUI();
})();
