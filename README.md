# GHSS ERANHIMANGAD - ഖയാൽ 2K26 (School Kalolsavam Portal)

Official lightweight, mobile-first result publishing website for **GHSS ERANHIMANGAD** School Kalolsavam (**ഖയാൽ 2K26**).

---

## 🌟 Key Features

### 📱 Public Website (Mobile & PC Compatible)
- **Modern & Minimalist Design**: Clean UI styled with the vibrant colors and branding from the official **ഖയാൽ 2K26** festival poster.
- **Ultra Lightweight & Fast**: Vanilla JavaScript and modern CSS with zero heavy frontend bundle overhead. Loads in milliseconds even on slow 2G/3G mobile networks.
- **Pre-loaded with All 38 Items**:
  - **11 HS Arabic** items (Caption Rachana, Tharjama, Poster Nirmanam, Arabi Ganam, Quran Parayanam, etc.)
  - **27 HS General** items (Chithra Rachana, Mappilappattu, Nadodi Nrutham, Bharathanatyam, Oppana, Dafmuttu, etc.)
- **Bilingual Support & Instant Search**:
  - Live instant search supporting Malayalam (`ഒപ്പന`, `ചിത്രരചന`) and English (`Oppana`, `Pencil`, item codes like `601`, `703`).
- **Category Filter Tabs**:
  - `All Items (38)`
  - `🎭 HS General (27)`
  - `🌙 HS Arabic (11)`
  - `🏆 Results Published` (filters only items with available results)
- **In-App PDF Viewer & Download**:
  - Tap **"View Result"** to preview the PDF result sheet directly within the modal.
  - Dedicated **"Download PDF"** and **"Open Full Tab"** buttons with mobile-device detection.
- **Festival Poster Preview**:
  - Interactive poster card with zoom preview and high-resolution poster download.

---

### 🔐 Admin Panel (`/admin`)
- **Password Protected**: Default password is `admin123` (can be changed anytime in Settings).
- **Result Uploads**:
  - Single-click or drag-and-drop PDF result upload per item.
  - Preview, replace, or delete uploaded result sheets.
- **Item Management**:
  - Add new competition items with item code, English name, Malayalam name, category, and participant counts.
  - Edit existing items anytime.
  - Delete items with safety confirmation.
- **Database & Backups**:
  - Persistent, lightweight JSON database in `data/database.json`.
  - One-click **Download JSON Backup**.
  - One-click **Reset to Original 38 Items** if needed.

---

## 🚀 Getting Started

### 1. Installation
The dependencies are already installed. If running on a new computer:
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```
The application will be live at:
- **Public Results Portal**: [http://localhost:3000](http://localhost:3000)
- **Admin Management Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)

> **Default Admin Password**: `admin123`

---

## 📁 Project Structure

```text
khayal/
├── data/
│   ├── defaultItems.js      # Initial dataset of all 38 items
│   └── database.json        # Persistent database (auto-created)
├── public/
│   ├── assets/
│   │   └── poster.jpg       # Official festival poster
│   ├── css/
│   │   └── style.css        # Responsive stylesheet
│   ├── js/
│   │   ├── app.js           # Public site logic & PDF modal
│   │   └── admin.js         # Admin dashboard logic
│   ├── favicon.svg          # Fest icon
│   ├── index.html           # Public results page
│   └── admin.html           # Admin portal page
├── uploads/
│   └── results/             # Uploaded PDF result sheets
├── .env                     # Configuration (PORT, secret keys)
├── db.js                    # Database storage engine
├── server.js                # Express backend & API
├── package.json
└── README.md
```

---

## 📋 Preloaded Items List

### HS Arabic (11 Items)
| Code | Item Name (English) | Item Name (Malayalam) | Participants |
| :--- | :--- | :--- | :--- |
| **703** | Caption Rachana | ക്യാപ്ഷൻ രചന | 1 |
| **704** | Tharjama ( Arabic) | തർജമ (അറബിക്) | 2 |
| **705** | Poster Nirmanam | പോസ്റ്റർ നിർമ്മാണം | 1 |
| **706** | Padyam Chollal (Boys) | പദ്യം ചൊല്ലൽ (ആൺ) | 1 |
| **707** | Padyam Chollal (Girls) | പദ്യം ചൊല്ലൽ (പെൺ) | 2 |
| **708** | Arabi Ganam (Boys) | അറബി ഗാനം (ആൺ) | 1 |
| **709** | Arabi Ganam (Girls) | അറബി ഗാനം (പെൺ) | 3 |
| **711** | Mono Act | മോണോ ആക്ട് | 1 |
| **713** | Quran Parayanam | ഖുർആൻ പാരായണം | 5 |
| **716** | Nikhandu Nirmanam | നിഘണ്ടു നിർമ്മാണം | 1 |
| **718** | Sangha Ganam | സംഘഗാനം | 3 |

### HS General (27 Items)
| Code | Item Name (English) | Item Name (Malayalam) | Participants |
| :--- | :--- | :--- | :--- |
| **601** | Chithra Rachana - Pencil | ചിത്രരചന - പെൻസിൽ | 3 |
| **602** | Chithra Rachana - Water Colour | ചിത്രരചന - ജലച്ചായം | 3 |
| **604** | Cartoon | കാർട്ടൂൺ | 3 |
| **610** | Lalithaganam (Girls) | ലളിതഗാനം (പെൺ) | 3 |
| **612** | Mappilappattu (Girls) | മാപ്പിളപ്പാട്ട് (പെൺ) | 5 |
| **628** | Nadodi Nrutham (Girls) | നാടോടി നൃത്തം (പെൺ) | 3 |
| **631** | Bharathanatyam (Girls) | ഭരതനാട്യം (പെൺ) | 3 |
| **636** | Prasangam - Malayalam | പ്രസംഗം - മലയാളം | 1 |
| **640** | Katharachana - Malayalam | കഥാരചന - മലയാളം | 4 |
| **643** | Upanyasam - Malayalam | ഉപന്യാസം - മലയാളം | 3 |
| **644** | Upanyasam - English | ഉപന്യാസം - ഇംഗ്ലീഷ് | 1 |
| **649** | Padyam Chollal - Malayalam | പദ്യം ചൊല്ലൽ - മലയാളം | 3 |
| **650** | Padyam Chollal - English | പദ്യം ചൊല്ലൽ - ഇംഗ്ലീഷ് | 2 |
| **651** | Padyam Chollal - Hindi | പദ്യം ചൊല്ലൽ - ഹിന്ദി | 1 |
| **653** | Padyam Chollal - Urdu | പദ്യം ചൊല്ലൽ - ഉറുദു | 3 |
| **654** | Padyam Chollal - Tamil | പദ്യം ചൊല്ലൽ - തമിഴ് | 1 |
| **667** | Dafmuttu (Boys) | ദഫ്മുട്ട് (ആൺ) | 1 |
| **668** | Margamkali (Girls) | മാർഗ്ഗംകളി (പെൺ) | 1 |
| **669** | Thiruvathirakali (Girls) | തിരുവാതിരക്കളി (പെൺ) | 2 |
| **670** | Oppana (Girls) | ഒപ്പന (പെൺ) | 3 |
| **687** | Vanchipattu | വഞ്ചിപ്പാട്ട് | 2 |
| **688** | Nadanpattu | നാടൻപാട്ട് | 2 |
| **689** | Groupsong Urdu | ഗ്രൂപ്പ് സോംഗ് (ഉറുദു) | 1 |
| **692** | Kavitharachana-English | കവിതാരചന - ഇംഗ്ലീഷ് | 1 |
| **695** | Katha Rachana - English | കഥാരചന - ഇംഗ്ലീഷ് | 3 |
| **697** | Group Song | സംഘഗാനം | 1 |
| **1017** | Paliya Nirtham | പാലിയ നൃത്തം | 1 |

---

## 🌐 Deploying to the Web

To publish this website on the internet so students and parents can access it from their phones:
1. **Render.com / Railway.app / Fly.io**:
   - Connect this GitHub repository.
   - Build command: `npm install`
   - Start command: `node server.js`
   - Environment variables: `PORT=3000`
2. **Local School Network**:
   - Run `npm start` on any school computer.
   - Other devices on the school Wi-Fi can open `http://<SCHOOL_PC_IP>:3000`.
