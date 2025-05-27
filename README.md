# Multi-Device WhatsApp Web Interface

A web application to interact with multiple WhatsApp accounts simultaneously, built with a Node.js backend (using `whatsapp-web.js`) and a Vue.js frontend.

## Features Overview

* Multi-Device Session Management (Add, List, Select, QR Auth, Remove)
* Real-time Updates via Socket.IO
* Implemented User Actions (for each active session):
    * Send Text Messages
    * Send Images/Videos (via file upload or direct URL)
    * Send Locations
    * Get Contact Information
    * Set User Status (About/Bio)
    * Bulk Send Messages (Client-side iteration sending text and/or media)
* Theming: Light and Dark mode support.
* Responsive UI with Tailwind CSS.
* Frontend routing with Vue Router.
* State management with Pinia.

## Core Technologies Used

* **Backend:** Node.js, Express.js, `whatsapp-web.js`, Socket.IO, Multer (for uploads), Axios (for URL fetching)
* **Frontend:** Vue.js 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS, Socket.IO Client, `qrcode.vue`
* **Language:** JavaScript

## 1. Prerequisites

Before you begin, ensure your system has the following installed:

### 1.1. Git
Git is required for version control and to clone the repository if you are setting it up from GitHub.
* **Check if installed:** `git --version`
* **To install on Ubuntu/Debian:**
    ```bash
    sudo apt update
    sudo apt install git
    ```
* **For other OS:** Visit the [official Git website](https://git-scm.com/downloads).

### 1.2. Node.js and npm
Node.js is the JavaScript runtime environment, and npm is its package manager. `whatsapp-web.js` and Vite require a recent version of Node.js.
* **Recommended Node.js Version:** 18.x LTS or 20.x LTS (or higher).
* **Check if installed:**
    ```bash
    node -v
    npm -v
    ```
* **To install/update on Ubuntu/Debian (using NodeSource repository for up-to-date versions):**
    For Node.js 20.x (Recommended):
    ```bash
    curl -fsSL [https://deb.nodesource.com/setup_20.x](https://deb.nodesource.com/setup_20.x) | sudo -E bash -
    sudo apt-get install -y nodejs
    ```
    This will also install a compatible version of npm.
* **For other OS or versions:** Visit the [official Node.js website](https://nodejs.org/) or use a version manager like [nvm](https://github.com/nvm-sh/nvm).

## 2. Project Setup

### 2.1. Clone the Repository (If Applicable)
If you have this project on GitHub, clone it to your local machine/VM:
```bash
git clone [https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git)
cd YOUR_REPOSITORY_NAME 
# This directory should be your 'whatsapp_business_app' root
Replace YOUR_USERNAME and YOUR_REPOSITORY_NAME accordingly. If you already have the files, skip this step.

2.2. Backend Setup
The backend handles WhatsApp communication.

Navigate to the backend directory:

Bash

cd path/to/your/whatsapp_business_app/backend
Install backend dependencies:
The package.json in this directory lists all necessary Node.js modules.
Key dependencies include:

axios: For making HTTP requests (e.g., fetching media from URLs).
cors: For enabling Cross-Origin Resource Sharing.
express: Web application framework for Node.js.
multer: Middleware for handling multipart/form-data (file uploads).
socket.io: For real-time, bidirectional communication.
whatsapp-web.js: The core library for WhatsApp Web automation.
Run the following command to install them:

Bash

npm install
Puppeteer Dependencies (Linux Only):
whatsapp-web.js uses Puppeteer, which runs a headless Chrome instance. On Linux, you might need to install additional system libraries if not already present:

Bash

sudo apt-get update && sudo apt-get install -y \
    ca-certificates fonts-liberation libappindicator3-1 libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libglib2.0-0 \
    libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 \
    libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 \
    libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
    --no-install-recommends 
(The --no-install-recommends flag can help minimize the installation size).

2.3. Frontend Setup (Vue.js with Vite)
The frontend is a Vue.js single-page application.

Navigate to your Vue frontend project directory:

Bash

cd path/to/your/whatsapp_business_app/vue-frontend/vue-whatsapp-frontend
# Adjust 'vue-whatsapp-frontend' if your Vue project folder has a different name
Install frontend dependencies:
The package.json here lists all JavaScript libraries for the Vue app.
Key dependencies include:

vue: The progressive JavaScript framework.
vue-router: Official router for Vue.js.
pinia: Intuitive, type-safe, and flexible state management for Vue.
socket.io-client: Client-side library for Socket.IO.
qrcode.vue: Vue component for generating QR codes. Development dependencies (devDependencies) include:
vite: Next-generation frontend tooling.
@vitejs/plugin-vue: Vite plugin for Vue.
tailwindcss: A utility-first CSS framework.
postcss, autoprefixer, @tailwindcss/postcss: For processing Tailwind CSS.
eslint, prettier: For code linting and formatting.
Run the following command to install them:

Bash

npm install
CRITICAL Frontend Configuration:
You must set the backend URL in two frontend service files. Open them and replace the placeholder URL with your backend server's actual IP address and port:

vue-frontend/vue-whatsapp-frontend/src/services/api.js:
JavaScript

const BASE_URL = 'http://YOUR_VM_PUBLIC_IP:3000'; // <--- SET THIS
vue-frontend/vue-whatsapp-frontend/src/services/socket.js:
JavaScript

const BASE_URL = 'http://YOUR_VM_PUBLIC_IP:3000'; // <--- SET THIS
For example, if your backend is running on the same VM and accessible via 43.134.142.240 on port 3000, it would be http://43.134.142.240:3000.
3. Running the Application
You need to run both the backend and frontend servers simultaneously, typically in separate terminal windows.

3.1. Start the Backend Server
Open a terminal.
Navigate to the backend directory:
Bash

cd path/to/your/whatsapp_business_app/backend
Start the server:
Bash

node server.js
The backend should start, usually on port 3000. Look for a log like: Multi-session backend on http://localhost:3000.
3.2. Start the Frontend Development Server
Open a new terminal window or tab.
Navigate to your Vue project directory:
Bash

cd path/to/your/whatsapp_business_app/vue-frontend/vue-whatsapp-frontend
Start the Vite development server:
Bash

npm run dev -- --host
The -- --host flag makes the Vite server accessible on your local network (and via your VM's public IP if firewall rules are set).
Vite will typically start on a port like 5173 or 8787. The terminal will show you the URLs, e.g.:
  ➜  Local:   http://localhost:5173/
  ➜  Network: http://YOUR_VM_LOCAL_IP:5173/ 
3.3. Firewall Configuration
Ensure the ports for both the backend (e.g., 3000) and the frontend Vite dev server (e.g., 5173 or 8787) are open in your VM's firewall. This includes:

Your cloud provider's firewall/security group rules.
The local firewall on your VM (e.g., ufw on Ubuntu - sudo ufw allow <port_number>/tcp).
3.4. Accessing the Application
Open your web browser and navigate to your VM's public IP address followed by the port the Vite development server is running on (e.g., http://YOUR_VM_PUBLIC_IP:5173).

Initial Steps in the App:

Use the "Session Management" panel to "Add Device" by providing a unique session ID.
If the session requires authentication, a QR code will appear. Scan it with your WhatsApp mobile app (Link a device).
Once the session status shows "Client is READY!", you can select it and use the feature panels on the right (Send Text, Send Image, etc.).
4. Building Frontend for Production
When you are ready to deploy your frontend application:

Navigate to your Vue project directory:

Bash

cd path/to/your/whatsapp_business_app/vue-frontend/vue-whatsapp-frontend
Run the build command:

Bash

npm run build
This will create an optimized static build of your frontend in a dist folder (e.g., vue-frontend/vue-whatsapp-frontend/dist/).

Deploy the contents of this dist folder to any static web hosting service or configure a web server like Nginx or Apache to serve these files.

Important for Vue Router History Mode:
If you are using createWebHistory in src/router/index.js (which gives clean URLs like /feature instead of /#/feature), your production web server must be configured to redirect all traffic for your app's paths to your index.html file. This allows Vue Router to handle the routing on the client-side. Search for "Vue Router history mode deployment [your server type]" for specific instructions (e.g., "Vue Router history mode Nginx"). If you switch to createWebHashHistory in your router, this server configuration is not needed.

This README should provide a good guide for setting up and running your project.
