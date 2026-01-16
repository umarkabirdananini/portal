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

