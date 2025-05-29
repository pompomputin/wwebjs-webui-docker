# Multi-Device WhatsApp Web Interface

A web application to interact with multiple WhatsApp accounts simultaneously, built with a Node.js backend (using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)) and a Vue.js frontend.  
**Now features user authentication for private access.**

<div style="display: flex; gap: 20px; align-items: center;">
  <img src="https://raw.githubusercontent.com/azhdaha-100kg/whatsapp-multi-device-web.ui/refs/heads/main/Login.png" alt="Login Screen" width="400" />
  <img src="https://raw.githubusercontent.com/azhdaha-100kg/whatsapp-multi-device-web.ui/refs/heads/main/Dashboard.png" alt="Dashboard Screen" width="400" />
</div>
        
## Features Overview

- **User Authentication**: Secure login with username/password, JWT-based session management.
- **Protected Routes**: Dashboard and features accessible only after login.
- **Multi-Device Session Management**: Add, List, Select, QR Auth, Remove WhatsApp sessions.
- **Real-time Updates via Socket.IO** (Authenticated connections).
- **User Actions per Session**:
    - Send Text Messages (with WhatsApp number validation before sending).
    - Send Images/Videos (via file upload or direct URL, with number validation).
    - Send Locations.
    - Get Contact Information.
    - Set User Status (About/Bio).
    - Bulk Send Messages:
        - Custom time interval (in seconds) between messages.
        - WhatsApp number validation for each recipient.
        - Client-side iteration for text/media.
- **Theming**: Light and Dark mode.
- **Responsive UI**: Tailwind CSS.
- **Frontend Routing**: Vue Router.
- **State Management**: Pinia (session and authentication state).

---

## Core Technologies

- **Backend**: Node.js, Express, [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js), Socket.IO, Multer, Axios, `jsonwebtoken`, `bcryptjs`, `dotenv`
- **Frontend**: Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS, Socket.IO Client, `qrcode.vue`
- **Language**: JavaScript

---

## 1. Prerequisites

### 1.1. Git

Required for version control and cloning.

- **Check if installed:**
  ```bash
  git --version
  ```
- **Install on Ubuntu/Debian:**
  ```bash
  sudo apt update
  sudo apt install git
  ```
- **Other OS:** See [Git Downloads](https://git-scm.com/downloads)

### 1.2. Node.js and npm

- **Recommended:** Node.js 18.x LTS or 20.x LTS (or higher)
- **Check if installed:**
  ```bash
  node -v
  npm -v
  ```
- **Install/Update on Ubuntu/Debian:**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **Other OS:** See [Node.js official site](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm)

---

## 2. Project Setup

### 2.1. Clone the Repository

```bash
git clone https://github.com/azhdaha-100kg/whatsapp-multi-device-app.git
cd whatsapp-multi-device-app
```

---

### 2.2. Backend Setup

Handles WhatsApp communication and user authentication.

1. **Navigate to backend directory:**
   ```bash
   cd path/to/your/whatsapp-multi-device-app/backend
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```
   Core dependencies: `axios`, `cors`, `express`, `multer`, `socket.io`, `whatsapp-web.js`, `jsonwebtoken`, `bcryptjs`, `dotenv`

3. **Create and Configure `.env` File (CRUCIAL FOR AUTHENTICATION):**

   In the backend directory, create a file named `.env`:

   ```
   JWT_SECRET=your_very_strong_and_random_jwt_secret_key
   ADMIN_PASSWORD=your_chosen_secure_admin_password
   # Optional: PORT=3000
   ```

   - The `ADMIN_PASSWORD` will be the password for the default `admin` user. The server will hash this password on startup.
   - **Important:** Add `backend/.env` to your `.gitignore` to keep secrets out of git.

4. **Puppeteer dependencies (Linux only):**  
   `whatsapp-web.js` uses Puppeteer. On Linux, install required system libraries:

   ```bash
   sudo apt-get update && sudo apt-get install -y \
     ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 \
     libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
     libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
     libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
     libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
     --no-install-recommends
   ```

---

### 2.3. Frontend Setup (Vue.js + Vite)

SPA providing the user interface.

1. **Navigate to frontend directory:**
   ```bash
   cd path/to/your/whatsapp-multi-device-app/vue-frontend/vue-whatsapp-frontend
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```
   - Core: `vue`, `vue-router`, `pinia`, `socket.io-client`, `qrcode.vue`
   - Dev: `vite`, `@vitejs/plugin-vue`, `tailwindcss`, `postcss`, `autoprefixer`

3. **Set backend URL in frontend services**

   Edit these files and set your backend's actual IP and port:

   - `src/services/api.js`
     ```js
     const BASE_URL = 'http://YOUR_VM_PUBLIC_IP:3000'; // <--- ENSURE THIS IS CORRECT
     ```
   - `src/services/socket.js`
     ```js
     const BASE_URL = 'http://YOUR_VM_PUBLIC_IP:3000'; // <--- ENSURE THIS IS CORRECT
     ```
   Example:
   ```js
   const BASE_URL = 'http://68.183.233.123:3000';
   ```

---

## 3. Running the Application

You’ll run backend and frontend servers simultaneously (separate terminals).

### 3.1. Start the Backend

```bash
cd path/to/your/whatsapp-multi-device-app/backend
node server.js
```
- The backend runs on the port specified in `.env` or defaults to 3000.
- Look for:  
  `Server with authentication running on http://localhost:3000`

### 3.2. Start the Frontend (Vite Dev Server)

```bash
cd path/to/your/whatsapp-multi-device-app/vue-frontend/vue-whatsapp-frontend
npm run dev -- --host
```
- `--host` makes Vite accessible on your LAN/public IP.
- Default port: 8787 (or as set in `vite.config.js`).

### 3.3. Firewall Configuration

- Ensure ports for backend (e.g. 3000) and frontend (e.g. 8787) are open in your server/VM firewall.

### 3.4. Accessing the App

Open your browser and go to:  
`http://YOUR_VM_PUBLIC_IP:8787` (or whatever port Vite displays).

---

## 4. Initial Steps in the App

1. **Login:**  
   - You’ll be directed to a login page.
   - Use the credentials you configured (`admin` as username, password from `ADMIN_PASSWORD` in your `.env`).
2. **Dashboard:**  
   - Use "Session Management" panel to "Add Device" (provide any unique session ID).
   - If WhatsApp authentication is needed, a QR code appears. Scan it with your WhatsApp mobile app (“Linked devices”).
   - Once session status is **Client is READY!**, you can select it and use features (Send Text/Image, Bulk Send, etc.).
3. **Number Validation:**  
   - When sending messages (single or bulk), the system checks if the recipient number is registered on WhatsApp before sending.

---

## 5. Adding More Users (Manual Backend Edit)

> User management is currently handled manually in the backend.

1. **Generate a password hash:**  
   Use `bcryptjs.hashSync('yourNewPassword', 10)` (in a temporary script or in `server.js` with a `console.log`).

2. **Edit `backend/server.js`:**  
   Add a new user object to the `users` array:
   ```js
   const users = [
     { id: 1, username: 'admin', passwordHash: 'EXISTING_ADMIN_HASH' },
     { id: 2, username: 'newUsername', passwordHash: 'NEW_GENERATED_HASH' }
   ];
   ```
3. **Restart the backend server:**  
   ```bash
   node server.js
   ```
   For robust user management, consider integrating a database in the future.

---

## 6. Building Frontend for Production

```bash
cd path/to/your/whatsapp-multi-device-app/vue-frontend/vue-whatsapp-frontend
npm run build
```
- Production-ready static files will be in the `dist/` directory. Serve them via Nginx, Apache, or other web server.

### Vue Router History Mode

The app uses `createWebHistory` in `src/router/index.js` (for clean URLs).  
**Nginx/Apache must be configured to redirect all app routes to `index.html`.**  
See [Vue Router history mode deployment](https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations).

---

This README provides a complete, up-to-date guide for setup, configuration, and running your multi-device WhatsApp web interface project with user authentication.
