# Multi-Device WhatsApp Web UI (Dockerized)

A web application to interact with multiple WhatsApp accounts simultaneously, built with a Node.js backend (using `whatsapp-web.js`) and a Vue.js frontend. This version is configured for easy deployment using Docker, where the backend serves the frontend application.

# Depoloy to heroku
  [![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/pompomputin/wwebjs-webui-docker)
---
# Preview
<div align="left" style="display: flex; justify-content: center; gap: 20px; align-items: center; flex-wrap: wrap;">
  <img src="https://raw.githubusercontent.com/pompomputin/wwebjs-webui-docker/refs/heads/main/Login.png" alt="Login Screen" width="400" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 5px;" />
  <img src="https://raw.githubusercontent.com/pompomputin/wwebjs-webui-docker/refs/heads/main/Dashboard.png" alt="Dashboard Screen" width="400" style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 8px; margin: 5px;" />
</div>

---
## Table of Contents

- [Features Overview](#features-overview)
- [Core Technologies](#core-technologies)
- [Prerequisites](#prerequisites)
- [Quick Start with Docker (Local Deployment)](#quick-start-with-docker-local-deployment)
  - [1. Clone the Repository](#1-clone-the-repository)
  - [2. Configure Environment Variables (for Docker)](#2-configure-environment-variables-for-docker)
  - [3. Build and Run with Docker Compose](#3-build-and-run-with-docker-compose)
  - [4. Accessing the Application Locally](#4-accessing-the-application-locally)
- [Deploying to Heroku](#deploying-to-heroku)
  - [Heroku Prerequisites](#heroku-prerequisites)
  - [Required Files for Heroku Deployment](#required-files-for-heroku-deployment)
    - [1. `Dockerfile`](#1-dockerfile)
    - [2. `heroku.yml`](#2-herokyml)
    - [3. `app.json`](#3-appjson)
  - [Heroku Configuration](#heroku-configuration)
  - [Deployment Methods](#deployment-methods)
    - [Method 1: Using Heroku CLI (Recommended for Full Control)](#method-1-using-heroku-cli-recommended-for-full-control)
    - [Method 2: Using the "Deploy to Heroku" Button](#method-2-using-the-deploy-to-heroku-button)
  - [Persistent Data on Heroku (Important Limitation)](#persistent-data-on-heroku-important-limitation)
  - [Troubleshooting Heroku Deployment](#troubleshooting-heroku-deployment)
- [Managing Users](#managing-users)
- [Persistent Data (Docker Volume for Local Deployment)](#persistent-data-docker-volume-for-local-deployment)
- [Troubleshooting Docker Setup (Local)](#troubleshooting-docker-setup-local)
- [Further Enhancements (Optional)](#further-enhancements-optional)

---

## Features Overview

- **User Authentication**: Secure login with username/password, JWT-based session management.
- **Protected Routes**: Dashboard and features accessible only after login.
- **Multi-Device Session Management**: Add, List, Select, QR Auth, Remove WhatsApp sessions.
- **Real-time Updates via Socket.IO** (Authenticated connections).
- **User Actions per Session**:
    - Send Text Messages (with WhatsApp number validation).
    - Send Images/Videos (via file upload or direct URL).
    - Send Locations.
    - Get Contact Information.
    - Set User Status (About/Bio).
    - Bulk Send Messages.
    - **New:** Bulk Check WhatsApp Numbers (with real-time log updates and stop functionality).
- **Theming**: Light and Dark mode.
- **Responsive UI**: Tailwind CSS.
- **Frontend Routing**: Vue Router.
- **State Management**: Pinia.

---

## Core Technologies

- **Backend**: Node.js, Express, `whatsapp-web.js`, Socket.IO, `jsonwebtoken`, `bcryptjs`, `dotenv`
- **Frontend**: Vue 3 (Composition API), Vite, Pinia, Vue Router, Tailwind CSS
- **Containerization**: Docker, Docker Compose
- **Language**: JavaScript

---

## Prerequisites

- **Git**: For cloning the repository.
- **Docker**: Install Docker Desktop (for Windows/Mac) or Docker Engine (for Linux).
- **Docker Compose**: Usually included with Docker Desktop. For Linux, you might need to install it separately if it's not part of your Docker Engine installation.

---

## Quick Start with Docker (Local Deployment)

This setup uses Docker to run the application locally. The backend will serve the frontend, simplifying deployment.

### 1. Clone the Repository

```bash
git clone https://github.com/pompomputin/wwebjs-webui-docker.git # Or your fork
cd wwebjs-webui-dockerized
```

If you are working on a specific branch (e.g., `main`), make sure to check it out:

```bash
git checkout your-branch-name
```

### 2. Configure Environment Variables (for Docker)

The application uses an `.env` file in the project root to manage essential configurations for the local Docker container.

- Copy the example file (if you have one named `.env.example`) or create a new file named `.env` in the root of the project.

```bash
cp .env.example .env
```

(If you don't have `.env.example`, create `.env` manually with the content below).

**Edit the `.env` file with your settings for local deployment:**

```env
# .env (for local Docker deployment)

# Application Configuration
NODE_ENV=production
PORT=3000 # Port INSIDE the container. APP_HOST_PORT (below) maps to this.

# Security: REPLACE THESE WITH YOUR OWN STRONG, UNIQUE VALUES
JWT_SECRET=your_very_strong_and_unique_jwt_secret_key_here_at_least_32_characters
ADMIN_PASSWORD=a_very_secure_admin_password_for_the_admin_user
USER1_PASSWORD=a_very_secure_password_for_user1
USER2_PASSWORD=a_very_secure_password_for_user2
# Add more USERX_PASSWORD variables as needed, and update server.js user array

# CORS_ORIGIN: The URL your browser uses to access this application.
# For local Docker:
CORS_ORIGIN=http://localhost:3000 # Or http://localhost:YOUR_APP_HOST_PORT if changed below

# Host Port Mapping (Optional - if you want to change the default 3000 on your host machine)
# This is the port you will use in your browser to access the app.
APP_HOST_PORT=3000
```

> **Important (for local Docker):**
>
> - Replace placeholder values for `JWT_SECRET` and passwords.
> - Adjust `CORS_ORIGIN` and `APP_HOST_PORT` if you change the default host port.
> - Ensure this `.env` file is listed in your `.gitignore` file.

### 3. Build and Run with Docker Compose

Navigate to the root directory of the project (where `docker-compose.yml` is located) in your terminal.

**To build the images and start the application:**

```bash
docker-compose up --build
```

**To run in detached mode:**

```bash
docker-compose up --build -d
```

### 4. Accessing the Application Locally

Once the containers are running:

- Open your web browser.
- Navigate to `http://localhost:YOUR_APP_HOST_PORT` (e.g., `http://localhost:3000` if `APP_HOST_PORT` is 3000).
- Log in with the credentials you set.

---

## Deploying to Heroku

You can also deploy this application to Heroku using its Docker container runtime.

### Heroku Prerequisites

- **Heroku Account**: Sign up for a free account at [heroku.com](https://heroku.com).
- **Heroku CLI**: Install the Heroku Command Line Interface. See [Heroku CLI installation guide](https://devcenter.heroku.com/articles/heroku-cli).

### Required Files for Heroku Deployment

Ensure these files are present in the root of your repository and correctly configured:

#### 1. `Dockerfile`

A `Dockerfile` in the root of your project is essential. It should:

- Perform a multi-stage build:
  - **Stage 1 (Frontend)**: Build your Vue.js frontend (from `vue-frontend/vue-whatsapp-frontend`). This involves installing Node.js, frontend dependencies (`npm install`), and running the build script (`npm run build`).
  - **Stage 2 (Backend/Runtime)**: Set up the Node.js backend environment (from `backend`). Copy the backend code, install its dependencies (`npm install --omit=dev`), and copy the built frontend assets from Stage 1 into the backend/frontend_build directory (as `backend/server.js` serves static files from this path).
- Define the `CMD` to start your application (e.g., `CMD ["node", "server.js"]` if the `WORKDIR` in the final stage is the backend directory).

#### 2. `heroku.yml`

Create a `heroku.yml` file in the root of your repository. This file tells Heroku how to build and run your Dockerized application:

```yaml
build:
  docker:
    web: Dockerfile # Specifies the Dockerfile to use for the web dyno
run:
  web: node server.js # Command to run your web process.
                      # This assumes your Dockerfile's final WORKDIR is where server.js is located
                      # (e.g., if you copied the content of 'backend' to the WORKDIR).
                      # Adjust if your Dockerfile's CMD is different and preferred.
```

#### 3. `app.json`

Create an `app.json` file in the root of your repository. This is used by the "Deploy to Heroku" button and helps configure initial app settings:

```json
{
  "name": "Multi-Device WhatsApp Web UI",
  "description": "A web application to interact with multiple WhatsApp accounts simultaneously.",
  "repository": "https://github.com/pompomputin/wwebjs-webui-docker",
  "logo": "https://raw.githubusercontent.com/pompomputin/wwebjs-webui-docker/main/Login.png",
  "keywords": ["whatsapp", "node", "vue", "docker", "wwebjs"],
  "stack": "container",
  "env": {
    "NODE_ENV": {
      "description": "Node environment.",
      "value": "production"
    },
    "JWT_SECRET": {
      "description": "A strong, unique secret for JWT. Heroku can generate one if left blank during button setup.",
      "generator": "secret"
    },
    "ADMIN_PASSWORD": {
      "description": "Choose a secure password for the default 'admin' user.",
      "value": ""
    },
    "USER1_PASSWORD": {
      "description": "Optional: Secure password for 'User1'.",
      "value": "",
      "required": false
    },
    "USER2_PASSWORD": {
      "description": "Optional: Secure password for 'User2'.",
      "value": "",
      "required": false
    },
    "CORS_ORIGIN": {
      "description": "Your Heroku app's full URL (e.g., https://your-app-name.herokuapp.com). This is critical for the frontend to communicate with the backend. Will be pre-filled during button setup.",
      "value": ""
    }
  },
  "formation": {
    "web": {
      "quantity": 1
    }
  },
  "addons": []
}
```

> **Note:** Remember to replace `"https://github.com/pompomputin/wwebjs-webui-docker"` in `app.json` with the actual URL of your public GitHub repository if you fork this project. Users will be prompted to set passwords during the Heroku Button setup if values are empty.

---

### Heroku Configuration

Crucially, you must set Heroku Config Vars for your application to run correctly:

- Go to your Heroku Dashboard → Your App → Settings → "Reveal Config Vars".
- `CORS_ORIGIN`: This is the most important for a deployed app. Set it to your Heroku app's full URL (e.g., `https://your-app-name.herokuapp.com`). Your backend (`backend/server.js`) uses this to allow requests from your frontend. If this is not set correctly, your app will likely fail to load assets or make API calls due to CORS errors.
- `JWT_SECRET`: A strong, unique secret.
- `ADMIN_PASSWORD`, `USER1_PASSWORD`, etc.: Your chosen passwords.
- `NODE_ENV`: Should be production. Heroku automatically provides and uses a `PORT` environment variable. Your `backend/server.js` correctly uses `process.env.PORT`.

---

### Deployment Methods

#### Method 1: Using Heroku CLI (Recommended for Full Control)

Log in to Heroku CLI:

```bash
heroku login
```

Create a Heroku app (if you haven't already):

```bash
heroku create your-unique-app-name
```

Link your local repository to the Heroku app:

```bash
heroku git:remote -a your-unique-app-name
```

Commit all your files (`Dockerfile`, `heroku.yml`, `app.json`, and your application code):

```bash
git add .
git commit -m "Prepare for Heroku Docker deployment"
```

Push your desired branch to Heroku's main branch. For example, if your development branch is `main`:

```bash
git push heroku main:main
```

Or if your branch is already `main`:

```bash
git push heroku main
```

This will trigger Heroku to build your Docker image using `heroku.yml` and deploy it.

#### Method 2: Using the "Deploy to Heroku" Button

Once your `app.json`, `Dockerfile`, and `heroku.yml` are committed to your public GitHub repository and the repository URL in `app.json` is correct, you can add this button to your README:

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/pompomputin/wwebjs-webui-docker)

Replace `https://github.com/pompomputin/wwebjs-webui-docker` with the URL to your repository. Clicking this button will guide users through creating a new Heroku app based on your `app.json` configuration.

---

### Persistent Data on Heroku (Important Limitation)

WhatsApp session data (stored in `.wwebjs_auth_data` for local Docker via the volume mapping in `docker-compose.yml`) will **NOT** persist on Heroku by default.

- Heroku's filesystem is ephemeral, meaning any files written directly to the dyno's disk (including session files saved by LocalAuth if not configured for external storage) are lost whenever the dyno restarts (which happens at least once a day, on deploys, or due to errors).
- This means users will need to re-scan the QR code for each WhatsApp session frequently.
- For true persistence, you would need to modify the application to use an external storage service (like Heroku Redis or a database add-on) for session data, which requires code changes to how `whatsapp-web.js` handles authentication.

---

### Troubleshooting Heroku Deployment

- Check build and runtime logs:

```bash
heroku logs --tail -a your-app-name
```

- Ensure all necessary environment variables (Config Vars) are set correctly in the Heroku app settings, especially `CORS_ORIGIN`.

---

## Managing Users

User management is currently handled by editing the `users` array directly in `backend/server.js` and setting corresponding `USERX_PASSWORD` environment variables. For Heroku, these passwords must be set as Config Vars.

If you modify the users array in `backend/server.js`, you'll need to redeploy to Heroku.

---

## Persistent Data (Docker Volume for Local Deployment)

For local Docker deployment using `docker-compose.yml`, WhatsApp session data is stored in a Docker named volume called `.wwebjs_auth_data`. This ensures your WhatsApp sessions persist if you stop and restart the local Docker container.

- To view Docker volumes: `docker volume ls`
- To remove the volume (e.g., to start fresh locally):

```bash
docker-compose down -v
```

> **Warning:** This will delete all current WhatsApp session data stored by your local Docker setup. This does not affect Heroku.

---

## Troubleshooting Docker Setup (Local)

- **"Could not find expected browser (chrome) locally" error during runtime:**
  - Ensure your root Dockerfile is up-to-date with the version that installs chromium via apt-get and sets `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` and `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`.
  - Perform a clean build: `docker-compose up --build --no-cache`.

- **CORS Errors in Browser Console (Local):**
  - Double-check the `CORS_ORIGIN` value in your local `.env` file. It must exactly match the URL your browser uses (e.g., `http://localhost:3000`).
  - Restart the Docker container after changing `.env`.

- **Other Errors (Local):**
  - Check container logs: `docker-compose logs -f app`
  - Ensure all necessary files are being copied correctly in the Dockerfile.

---

## Further Enhancements (Optional)

- Database for User Management instead of hardcoding in `server.js`.
- More granular logging.
- Integration with a reverse proxy like Nginx or Traefik for easier SSL (HTTPS) setup and custom domain mapping if deploying publicly (though Heroku provides HTTPS).
- Implementing a persistent session storage solution for `whatsapp-web.js` compatible with Heroku (e.g., using Redis or a database).

---
