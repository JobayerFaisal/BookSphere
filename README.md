<div align="center">

<img src="https://img.shields.io/badge/BookSphere-Personal%20Library%20Manager-8b6f47?style=for-the-badge&logoColor=white" alt="BookSphere" />

# 📚 BookSphere

**A personal library management app built for book lovers.**
Track your books, write reviews, discover reading habits, and manage your collection — in both Bengali and English.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20App-c0392b?style=for-the-badge)](https://booksphere-app.netlify.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![Netlify](https://img.shields.io/badge/Deployed-Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)](https://netlify.com)

</div>

---

## ✨ Features

### 📖 Library Management
- Add books manually, by **ISBN lookup**, or by **title/author search**
- **Barcode scanner** using device camera to scan ISBN barcodes
- Track **200+ books** with full details — title, author, publisher, year, edition, ISBN
- Support for **Bengali (বাংলা) and English** books with proper font rendering
- Organize into custom **shelves / collections**

### 🗂️ Reading Tracking
- Track **reading progress** page by page with a visual progress bar
- Log **reading sessions** — "I read 30 pages today" — with daily pace chart
- Set a **yearly reading goal** with a progress tracker on the dashboard
- Mark books as To Read / Reading / Finished / Paused / Dropped

### ⭐ Reviews & Organization
- Write **full-text reviews** in Bengali or English
- **5-star rating** system per book and per story
- Add **free-form tags** (e.g. favorite, gift, reread)
- **Multiple genres** per book
- **Wishlist** for books you want to buy or borrow
- **Stories / Parts tracker** for collected works and omnibus editions (e.g. Complete Sherlock Holmes)

### 📊 Analytics & Discovery
- Reading habit charts — genre breakdown, language split, rating distribution
- **Book recommendations** based on your reading history and top-rated genres
- Track reading pace over time with session charts

### 🔗 Sharing & Export
- **Share a book review** via public link — no sign-in required for viewers
- **Export library as CSV** — open in Excel or Google Sheets
- **Export library as PDF** — formatted, printable document
- **Print library list** — clean printable view with summary stats

### 🌙 Experience
- **Dark mode** — toggleable, preference saved across sessions
- **Progressive Web App (PWA)** — install on Android or iPhone like a native app
- Works on **desktop, tablet, and mobile**
- All data **private and synced** across devices via Firebase

---

## 🖥️ Screenshots

| Library | Book Detail | Analytics |
|---|---|---|
| *Book grid with real covers* | *Progress, reviews, sessions* | *Reading habit charts* |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Create React App) |
| Database | Firebase Firestore |
| Authentication | Firebase Auth (Google + Email/Password) |
| Hosting | Netlify |
| Barcode scanning | @zxing/library |
| PDF export | jsPDF |
| Book data | Open Library API (free, no key needed) |
| Fonts | Google Fonts — Playfair Display, DM Sans, Noto Serif Bengali |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- A free [Firebase](https://firebase.google.com) account

### 1. Clone the repo

```bash
git clone https://github.com/JobayerFaisal/BookSphere.git
cd BookSphere
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) → Create a new project
2. Enable **Authentication** → Sign-in methods → Enable **Google** and **Email/Password**
3. Enable **Firestore Database** → Start in production mode → Region: `asia-south1`
4. Register a **Web app** → copy the config values

### 4. Configure environment variables

Create a `.env` file in the project root:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

### 5. Set Firestore security rules

In Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /shares/{shareId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

### 6. Run locally

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 7. Build for production

```bash
npm run build
```

---

## 🌐 Deploying to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) → Import from GitHub → Select this repo
3. Build settings are auto-detected from `netlify.toml`
4. Add your Firebase environment variables in Netlify → Site configuration → Environment variables
5. Add your Netlify URL to Firebase Auth → Authorized domains

See [DEPLOY.md](./DEPLOY.md) for detailed deployment instructions.

---

## 📱 Install as Mobile App (PWA)

**Android:** Open the live URL in Chrome → tap ⋮ menu → "Add to Home screen"

**iPhone:** Open the live URL in Safari → tap Share → "Add to Home Screen"

---

## 📁 Project Structure

```
src/
├── components/
│   ├── BookCard.js          # Book grid card with cover image
│   ├── ExportModal.js       # CSV / PDF export
│   ├── Layout.js            # Sidebar navigation, dark mode toggle
│   ├── PrintView.js         # Printable library list
│   └── StoriesTracker.js    # Sub-book tracker for series/omnibus
├── context/
│   └── ThemeContext.js      # Dark mode state
├── pages/
│   ├── AddBook.js           # Add/edit form with ISBN & title search
│   ├── Analytics.js         # Reading habit charts
│   ├── BookDetail.js        # Full book page with sessions & stories
│   ├── Library.js           # Main book grid with goal tracker
│   ├── Login.js             # Auth — Google + email/password
│   ├── Recommendations.js   # Personalized book suggestions
│   ├── ShareView.js         # Public share page (no login needed)
│   ├── Shelves.js           # Shelf browser
│   └── Wishlist.js          # Wishlist page
├── services/
│   ├── books.js             # Firestore CRUD for books
│   ├── export.js            # CSV and PDF export logic
│   ├── sessions.js          # Reading session tracking
│   ├── share.js             # Public share link service
│   └── stories.js           # Stories/parts tracker service
└── firebase.js              # Firebase initialization
```

---

## 🤝 Contributing

This is a personal project, but suggestions and improvements are welcome.

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

Distributed under the Apache 2.0 License. See [LICENSE](./LICENSE) for more information.

---

<div align="center">

Built with ❤️ by [Jobayer Faisal](https://github.com/JobayerFaisal)

</div>
