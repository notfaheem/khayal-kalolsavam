# GHSS ERANHIMANGAD - ഖയാൽ 2K26 (Frontend-Only Static Portal)

Official, lightweight, mobile & PC compatible result publishing website for **GHSS ERANHIMANGAD** School Kalolsavam (**ഖയാൽ 2K26**).

---

## 🚀 How to Add or Update Results (Google Drive Links)

This website is **100% frontend only** with no backend, database, or server needed.
All 38 items are listed directly inside [**`index.html`**](index.html).

### 3 Simple Steps:
1. **Upload your result PDF** to your Google Drive.
2. In Google Drive, right-click the file ➔ **Share** ➔ change access to **"Anyone with the link can view"** ➔ **Copy link**.
3. Open [**`index.html`**](index.html), search for the item by code or name (e.g., `703`, `601`, `Oppana`), and paste the link into `driveLink`:

```javascript
// Example:
{
  code: "601",
  name: "Chithra Rachana - Pencil",
  nameMl: "ചിത്രരചന - പെൻസിൽ",
  category: "HS General",
  participants: 3,
  driveLink: "https://drive.google.com/file/d/1YourFileIdHere/view?usp=sharing" // <-- PASTE LINK HERE
},
```

> **Note**: For items whose results are still pending, leave `driveLink: ""` empty. The website will automatically show **"⏳ Result Awaiting"**. Once you paste a link, it immediately turns into **"✓ Result Published"** with the **"View Result"** button!

---

## 💻 How to View Locally
You can view the site locally in any of these ways:
- **Option 1**: Simply double-click [**`index.html`**](index.html) in your file explorer to open it in Chrome, Edge, or Firefox!
- **Option 2**: Run `python -m http.server 3000` (or `npm start`) and open `http://localhost:3000`.

---

## 📁 File Structure

```text
khayal/
├── index.html        # Main page containing all 38 items and Google Drive links
├── favicon.svg       # Festival icon
├── assets/
│   └── poster.jpg    # Festival poster
├── css/
│   └── style.css     # Styling, responsive layout & colors
├── package.json      # Local dev server script
├── vercel.json       # Clean static hosting config
└── README.md         # Documentation
```
