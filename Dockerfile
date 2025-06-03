# Root Dockerfile

# --- Stage 1: Build Frontend ---
FROM node:20-alpine AS frontend-builder

WORKDIR /app/vue-frontend/vue-whatsapp-frontend

# Copy frontend package files
COPY vue-frontend/vue-whatsapp-frontend/package*.json ./

# Install frontend dependencies
RUN npm install

# Copy the rest of the frontend application code
COPY vue-frontend/vue-whatsapp-frontend/ ./

# Set VITE_API_BASE_URL to an empty string for relative paths in production build.
ENV VITE_API_BASE_URL=""

# Build the frontend
RUN npm run build
# The build output will be in /app/vue-frontend/vue-whatsapp-frontend/dist


# --- Stage 2: Setup Backend and Serve Application ---
FROM node:20-slim

WORKDIR /usr/src/app

# Install system dependencies:
# - Common ones for Puppeteer
# - 'chromium' browser itself
# - 'dumb-init' for better signal handling
RUN apt-get update && apt-get install -yq --no-install-recommends \
    # --- Other essential Puppeteer dependencies ---
    ca-certificates \
    fonts-liberation \
    libatk-bridge2.0-0t64 \ # Note: -0t64 might be automatically selected if -0 is specified, confirm from your base image if needed
    libatk1.0-0t64 \
    libc6 \
    libcairo2 \
    libcups2t64 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc-s1 \ # Note: This was selected instead of libgcc1 in your log
    libglib2.0-0t64 \
    libgtk-3-0t64 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils \
    # --- Audio library fix ---
    libasound2t64 \ # Explicitly install the t64 version
    # --- Chromium browser ---
    chromium-browser \ # Note: This was selected instead of chromium in your log
    --fix-missing && \
    rm -rf /var/lib/apt/lists/*

# Create backend directory and set it as WORKDIR for subsequent backend operations
RUN mkdir -p backend
WORKDIR /usr/src/app/backend

# Copy backend package files
COPY backend/package*.json ./
COPY backend/package-lock.json ./

# Set Puppeteer environment variables BEFORE npm install
# Tell Puppeteer to SKIP its own Chromium download because we're providing it via apt-get.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
# Tell Puppeteer where to find the system-installed Chromium.
# On Debian-based systems (like node:slim), this is the standard path for the 'chromium' package.
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install backend dependencies
RUN npm install --production

# Copy the rest of the backend application code
COPY backend/ .

# Copy built frontend assets from the frontend-builder stage
# This will place them in /usr/src/app/backend/frontend_build/
COPY --from=frontend-builder /app/vue-frontend/vue-whatsapp-frontend/dist ./frontend_build/

# Expose port (default 3000, can be overridden by .env through docker-compose)
EXPOSE 3000

# Define environment variable for Node environment (can be overridden by docker-compose)
ENV NODE_ENV=production

# Use dumb-init as the entrypoint to handle signals properly with Puppeteer/Node
CMD ["dumb-init", "node", "server.js"]
