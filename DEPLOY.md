# BookSphere — Deployment Guide

## Deploy to Netlify (Free, Permanent URL)

### Step 1 — Build the app
```bash
npm run build
```

### Step 2 — Deploy to Netlify (drag & drop — no account needed for first try)
1. Go to https://netlify.com
2. Sign up free (use Google)
3. From the dashboard click **"Add new site"** → **"Deploy manually"**
4. Drag your entire `build/` folder onto the upload area
5. Wait ~30 seconds → Netlify gives you a URL like `https://random-name-123.netlify.app`

### Step 3 — Set a custom name (optional)
- In Netlify dashboard → Site settings → General → Site name → change to e.g. `my-booksphere`
- Your URL becomes: `https://my-booksphere.netlify.app`

### Step 4 — Add your Netlify URL to Firebase Auth
This is required so Google sign-in works on the live URL.
1. Go to Firebase Console → Authentication → Settings → **Authorized domains**
2. Click **Add domain** → paste your Netlify URL (e.g. `my-booksphere.netlify.app`)
3. Click **Add**

---

## Update Firestore Security Rules (Required for Share Links)

Go to Firebase Console → Firestore → **Rules** tab and replace with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Private user data — only the owner can read/write
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Public shares — anyone can read, only owner can write/delete
    match /shares/{shareId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
    }
  }
}
```

Click **Publish** after saving.

---

## Re-deploying after updates

Every time you make changes and rebuild:
1. Run `npm run build`
2. In Netlify dashboard → **Deploys** tab → drag the new `build/` folder

Or use Netlify CLI for one-command deploys:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=build
```

---

## What's live after deployment

- ✅ Accessible from any device — phone, tablet, laptop
- ✅ Google sign-in works
- ✅ Camera barcode scanner works (HTTPS required — Netlify provides this)
- ✅ Share links work: `https://your-site.netlify.app/share/SHARE_ID`
- ✅ Install as PWA on Android/iPhone via "Add to Home Screen"
- ✅ Dark mode, export, print — everything works

---

## Share link format
When you share a book review, the link will look like:
`https://your-site.netlify.app/share/uid_bookId`

Anyone with the link can view the book title, cover, your rating and review — no sign-in needed.
