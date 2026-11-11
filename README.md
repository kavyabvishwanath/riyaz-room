# Riyaz Room

Piano practice app for Sir's WhatsApp lessons. It reads note photos and recordings from your Google Drive **Piano** folder, shows each song by the title printed on its note sheet, pairs every recording with the note Sir sent closest to it in time (within 10 minutes), and plays them back to back. Imports from WhatsApp are backed up to the same Drive folder.

It is a plain static web app (no server). Your Google sign-in happens in your browser, and the app talks to Google Drive directly.

## Files

| File | What it is |
|---|---|
| `index.html` | The app |
| `drive.js` | Google sign-in and Drive calls |
| `config.js` | **The one file you edit**: your Google client ID and folder name |
| `sw.js`, `manifest.webmanifest`, `*.png` | Home Screen install and offline support |
| `vendor/` | Zip reader (WhatsApp exports) and voice-note decoder |

## 1. Put it online with GitHub Pages (about 5 minutes)

1. Create a new **public** repository on GitHub, e.g. `riyaz-room`. (Pages on private repos needs a paid plan. Nothing secret is in these files: the Google client ID is designed to be public.)
2. **Add file → Upload files**, drag in everything from this folder (including the `vendor` folder), and commit.
3. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)`. Save.
4. After a minute your app is at `https://YOUR-USERNAME.github.io/riyaz-room/`. Note this exact address, with the trailing `/`.

## 2. Let it use your Google Drive (about 10 minutes, once)

In [Google Cloud Console](https://console.cloud.google.com/):

1. **Create a project** named `Riyaz Room`.
2. **APIs & Services → Library** → search **Google Drive API** → **Enable**.
3. **Google Auth Platform** (or *OAuth consent screen*) → **Get started**:
   - App name `Riyaz Room`, support email = your Gmail.
   - Audience: **External**.
   - Contact email: your Gmail. Finish.
4. **Audience → Test users → Add users**: add your own Gmail address. (The app stays in *Testing* mode, which is fine for personal use.)
5. **Data access → Add or remove scopes**: add `.../auth/drive` and `.../auth/drive.appdata`. Save.
6. **Clients → Create client** → type **Web application**:
   - **Authorized JavaScript origins**: `https://YOUR-USERNAME.github.io`
   - **Authorized redirect URIs**: `https://YOUR-USERNAME.github.io/riyaz-room/` (exactly the app address from step 1.4)
   - Create, then copy the **Client ID**.
7. On GitHub, open `config.js` → ✎ edit → replace `YOUR_CLIENT_ID.apps.googleusercontent.com` with your Client ID → commit.

## 3. Install on your iPhone

1. Open the app address in **Safari** and tap **Connect Google Drive**.
2. Sign in. Google will say *"Google hasn't verified this app"*: that's expected for your own testing app. Tap **Continue**, allow Drive access.
3. Tap **Share → Add to Home Screen**. It now opens full-screen with its own icon.

## Using it

- **Each week**: save Sir's notes and voice notes from WhatsApp to Files, then ☰ → **Import from WhatsApp** and select them (selecting everything again is fine; it only adds what's new). Or import the `.zip` from WhatsApp's *Export Chat → Attach Media*.
- **Wrong match?** Open the song → *Wrong song? Change it*. A song without a recording has *Add a recording*.
- Your matches, renamed titles and practice notes are saved to a private app-only file in your Google Drive, so they carry over to a new phone.

## Good to know

- Google's sign-in for apps without a server lasts about an hour. After that the app shows **Connect Google Drive** again; it's one tap, no password. Songs already opened play offline without signing in.
- Song titles are read with Google Drive's text recognition (the app briefly makes a Google Doc copy of each new note photo and deletes it).
- To change the Drive folder, edit `folderName` in `config.js`.
- After you update files on GitHub, reopen the app twice to pick up the new version.
