# Branded Event Registration Portal

A lightweight, serverless event registration portal integrated with Google Sheets and Google Apps Script as the back-end database and dynamic content management system (CMS).

## 📁 Repository Structure
```text
branded-event-portal/
├── assets/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── admin.js
│       └── form.js
├── backend/
│   └── Code.gs
├── .gitignore
├── README.md
└── index.html
```

## 🚀 Quick Setup & GitHub Pages Deployment
1. Upload this folder to a new GitHub repository.
2. In your repo: **Settings** > **Pages** > select `main` branch and `/(root)` folder.
3. In Google Sheets: **Extensions** > **Apps Script**, paste `backend/Code.gs`, and click **Deploy** > **New deployment** (Execute as: Me, Access: Anyone).
4. Update the `scriptURL` in `index.html` if you create a new deployment.
5. Visit your live site! Append `?admin=true` to edit copy and speaker headshots in your browser.