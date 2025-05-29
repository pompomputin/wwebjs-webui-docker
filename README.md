# Multi-Device WhatsApp Web Interface

A web application to interact with multiple WhatsApp accounts simultaneously, built with a Node.js backend (using [`whatsapp-web.js`](https://github.com/pedroslopez/whatsapp-web.js)) and a Vue.js frontend.  
**Now features user authentication for private access.**

<div align="center" style="display: flex; gap: 20px; align-items: center;">
  <img src="https://raw.githubusercontent.com/azhdaha-100kg/whatsapp-multi-device-web.ui/refs/heads/main/Login.png" alt="Login Screen" width="400" />
  <img src="https://raw.githubusercontent.com/azhdaha-100kg/whatsapp-multi-device-web.ui/refs/heads/main/Dashboard.png" alt="Dashboard Screen" width="400" />
</div>

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
- **Install/Update on Ubuntu/Debian (Example for Node.js 20.x):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **Other OS:** See [Node.js official site](https://nodejs.org/) or use nvm for version management.

---

## 2. Local Development Setup

### 2.1. Clone the Repository

```bash
git clone https://github.com/azhdaha-100kg/whatsapp-multi-device-app.git
cd whatsapp-multi-device-app
```

---

### 2.2. Backend Setup (Local Development)

Navigate to backend directory:

```bash
cd backend
```

Install backend dependencies:

```bash
npm install
```

Create `.env` File for Backend:  
In the backend directory, create a file named `.env`. Add the following, replacing placeholders with your secure values:

```
JWT_SECRET=your_development_jwt_secret_key_here
ADMIN_PASSWORD=your_development_admin_password
# PORT=3000 (Optional, defaults to 3000 if not set)
# NODE_ENV=development
```

- The `ADMIN_PASSWORD` is for the default 'admin' user (hashed on startup).
- **Important:** Ensure `backend/.env` is listed in your main `.gitignore` file.

**Puppeteer Dependencies (Linux Only):**  
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

### 2.3. Frontend Setup (Local Development)

Navigate to frontend directory:

```bash
cd vue-frontend/vue-whatsapp-frontend 
```
(If you're in the backend directory, use `cd ../vue-frontend/vue-whatsapp-frontend`)

Install frontend dependencies:

```bash
npm install
```

Set Backend URL in Frontend Services: Edit these files in `vue-frontend/vue-whatsapp-frontend/src/services/`:

- `api.js`:
  ```js
  const BASE_URL = 'http://localhost:3000'; // For local development
  ```
- `socket.js`:
  ```js
  const BASE_URL = 'http://localhost:3000'; // For local development
  ```

---

### 2.4. Running for Local Development

**Start the Backend Server:**

Open a terminal, navigate to the backend directory, and run:

```bash
node server.js
```
Look for: `Server with authentication running on http://localhost:3000`

**Start the Frontend Development Server:**

Open a new terminal, navigate to the `vue-frontend/vue-whatsapp-frontend` directory, and run:

```bash
npm run dev
```
This will typically start the frontend on [http://localhost:8787/](http://localhost:8787/).

**Access the App:**

Open your browser and go to [http://localhost:8787/](http://localhost:8787/).

---

## 3. Production Deployment Guide (Using Nginx)

This section guides you through deploying the application to a server using Nginx as a reverse proxy, with the frontend on `https://mydomain.com` and the backend on `https://backend.mydomain.com`.

### Prerequisites for Your Production Server

- A server (VPS, cloud instance) running a Linux distribution (e.g., Ubuntu).
- Root or sudo access to the server.
- Node.js and npm installed on the server.
- Git installed on the server.
- Your domain name (`mydomain.com`) ready, with access to its DNS settings.

---

### 3.1. Backend Deployment on Server

**Clone/Update Code:**

SSH into your server. Clone your repository or pull the latest changes from your production branch:

```bash
# First-time clone
git clone https://github.com/azhdaha-100kg/whatsapp-multi-device-app.git
cd whatsapp-multi-device-app
git checkout production # If you have a 'production' branch

# Updating existing clone:
# cd path/to/your/whatsapp-multi-device-app
# git checkout production
# git pull origin production
```

**Navigate to Backend & Install Dependencies:**

```bash
cd backend
npm install --production # Install only production dependencies
```

**Create Production .env File:**

In the backend directory on your server, create a `.env` file:

```bash
nano .env
```

Add your production-specific configurations:

```
JWT_SECRET=your_ULTRA_STRONG_production_jwt_secret_key_please_change_this
ADMIN_PASSWORD=your_actual_production_admin_password_for_the_default_admin_user
PORT=3000 
NODE_ENV=production
```

- **Important:** Ensure this `.env` file is secured and not publicly accessible.

**Update CORS in `server.js` for Production Domains:**

Edit `backend/server.js` on the server. Change the CORS settings to your production domains:

```js
const frontendURL = 'https://mydomain.com'; // Replace with your frontend domain
const backendURL = 'https://backend.mydomain.com'; // Replace with your backend domain

app.use(cors({
    origin: frontendURL // Allow requests from your frontend domain
}));

const io = new Server(server, {
    cors: {
        origin: frontendURL, // Socket connections will originate from your frontend domain
        methods: ["GET", "POST"]
    }
});
```

Save the file.

**Run Backend with a Process Manager (PM2):**

Install PM2 globally if not already present:

```bash
sudo npm install pm2 -g
```

From the backend directory, start your application:

```bash
pm2 start server.js --name "whatsapp-backend"
```

Ensure PM2 restarts your app on server boot:

```bash
pm2 startup 
# Follow the command it outputs
pm2 save
```

Check status: `pm2 list` or `pm2 logs whatsapp-backend`. Your backend should be running and listening internally on port 3000.

---

### 3.2. Frontend Build & Deployment on Server

**Update Frontend API/Socket URLs (Important!):**

Before building, ensure your local frontend code (in the branch you are about to build from, e.g., production) has the correct backend URLs:  
In `vue-frontend/vue-whatsapp-frontend/src/services/api.js`:

```js
const BASE_URL = 'https://backend.mydomain.com'; // Your production backend domain
```

In `vue-frontend/vue-whatsapp-frontend/src/services/socket.js`:

```js
const BASE_URL = 'https://backend.mydomain.com'; // Your production backend domain
```

**Build the Frontend:**

On your local machine (or a build server if you have one):

```bash
npm install # If not already done or if dependencies changed
npm run build
```

This creates the `dist/` folder containing your optimized static frontend assets.

**Upload Frontend Build to Server:**

Create a directory on your server to host the frontend files:

```bash
sudo mkdir -p /var/www/mydomain.com/html
```

Copy the contents of your local `vue-frontend/vue-whatsapp-frontend/dist/` folder to `/var/www/mydomain.com/html/` on your server. You can use `scp`, `rsync`, or an FTP client. Example using `scp`:

```bash
scp -r dist/* your_username@YOUR_SERVER_PUBLIC_IP:/var/www/mydomain.com/html/
```

---

### 3.3. Server Setup: Install Nginx

If Nginx is not already installed on your server:

```bash
sudo apt update
sudo apt install nginx -y
```

Adjust firewall (e.g., UFW) to allow Nginx traffic:

```bash
sudo ufw allow 'Nginx Full' # Allows HTTP (80) and HTTPS (443)
# sudo ufw enable # If UFW is not active
# sudo ufw status
```

---

### 3.4. DNS Configuration

At your domain registrar:

- **A record for mydomain.com**:  
  Host/Name: `@` (or `mydomain.com`)  
  Value/Points to: `YOUR_SERVER_PUBLIC_IP`

- **A record for backend.mydomain.com**:  
  Host/Name: `backend`  
  Value/Points to: `YOUR_SERVER_PUBLIC_IP`

DNS changes may take some time to propagate.

---

### 3.5. Nginx Configuration (Reverse Proxy)

**Backend Nginx Configuration (backend.mydomain.com):**

Create the file:  
`sudo nano /etc/nginx/sites-available/backend.mydomain.com`

Paste the following, replacing domains and ensuring `proxy_pass` points to your Node.js backend (usually http://localhost:3000):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name backend.mydomain.com;

    location / {
        proxy_pass http://localhost:3000; # Points to your Node.js backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade'; # Crucial for WebSockets (Socket.IO)
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and close.

**Frontend Nginx Configuration (mydomain.com):**

Create the file:  
`sudo nano /etc/nginx/sites-available/mydomain.com`

Paste the following, replacing `mydomain.com` and ensuring `root` points to where you uploaded your frontend's `dist` files:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name mydomain.com www.mydomain.com;

    root /var/www/mydomain.com/html; # Path to your Vue app's dist folder
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html; # Handles Vue Router history mode
    }
}
```

Save and close.

**Enable Nginx Sites:**

```bash
sudo ln -s /etc/nginx/sites-available/mydomain.com /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/backend.mydomain.com /etc/nginx/sites-enabled/
# (Optional: Remove default Nginx site: sudo rm /etc/nginx/sites-enabled/default)
```

**Test Nginx Configuration & Restart:**

```bash
sudo nginx -t
sudo systemctl restart nginx
```

---

### 3.6. HTTPS Setup with Certbot (Let's Encrypt)

Install Certbot:

```bash
sudo apt install certbot python3-certbot-nginx -y
```

Obtain SSL Certificates (Certbot will modify your Nginx configs):

```bash
sudo certbot --nginx -d mydomain.com -d www.mydomain.com -d backend.mydomain.com
```

Follow the prompts for email, terms, and choose to redirect HTTP to HTTPS (recommended).

**Verify Auto-Renewal:**

```bash
sudo certbot renew --dry-run
```

---

### 3.7. Final Testing

- Access `https://mydomain.com` — you should see your Vue.js frontend.
- Test login. API calls should go to `https://backend.mydomain.com`.
- Test all features: session management, sending messages, bulk sending, Socket.IO real-time updates.
- Check browser console for errors (CORS, mixed content, 404s).
- Check Nginx logs (`/var/log/nginx/access.log` and `error.log`) and your PM2 backend logs (`pm2 logs whatsapp-backend`) if you encounter issues.

---

This README provides a detailed guide for both local development and production deployment.  
**Remember to replace placeholders like `mydomain.com`, `YOUR_SERVER_PUBLIC_IP`, and secret keys with your actual values.** Good luck!
