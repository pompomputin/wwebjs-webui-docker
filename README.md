# Multi-Device WhatsApp Web Interface

A web application to interact with multiple WhatsApp accounts simultaneously, built with a Node.js backend (using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)) and a Vue.js frontend.

---

## Features Overview

- **Multi-Device Session Management**: Add, List, Select, QR Auth, Remove
- **Real-time Updates via Socket.IO**
- **User Actions per Session**:
    - Send Text Messages
    - Send Images/Videos (via file upload or direct URL)
    - Send Locations
    - Get Contact Information
    - Set User Status (About/Bio)
    - Bulk Send Messages (client-side iteration for text/media)
- **Theming**: Light and Dark mode
- **Responsive UI**: Tailwind CSS
- **Frontend Routing**: Vue Router
- **State Management**: Pinia

---

## Core Technologies

- **Backend**: Node.js, Express, [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js), Socket.IO, Multer, Axios
- **Frontend**: Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS, Socket.IO Client, `qrcode.vue`
- **Language**: JavaScript

---

## 1. Prerequisites

### 1.1. Git

Required for version control and to clone this repository.

- **Check if installed**:
  ```bash
  git --version
  ```
- **Install on Ubuntu/Debian**:
  ```bash
  sudo apt update
  sudo apt install git
  ```
- **Other OS**: See [Git Downloads](https://git-scm.com/downloads)

### 1.2. Node.js and npm

Node.js is the runtime, npm is its package manager.

- **Recommended Node.js**: 18.x LTS or 20.x LTS (or higher)
- **Check if installed**:
  ```bash
  node -v
  npm -v
  ```
- **Install/Update on Ubuntu/Debian**:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **Other OS**: See [Node.js official site](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm)

---

## 2. Project Setup

### 2.1. Clone the Repository

If setting up from GitHub:

```bash
git clone https://github.com/azhdaha-100kg/whatsapp-multi-device-app.git
cd whatsapp-multi-device-app
```
Replace `YOUR_USERNAME` and `YOUR_REPOSITORY_NAME` as appropriate.

---

### 2.2. Backend Setup

Handles WhatsApp communication.

1. **Navigate to backend directory:**
   ```bash
   cd path/to/your/whatsapp_business_app/backend
   ```
2. **Install backend dependencies:**
   ```bash
   npm install
   ```
   Core dependencies: `axios`, `cors`, `express`, `multer`, `socket.io`, `whatsapp-web.js`

3. **Puppeteer dependencies (Linux only)**  
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

Vue 3 SPA.

1. **Navigate to frontend directory:**
   ```bash
   cd path/to/your/whatsapp_business_app/vue-frontend/vue-whatsapp-frontend
   ```
   (Adjust folder name if different.)

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```
   Core dependencies: `vue`, `vue-router`, `pinia`, `socket.io-client`, `qrcode.vue`.  
   Dev: `vite`, `@vitejs/plugin-vue`, `tailwindcss`, `postcss`, `autoprefixer`, `@tailwindcss/postcss`.

3. **Critical: Set backend URL in frontend services**

   Edit these files and set your backend's actual IP and port:

   - `src/services/api.js`  
     ```js
     const BASE_URL = 'http://YOUR_VM_PUBLIC_IP:3000'; // <--- SET THIS
     ```
   - `src/services/socket.js`  
     ```js
     const BASE_URL = 'http://YOUR_VM_PUBLIC_IP:3000'; // <--- SET THIS
     ```

   For example, if your backend runs on 43.134.142.240:3000:
   ```
   const BASE_URL = 'http://43.134.142.240:3000';
   ```

---

## 3. Running the Application

You’ll run backend and frontend servers simultaneously (separate terminals).

### 3.1. Start the Backend

```bash
cd path/to/your/whatsapp_business_app/backend
node server.js
```
Backend typically on port 3000. Look for log:  
`Multi-session backend on http://localhost:3000`

### 3.2. Start the Frontend (Vite Dev Server)

```bash
cd path/to/your/whatsapp_business_app/vue-frontend/vue-whatsapp-frontend
npm run dev -- --host
```
`-- --host` makes Vite accessible on your LAN/public IP.  
Vite default port: 5173 (or similar).  
Terminal will show:
```
➜  Local:   http://localhost:5173/
➜  Network: http://YOUR_VM_LOCAL_IP:5173/
```

### 3.3. Firewall Configuration

Ensure ports for backend (e.g. 3000) and frontend (e.g. 5173) are open:

- **Cloud Provider**: Open ports in security group/firewall rules.
- **VM Firewall (e.g. UFW on Ubuntu)**:
  ```bash
  sudo ufw allow 3000/tcp
  sudo ufw allow 5173/tcp
  ```

### 3.4. Accessing the App

Open a browser and go to:  
`http://YOUR_VM_PUBLIC_IP:5173`

---

## 4. Initial Steps in the App

1. Use "Session Management" panel to "Add Device" (provide any unique session ID).
2. If authentication is needed, a QR code appears. Scan it with WhatsApp mobile app (“Link a device”).
3. Once session status is **Client is READY!**, you can select it and use features (Send Text/Image/etc.).

---

## 5. Building Frontend for Production

When ready to deploy:

```bash
cd path/to/your/whatsapp_business_app/vue-frontend/vue-whatsapp-frontend
npm run build
```
This builds production-ready static files in `dist/`.

**Deploy**: Serve contents of `dist/` via static hosting or a web server (Nginx, Apache, etc.).

### Vue Router History Mode

If using `createWebHistory` in `src/router/index.js` (clean URLs), your web server **must** redirect all app routes to `index.html`.  
For Nginx/Apache setup, see ["Vue Router history mode deployment"](https://router.vuejs.org/guide/essentials/history-mode.html#example-server-configurations).  
If you use `createWebHashHistory`, no server config is needed.

---

---

This README should provide a complete guide for setup, configuration, and running your multi-device WhatsApp web interface project.
