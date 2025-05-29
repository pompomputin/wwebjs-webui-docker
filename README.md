# Multi-Device WhatsApp Web Interface

A web application to interact with multiple WhatsApp accounts simultaneously, built with a Node.js backend (using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)) and a Vue.js frontend. This application now features user authentication for private access.

<div align="center" style="display: flex; justify-content: center; gap: 20px; align-items: center; flex-wrap: wrap;">
  <img src="https://raw.githubusercontent.com/azhdaha-100kg/whatsapp-multi-device-web.ui/refs/heads/main/Login.png" alt="Login Screen" width="400" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 5px;" />
  <img src="https://raw.githubusercontent.com/azhdaha-100kg/whatsapp-multi-device-web.ui/refs/heads/main/Dashboard.png" alt="Dashboard Screen" width="400" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 5px;" />
</div>

---

## Table of Contents

- [Features Overview](#features-overview)
- [Core Technologies](#core-technologies)
- [1. Prerequisites](#1-prerequisites)
  - [1.1. Git](#11-git)
  - [1.2. Node.js and npm](#12-nodejs-and-npm)
- [2. Local Development Setup](#2-local-development-setup)
  - [2.1. Clone the Repository](#21-clone-the-repository)
  - [2.2. Backend Setup (Local Development)](#22-backend-setup-local-development)
  - [2.3. Frontend Setup (Local Development)](#23-frontend-setup-local-development)
  - [2.4. Running for Local Development](#24-running-for-local-development)
- [3. Production Deployment Guide (Using Nginx)](#3-production-deployment-guide-using-nginx)
  - [Prerequisites for Your Production Server](#prerequisites-for-your-production-server)
  - [3.1. Backend Deployment on Server](#31-backend-deployment-on-server)
  - [3.2. Frontend Build & Deployment on Server](#32-frontend-build--deployment-on-server)
  - [3.3. Server Setup: Install Nginx](#33-server-setup-install-nginx)
  - [3.4. DNS Configuration](#34-dns-configuration)
  - [3.5. Nginx Configuration (Reverse Proxy)](#35-nginx-configuration-reverse-proxy)
  - [3.6. HTTPS Setup with Certbot (Let's Encrypt)](#36-https-setup-with-certbot-lets-encrypt)
  - [3.7. Final Testing](#37-final-testing)
- [4. Using the Application](#4-using-the-application)
- [5. Managing Users](#5-managing-users)
- [6. Troubleshooting Common Production Issues](#6-troubleshooting-common-production-issues)
- [7. Further Enhancements (Optional)](#7-further-enhancements-optional)

---

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
        - Client-side iteration for text/media (Message Text field used as caption for media).
- **Theming**: Light and Dark mode.
- **Responsive UI**: Tailwind CSS.
- **Frontend Routing**: Vue Router for navigation, including a login page and protected dashboard.
- **State Management**: Pinia (for session state and authentication state).

---

## Core Technologies

- **Backend**: Node.js, Express, [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js), Socket.IO, Multer, Axios, `jsonwebtoken`, `bcryptjs`, `dotenv`
- **Frontend**: Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS, Socket.IO Client, `qrcode.vue`
- **Language**: JavaScript

---

## 1. Prerequisites

### 1.1. Git

Required for version control and cloning this repository.
- **Check if installed:**
  ```bash
  git --version
  ```

- **Install on Ubuntu/Debian:**
  ```bash
  sudo apt update
  sudo apt install git -y
  ```
- **Other OS:** See [Git Downloads](https://git-scm.com/downloads)

### 1.2. Node.js and npm

Node.js is the JavaScript runtime environment, and npm is its package manager.

- **Recommended:** Node.js 18.x LTS or 20.x LTS (or higher).
- **Check if installed:**
  ```bash
  node -v
  npm -v
  ```
- **Install/Update on Ubuntu/Debian (Example for Node.js 20.x):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **Other OS:** See the [Node.js official site](https://nodejs.org/) or use a version manager like [nvm](https://github.com/nvm-sh/nvm).

---

## 2. Local Development Setup

Follow these steps to set up and run the project on your local machine for development.

### 2.1. Clone the Repository

```bash
git clone https://github.com/azhdaha-100kg/whatsapp-multi-device-app.git
cd whatsapp-multi-device-app
```

### 2.2. Backend Setup (Local Development)

This part sets up the Node.js server that handles WhatsApp interactions and authentication.

- **Navigate to the backend directory:**
  ```bash
  cd backend
  ```

- **Install dependencies:**
  ```bash
  npm install
  ```

- **Create and Configure the `.env` File:**

  In the backend directory, create a new file named `.env` and add:

  ```
  JWT_SECRET=your_strong_development_jwt_secret_key_here_at_least_32_chars
  ADMIN_PASSWORD=devpassword123
  # PORT=3000 (Optional: The backend defaults to port 3000 if not set)
  # NODE_ENV=development (Optional)
  ```

  > - **JWT_SECRET:** A long, random, and secret string used to sign JSON Web Tokens.
  > - **ADMIN_PASSWORD:** The password for the default 'admin' user (defined in `server.js`). The application will hash this password using bcryptjs.

- **Security Note:**  
  Ensure that `backend/.env` is listed in your project's root `.gitignore` file:
  ```
  # .gitignore
  # ... other ignores ...
  backend/.env
  ```

- **Puppeteer Dependencies (Required for Linux Systems):**  
  `whatsapp-web.js` relies on Puppeteer, which in turn requires several system libraries on Linux:
  ```bash
  sudo apt-get update && sudo apt-get install -y \
    ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
    libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
    libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
    --no-install-recommends
  ```

### 2.3. Frontend Setup (Local Development)

This part sets up the Vue.js user interface.

- **Navigate to the frontend directory:**  
  From the project root:
  ```bash
  cd vue-frontend/vue-whatsapp-frontend
  ```
  *(If you are currently in the backend directory, use `cd ../vue-frontend/vue-whatsapp-frontend`)*

- **Install frontend dependencies:**
  ```bash
  npm install
  ```

- **Configure Backend URL for Frontend Services:**  
  Edit the following files in `vue-frontend/vue-whatsapp-frontend/src/services/`:

  - In `api.js`:
    ```js
    const BASE_URL = 'http://localhost:3000'; // For local development
    ```
  - In `socket.js`:
    ```js
    const BASE_URL = 'http://localhost:3000'; // For local development
    ```

### 2.4. Running for Local Development

You'll need two separate terminal windows: one for the backend and one for the frontend.

- **Start the Backend Server:**
  ```bash
  cd backend
  node server.js
  ```
  You should see:  
  `Server with authentication running on http://localhost:3000`

- **Start the Frontend Development Server:**
  ```bash
  cd vue-frontend/vue-whatsapp-frontend
  npm run dev
  ```
  Vite will compile the frontend and usually start it on `http://localhost:8787/` (or another port if 8787 is busy).

- **Access the Application:**  
  Open your web browser and navigate to the frontend URL provided by Vite (e.g., http://localhost:8787/).

---

## 3. Production Deployment Guide (Using Nginx)

This section outlines deploying the application to a production server using Nginx as a reverse proxy.

### Prerequisites for Your Production Server

- A server (VPS, cloud instance, etc.) running a Linux distribution (e.g., Ubuntu).
- Root or sudo access to the server.
- Node.js and npm installed on the server.
- Git installed on the server.
- Your domain name (e.g., `mydomain.com`) purchased and ready for DNS configuration.

### 3.1. Backend Deployment on Server

- **SSH into your Production Server.**

- **Clone or Update Your Application Code:**
  ```bash
  # If cloning for the first time on the server:
  git clone https://github.com/azhdaha-100kg/whatsapp-multi-device-app.git
  cd whatsapp-multi-device-app
  # git checkout production # Switch to your production branch if you have one

  # If updating an existing deployment:
  # cd /path/to/your/whatsapp-multi-device-app
  # git checkout production
  # git pull origin production
  ```

- **Navigate to Backend and Install Dependencies:**
  ```bash
  cd backend
  npm install --production
  ```

- **Ensure Puppeteer dependencies (see section 2.2) are installed on the server.**

- **Create Production `.env` File for Backend:**
  ```bash
  nano .env
  ```
  ```
  JWT_SECRET=your_ULTRA_STRONG_random_production_jwt_secret_key
  ADMIN_PASSWORD=your_actual_STRONG_production_admin_password
  PORT=3000 
  NODE_ENV=production 
  ```

  > This file contains sensitive information; ensure its permissions are restrictive.

- **Update CORS in `server.js` for Production Domains:**
  Edit `backend/server.js`:
  ```js
  const frontendURL = 'https://mydomain.com'; 
  app.use(cors({
      origin: frontendURL 
  }));
  const io = new Server(server, {
      cors: {
          origin: frontendURL, 
          methods: ["GET", "POST"]
      }
  });
  ```
  Save the file.

- **Run Backend with PM2:**
  ```bash
  sudo npm install pm2 -g
  pm2 start server.js --name "whatsapp-backend"
  pm2 startup
  # (Run the command that pm2 outputs after pm2 startup)
  pm2 save
  ```
  - Check status: `pm2 list`
  - View logs: `pm2 logs whatsapp-backend`

### 3.2. Frontend Build & Deployment on Server

- **Update Frontend API/Socket URLs (CRITICAL):**
  - In `src/services/api.js`:
    ```js
    const BASE_URL = 'https://backend.mydomain.com';
    ```
  - In `src/services/socket.js`:
    ```js
    const BASE_URL = 'https://backend.mydomain.com';
    ```
  Commit these changes and ensure they are present on the server before building.

- **Build the Frontend:**
  ```bash
  npm install 
  npm run build
  ```
  This creates a `dist/` folder containing optimized static assets.

- **Upload Frontend `dist` Folder to Server:**
  ```bash
  sudo mkdir -p /var/www/mydomain.com/html
  scp -r dist/* your_username@YOUR_SERVER_PUBLIC_IP:/var/www/mydomain.com/html/
  sudo chown -R www-data:www-data /var/www/mydomain.com/html
  sudo chmod -R 755 /var/www/mydomain.com/html
  ```

### 3.3. Server Setup: Install Nginx

- **Install Nginx:**
  ```bash
  sudo apt update
  sudo apt install nginx -y
  ```
- **Allow HTTP and HTTPS traffic:**
  ```bash
  sudo ufw allow 'Nginx Full'
  # sudo ufw enable
  # sudo ufw status
  ```

### 3.4. DNS Configuration

- **Frontend A record:**  
  - **Type:** A  
  - **Host/Name:** @ (or mydomain.com)  
  - **Points to:** YOUR_SERVER_PUBLIC_IP

- **Backend A record:**  
  - **Type:** A  
  - **Host/Name:** backend  
  - **Points to:** YOUR_SERVER_PUBLIC_IP

> DNS changes may take some time to propagate.

### 3.5. Nginx Configuration (Reverse Proxy)

#### Backend: `backend.mydomain.com`

Create `/etc/nginx/sites-available/backend.mydomain.com` with:

```
server {
    listen 80;
    listen [::]:80;
    server_name backend.mydomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Frontend: `mydomain.com`

Create `/etc/nginx/sites-available/mydomain.com` with:

```
server {
    listen 80;
    listen [::]:80;
    server_name mydomain.com www.mydomain.com;

    root /var/www/mydomain.com/html;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- **Enable sites and restart Nginx:**
  ```bash
  sudo ln -s /etc/nginx/sites-available/mydomain.com /etc/nginx/sites-enabled/
  sudo ln -s /etc/nginx/sites-available/backend.mydomain.com /etc/nginx/sites-enabled/
  sudo rm /etc/nginx/sites-enabled/default # if it exists
  sudo nginx -t
  sudo systemctl restart nginx
  ```

### 3.6. HTTPS Setup with Certbot (Let's Encrypt)

- **Install Certbot:**
  ```bash
  sudo apt install certbot python3-certbot-nginx -y
  ```

- **Obtain and Install SSL Certificates:**
  ```bash
  sudo certbot --nginx -d mydomain.com -d www.mydomain.com -d backend.mydomain.com
  ```
  - Choose option 2 (Redirect) when prompted for HTTP to HTTPS redirection.

- **Verify HTTPS:**
  - Visit: `https://mydomain.com` and `https://backend.mydomain.com`
  - Check for padlock icon and HTTP->HTTPS redirection.

- **Verify Automatic Renewal:**
  ```bash
  sudo systemctl status certbot.timer
  sudo certbot renew --dry-run
  ```

### 3.7. Final Testing and Checks

- Access `https://mydomain.com`
- Test login, session management, sending messages, real-time updates, etc.
- Check browser console for CORS, mixed content, or JS errors.
- Review Nginx and PM2 logs for issues.

---

## 4. Using the Application

- Navigate to `https://mydomain.com`
- Login (username: `admin`, password from your `.env`)
- Manage WhatsApp Sessions
- Use features like sending text/media, bulk messaging, etc.

---

## 5. Managing Users

Currently, user management is manual:

- **Generate Password Hash:**  
  Use `bcryptjs.hashSync('yourNewPassword', 10)`
- **Edit `backend/server.js`:**  
  Add the new user object to the `users` array.
- **Restart Backend:**  
  ```bash
  pm2 restart whatsapp-backend
  ```

---

## 6. Troubleshooting Common Production Issues

- **502 Bad Gateway (Nginx):**
  - Check PM2 status: `pm2 list`
  - View logs: `pm2 logs whatsapp-backend`
  - Ensure `proxy_pass` is correct in Nginx config

- **403 Forbidden (Frontend):**
  - Check permissions: `/var/www/mydomain.com/html`
  - Nginx `root` directive

- **404 Not Found (Vue Router):**
  - Ensure `try_files $uri $uri/ /index.html;` in Nginx config

- **CORS Errors:**
  - Check `origin` in backend CORS settings
  - Restart backend after changes

- **Socket.IO Connection Problems:**
  - Nginx `proxy_set_header` for `Upgrade` and `Connection`
  - Check Socket.IO CORS

- **Authentication/Token Issues:**
  - JWT secret consistency
  - Nginx passes `Authorization` header

- **SSL Certificate Issues:**
  - Check Certbot output and certificate expiration
  - Nginx loads correct certificate paths

---

## 7. Further Enhancements (Optional)

- Database for User Management
- Advanced Nginx Configuration (caching, security headers, rate limiting)
- CI/CD Pipeline
- More Granular Logging and Monitoring

---

> This README should now be significantly more detailed and beginner-friendly for the entire deployment process.  
> **Remember to replace all placeholders with your specific information.**
