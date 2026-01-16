# Recruitment Selection Slip Portal (GitHub Pages)

This is a **Bootstrap + JavaScript** single‑page app that lets applicants:
- Search selection status by **Reference Number**
- View an official **notification/invitation slip**
- **Print** the slip
- **Download** the slip as **PDF**

## Files
- `index.html` — main UI
- `data/masterlist.json` — master list records (exported from your Excel)
- `css/style.css` — styling
- `js/app.js` — logic

## How to host on GitHub Pages
1. Create a new GitHub repo (e.g. `selection-slip-portal`)
2. Upload **all files and folders** exactly as-is.
3. Go to **Settings → Pages**
4. Source: **Deploy from a branch**
5. Branch: `main` (or `master`) / Folder: `/root`
6. Save — your site will be live at your GitHub Pages URL.

## Updating the master list
Replace `data/masterlist.json` with a new export whenever your list changes.

### Photo URL (optional)
If you add a photo URL column in your Excel, ensure it exports to JSON as `photoUrl` for each record.
If missing, the app shows a placeholder passport.



## Tracking who generated a slip (optional)
Because GitHub Pages is static (no backend), tracking needs either:

### Option A) Local tracking only (already enabled)
The app stores a small log in the visitor's browser via `localStorage` (per device).

### Option B) Central tracking (recommended)
Use a free Google Sheet + Google Apps Script as a webhook collector.

1) Create a Google Sheet, name it e.g. `Slip Logs`
2) Extensions → Apps Script
3) Paste this code:

```js
function doPost(e){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("Logs") || ss.insertSheet("Logs");
  const data = JSON.parse(e.postData.contents);

  if(sh.getLastRow() === 0){
    sh.appendRow(["Timestamp","Reference","Name","Serial","Page"]);
  }
  sh.appendRow([new Date(), data.reference, data.name, data.serial, data.page]);
  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}
```

4) Deploy → New deployment → Web app
   - Execute as: Me
   - Who has access: Anyone
5) Copy the Web App URL and paste it into `js/app.js`:

```js
const TRACK_WEBHOOK_URL = "YOUR_WEB_APP_URL_HERE";
```

Now every successful print will be recorded in your Sheet.

