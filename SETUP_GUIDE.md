# BookSphere — Setup Guide

## What you have
A full personal library web app with:
- Google sign-in (private per user)
- Add/edit/delete books (Bangla & English)
- Track reading progress (page by page)
- Star ratings & reviews
- Custom shelves
- Wishlist
- Reading analytics

---

## Step 1 — Create a Firebase project (free)

1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it "booksphere" → Continue
3. Disable Google Analytics (optional) → **Create project**

### Enable Authentication
1. In Firebase console → **Authentication** → Get started
2. Click **Sign-in method** → Enable **Google** → Save

### Enable Firestore Database
1. In Firebase console → **Firestore Database** → Create database
2. Choose **"Start in production mode"** → Pick a region (asia-south1 for Bangladesh) → Done

### Get your config
1. In Firebase console → Project Settings (gear icon) → **Your apps**
2. Click **"</>  Web"** → Register app (name: "booksphere") → **Register app**
3. Copy the `firebaseConfig` object — you'll need it in Step 2

### Set Firestore security rules
In Firestore → Rules tab, paste:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```
Click **Publish**.

---

## Step 2 — Add your Firebase config

Open the file: `src/firebase.js`

Replace the placeholder values with your real config:
```js
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

Then rebuild: `npm run build`

---

## Step 3 — Deploy (free hosting)

### Option A: Firebase Hosting (recommended)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
# Select: Use existing project → your booksphere project
# Public directory: build
# Single-page app: Yes
# Don't overwrite index.html: No
firebase deploy
```
Your app will be live at: `https://your-project.web.app`

### Option B: Netlify (drag & drop, easiest)
1. Go to https://netlify.com → Sign up free
2. Drag the entire `build/` folder onto the Netlify dashboard
3. Done — you get a URL instantly
4. Add your Netlify URL to Firebase Auth → Authorized domains

### Option C: Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## Step 4 — Add to phone home screen (PWA)

On Android (Chrome):
- Open your app URL → tap ⋮ menu → "Add to Home screen"

On iPhone (Safari):
- Open your app URL → tap Share → "Add to Home Screen"

The app works like a native app with no install required!

---

## Using the app

| Feature | How to use |
|---|---|
| Add a book | Click "Add Book" button |
| Bangla books | Set Language = বাংলা when adding |
| Track progress | Open book → update current page |
| Shelves | Add "Shelf" name when adding a book |
| Wishlist | Check "Add to Wishlist" when adding |
| Reviews | Add review text in the Add/Edit form |
| Analytics | Click "Analytics" in the sidebar |

---

## Support & customization
The source code is fully yours to modify. The main files are:
- `src/pages/Library.js` — main book grid
- `src/pages/BookDetail.js` — book detail page
- `src/pages/AddBook.js` — add/edit form
- `src/pages/Analytics.js` — charts & stats
- `src/services/books.js` — add more fields here
