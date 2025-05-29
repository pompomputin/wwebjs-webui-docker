// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');
const path = require('path');
const multer = require('multer');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // For JWT
const bcrypt = require('bcryptjs'); // For password hashing

const app = express();
app.use(cors());
app.use(express.json());

// --- Authentication Setup ---
const JWT_SECRET = process.env.JWT_SECRET || '06363e3c7e6b757fad65655bc3ec2ac0ea7a15e7eee8abfa0233512d5f2ae8537234625566c086c97f599df8b2bb1944deff53c98752441c46968a54bac79a3d'; // Store this securely, e.g., in .env file

// Sample user store (replace with a database in production)
const users = [
    {
        id: 1,
        username: 'admin',
        passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || '', 10)
    },
    {
        id: 2, // Make sure ID is unique
        username: 'User1', // Your new username
        passwordHash: bcrypt.hashSync(process.env.USER1_PASSWORD || '', 10)
    },
	{
        id: 3,
        username: 'User2',
        passwordHash: bcrypt.hashSync(process.env.USER2_PASSWORD || '', 10)
    }
    // You can add more users following this pattern
];

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // If no token, unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.sendStatus(403); // If token is not valid, forbidden
        }
        req.user = user; // Add user payload to request object
        next(); // Proceed to the protected route
    });
}
// --- End Authentication Setup ---


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const server = http.createServer(app);
const frontendURL = 'https://zonagacor.xyz'; // YOUR FRONTEND DOMAIN
const backendURL = 'https://backend.zonagacor.xyz'; // YOUR BACKEND DOMAIN

app.use(cors({
    origin: [frontendURL, backendURL] // Allow both for flexibility, or just frontendURL if backend API is not directly accessed
}));
// ...
const io = new Server(server, {
    cors: {
        origin: frontendURL, // Socket connections will originate from your frontend domain
        methods: ["GET", "POST"]
    }
});

// --- Socket.IO Authentication Middleware ---
io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error('Socket Auth Error: Invalid token');
                return next(new Error('Authentication error: Invalid token'));
            }
            socket.user = decoded; // Attach user info to the socket
            console.log(`Socket ${socket.id} authenticated for user: ${socket.user.username}`);
            next();
        });
    } else {
        console.error('Socket Auth Error: No token provided');
        next(new Error('Authentication error: No token provided'));
    }
});
// --- End Socket.IO Authentication Middleware ---

const PORT = process.env.PORT || 3000;

const sessions = {};
const qrCodes = {};
const clientReadyStatus = {};

function createWhatsappSession(sessionId) {
    console.log(`[${sessionId}] Initializing WhatsApp client...`);
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId, dataPath: path.join(__dirname, '.wwebjs_auth') }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        },
    });

    client.on('qr', (qr) => {
        console.log(`[${sessionId}] QR RECEIVED`);
        qrCodes[sessionId] = qr;
        clientReadyStatus[sessionId] = false;
        io.to(sessionId).emit('qr_code', { sessionId, qr });
        io.emit('status_update', { sessionId, message: 'QR code received. Scan.', qr });
    });

    client.on('authenticated', () => {
        console.log(`[${sessionId}] AUTHENTICATED`);
        qrCodes[sessionId] = null;
        io.to(sessionId).emit('authenticated', { sessionId });
        io.emit('status_update', { sessionId, message: 'Authenticated!' });
    });

    client.on('auth_failure', msg => {
        console.error(`[${sessionId}] AUTHENTICATION FAILURE:`, msg);
        qrCodes[sessionId] = null;
        clientReadyStatus[sessionId] = false;
        io.to(sessionId).emit('auth_failure', { sessionId, message: msg });
        io.emit('status_update', { sessionId, message: `Authentication failure: ${msg}` });
    });

    client.on('ready', () => {
        console.log(`[${sessionId}] WhatsApp client READY!`);
        clientReadyStatus[sessionId] = true;
        qrCodes[sessionId] = null;
        io.to(sessionId).emit('ready', { sessionId });
        io.emit('status_update', { sessionId, message: 'Client is READY!' });
    });

    client.on('message', async msg => {
        console.log(`[${sessionId}] RX MSG From:${msg.from} Body:${msg.body}`);
        // Only emit to sockets in the room that belong to the authenticated user
        // This check might be more complex depending on how you map socket users to WhatsApp sessions
        io.to(sessionId).emit('new_message', {
            sessionId,
            message: {
                from: msg.from, to: msg.to, body: msg.body, timestamp: msg.timestamp,
                id: msg.id.id, author: msg.author, isStatus: msg.isStatus,
                isGroupMsg: msg.isGroupMsg, hasMedia: msg.hasMedia, type: msg.type
            }
        });
    });

    client.on('disconnected', (reason) => {
        console.log(`[${sessionId}] Client logged out. Reason:`, reason);
        clientReadyStatus[sessionId] = false;
        qrCodes[sessionId] = null;
        io.to(sessionId).emit('disconnected', { sessionId, reason });
        io.emit('status_update', { sessionId, message: `Client disconnected: ${reason}.` });
    });

    client.initialize().catch(err => {
        console.error(`[${sessionId}] Initialization ERROR:`, err.message);
        io.to(sessionId).emit('init_error', { sessionId, error: err.message });
        io.emit('status_update', { sessionId, message: `Initialization Error: ${err.message}` });
        delete sessions[sessionId];
        delete qrCodes[sessionId];
        delete clientReadyStatus[sessionId];
    });

    sessions[sessionId] = client;
    clientReadyStatus[sessionId] = false;
    qrCodes[sessionId] = null;
    return client;
}

// --- Authentication Route ---
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required.' });
    }

    const user = users.find(u => u.username === username);
    if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials.' });
    }

    // User authenticated, generate JWT
    const userPayload = { id: user.id, username: user.username }; // Don't include sensitive info
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' }); // Token expires in 24 hours

    res.json({ success: true, message: 'Login successful', token: token, user: userPayload });
});

// --- Protected API Endpoints ---
// Apply authenticateToken middleware to all /session routes

app.post('/session/init/:sessionId', authenticateToken, (req, res) => { // Added authenticateToken
    const { sessionId } = req.params;
    // Access req.user here if needed, e.g., to associate session with a user
    console.log(`User ${req.user.username} trying to init session ${sessionId}`);
    if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID required.' });
    if (sessions[sessionId]) {
        sessions[sessionId].getState().then(state =>
            res.json({ success: true, message: `Session '${sessionId}' exists/processing.`, status: state || 'INITIALIZING', qr: qrCodes[sessionId] })
        ).catch(() => {
            console.warn(`[${sessionId}] getState failed for existing session. Attempting re-initialization.`);
            createWhatsappSession(sessionId);
            res.json({ success: true, message: `Session '${sessionId}' re-initializing due to previous error.`, status: 'RE_INITIALIZING' });
        });
    } else {
        createWhatsappSession(sessionId);
        res.json({ success: true, message: `Session '${sessionId}' initialization started.`, status: 'INITIALIZING' });
    }
});

app.get('/sessions', authenticateToken, (req, res) => { // Added authenticateToken
    res.json({ success: true, sessions: Object.keys(sessions).map(id => ({
        sessionId: id,
        isReady: clientReadyStatus[id] || false,
        hasQr: !!qrCodes[id]
    }))
  });
});

app.post('/session/remove/:sessionId', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId } = req.params;
    const client = sessions[sessionId];
    if (client) {
        try {
            await client.destroy();
            console.log(`[${sessionId}] Client destroyed via API by user ${req.user.username}.`);
        } catch (e) {
            console.error(`[${sessionId}] Error destroying client via API:`, e.message);
        }
    } else {
        console.log(`[${sessionId}] No active client found to remove via API.`);
    }
    delete sessions[sessionId];
    delete qrCodes[sessionId];
    delete clientReadyStatus[sessionId];
    io.emit('session_removed', { sessionId }); // Consider targeting this emit too
    io.emit('status_update', { sessionId, message: 'Session has been removed.' });
    res.json({ success: true, message: `Session '${sessionId}' removed/state cleared.` });
});

app.get('/session/is-registered/:sessionId/:number', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId, number } = req.params;
    const client = sessions[sessionId];

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.`, isRegistered: false });
    }
    if (!number) {
        return res.status(400).json({ success: false, error: 'Number to check is required.', isRegistered: false });
    }

    try {
        let numberIdToCheck = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
        const isRegistered = await client.isRegisteredUser(numberIdToCheck);
        if (isRegistered) {
            res.json({ success: true, isRegistered: true, numberId: numberIdToCheck, message: 'Number is registered on WhatsApp.' });
        } else {
            const contactIdObj = await client.getNumberId(number.replace(/\D/g, ''));
            if (contactIdObj) {
                 res.json({ success: true, isRegistered: false, numberId: contactIdObj._serialized, message: 'Number format appears valid but not actively on WhatsApp or privacy settings may hide status.' });
            } else {
                 res.json({ success: true, isRegistered: false, numberId: numberIdToCheck, message: 'Number is not registered on WhatsApp or format is invalid for lookup.' });
            }
        }
    } catch (e) {
        console.error(`[${sessionId}] API: Error checking number ${number} by user ${req.user.username}:`, e.message);
        res.status(500).json({ success: false, error: `Failed to check number: ${e.message}`, isRegistered: false });
    }
});

app.post('/session/send-message/:sessionId', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId } = req.params;
    const { number, message } = req.body;
    const client = sessions[sessionId];
    console.log(`[${sessionId}] API: User ${req.user.username} received send message request to ${number}`);
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!number || !message) return res.status(400).json({ success: false, error: 'Recipient & message required.' });
    try {
        if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
        console.log(`[${sessionId}] API: Sending message to ${chatId}: "${message}" by user ${req.user.username}`);
        const msgSent = await client.sendMessage(chatId, message);
        io.to(sessionId).emit('message_sent', { sessionId, to: chatId, body: message, id: msgSent.id.id, timestamp: msgSent.timestamp });
        res.json({ success: true, message: 'Message sent!', msgData: {id: msgSent.id.id, timestamp: msgSent.timestamp} });
    } catch (e) {
        console.error(`[${sessionId}] API: Send message error to ${number} by user ${req.user.username}:`, e.message);
        res.status(500).json({ success: false, error: `Send fail: ${e.message}` });
    }
});

app.get('/session/chats/:sessionId', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try {
        if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        const chats = await client.getChats();
        res.json({ success: true, chats: chats.map(c => ({ id:c.id._serialized, name:c.name, isGroup:c.isGroup, unreadCount:c.unreadCount, timestamp:c.timestamp, lastMessage: c.lastMessage ? { body:c.lastMessage.body, from:c.lastMessage.from, to:c.lastMessage.to, fromMe:c.lastMessage.fromMe, timestamp:c.lastMessage.timestamp, hasMedia:c.lastMessage.hasMedia, type:c.lastMessage.type } : null })) });
    } catch (e) {
        console.error(`[${sessionId}] API: Chat fetch error by user ${req.user.username}:`, e.message);
        res.status(500).json({ success: false, error: `Chat fetch fail: ${e.message}` });
    }
});

app.get('/session/contact-info/:sessionId/:contactId', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId, contactId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!contactId) return res.status(400).json({ success: false, error: 'Contact ID required.' });
    try {
        const formattedId = contactId.includes('@') ? contactId : `${contactId.replace(/\D/g, '')}@c.us`;
        const contact = await client.getContactById(formattedId);
        const pic = await contact.getProfilePicUrl();
        res.json({ success: true, contactInfo: { id:contact.id._serialized, name:contact.name, number:contact.number, pushname:contact.pushname, isMe:contact.isMe, isUser:contact.isUser, isGroup:contact.isGroup, isWAUser:contact.isWAUser, isBlocked:contact.isBlocked, profilePicUrl:pic||null } });
    } catch (e) {
        console.error(`[${sessionId}] API: Contact info error for ${contactId} by user ${req.user.username}:`, e.message);
        res.status(500).json({ success: false, error: `Contact info fail: ${e.message}` });
    }
});

app.post('/session/send-image/:sessionId', authenticateToken, upload.single('imageFile'), async (req, res) => { // Added authenticateToken
    const { sessionId } = req.params;
    const { number, caption, imageUrl } = req.body;
    const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!number) return res.status(400).json({ success: false, error: 'Recipient required.' });
    if (!req.file && !imageUrl) return res.status(400).json({ success: false, error: 'Image file or URL required.' });
    try {
        if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        let media, filename = 'image.png';
        if (req.file) {
            media = new MessageMedia(req.file.mimetype, req.file.buffer.toString('base64'), req.file.originalname);
            filename = req.file.originalname;
        } else if (imageUrl) {
            const r = await axios.get(imageUrl, {responseType:'arraybuffer'});
            const mt = r.headers['content-type']||'image/jpeg';
            const buf = Buffer.from(r.data,'binary');
            try {filename=path.basename(new URL(imageUrl).pathname)||filename;} catch(e){ /* ignore */ }
            media = new MessageMedia(mt,buf.toString('base64'),filename);
        }
        let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
        await client.sendMessage(chatId, media, { caption: caption || '' });
        io.to(sessionId).emit('media_sent', { sessionId, to: chatId, type: 'image', filename, caption: caption || '' });
        res.json({ success: true, message: 'Image sent!' });
    } catch (e) {
        console.error(`[${sessionId}] API: Image send error to ${number} by user ${req.user.username}:`, e.message);
        res.status(500).json({ success: false, error: `Image send fail: ${e.message}` });
    }
});

app.post('/session/send-location/:sessionId', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId } = req.params; const { number, latitude, longitude, description } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!number || latitude === undefined || longitude === undefined ) return res.status(400).json({ success: false, error: 'Recipient, latitude, longitude required.' });
    try {
        if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        const loc = new Location(parseFloat(latitude), parseFloat(longitude), description || undefined);
        let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
        await client.sendMessage(chatId, loc);
        io.to(sessionId).emit('location_sent', { sessionId, to: chatId, latitude, longitude, description });
        res.json({ success: true, message: 'Location sent!' });
    } catch (e) {
        console.error(`[${sessionId}] API: Location send error to ${number} by user ${req.user.username}:`, e.message);
        res.status(500).json({ success: false, error: `Location send fail: ${e.message}` });
    }
});

app.post('/session/set-status/:sessionId', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId } = req.params; const { statusMessage } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (typeof statusMessage !== 'string') return res.status(400).json({ success: false, error: 'statusMessage (string) required.' });
    try {
        await client.setStatus(statusMessage);
        io.to(sessionId).emit('status_message_set', { sessionId, status: statusMessage });
        res.json({ success: true, message: 'Status updated!' });
    } catch (e) {
        console.error(`[${sessionId}] API: Set status error by user ${req.user.username}:`, e.message);
        res.status(500).json({ success: false, error: `Set status fail: ${e.message}` });
    }
});

app.post('/session/:sessionId/chat/:chatId/send-typing', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId, chatId } = req.params;
    const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!chatId) return res.status(400).json({ success: false, error: 'Chat ID required.' });
    try {
        const chat = await client.getChatById(chatId);
        if (!chat) return res.status(404).json({ success: false, error: `Chat ${chatId} not found in session ${sessionId}.` });
        await chat.sendStateTyping();
        console.log(`[${sessionId}] API: Sent typing state to chat ${chatId} by user ${req.user.username}`);
        res.json({ success: true, message: `Typing state sent to ${chatId}` });
    } catch (error) { console.error(`[${sessionId}] API: Error sending typing state to ${chatId} by user ${req.user.username}:`, error.message); res.status(500).json({ success: false, error: `Typing state fail: ${error.message}` });}
});

app.post('/session/:sessionId/chat/:chatId/send-seen', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId, chatId } = req.params;
    const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!chatId) return res.status(400).json({ success: false, error: 'Chat ID required.' });
    try {
        const chat = await client.getChatById(chatId);
        if (!chat) return res.status(404).json({ success: false, error: `Chat ${chatId} not found in session ${sessionId}.` });
        const success = await chat.sendSeen();
        console.log(`[${sessionId}] API: Sent seen receipt to chat ${chatId}. Success: ${success} by user ${req.user.username}`);
        res.json({ success: success, message: success ? `Seen receipt sent` : `Failed to send seen` });
    } catch (error) { console.error(`[${sessionId}] API: Error sending seen receipt to ${chatId} by user ${req.user.username}:`, error.message); res.status(500).json({ success: false, error: `Send seen fail: ${error.message}` });}
});

app.post('/session/:sessionId/set-presence-online', authenticateToken, async (req, res) => { // Added authenticateToken
    const { sessionId } = req.params;
    const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try {
        await client.sendPresenceAvailable();
        console.log(`[${sessionId}] API: Presence set to available (online) by user ${req.user.username}.`);
        res.json({ success: true, message: 'Presence set online.' });
    } catch (error) { console.error(`[${sessionId}] API: Error setting presence online by user ${req.user.username}:`, error.message); res.status(500).json({ success: false, error: `Set presence fail: ${error.message}` });}
});


// --- Socket.IO Connection Handling ---
io.on('connection', (socket) => {
    // Authentication is now handled by io.use() middleware
    console.log('Socket.IO user connected:', socket.id, socket.user ? `(User: ${socket.user.username})` : '(Unauthenticated)');

    // Only allow joining rooms if authenticated
    if (!socket.user) {
        console.log(`Socket ${socket.id} tried to join room without authentication. Disconnecting.`);
        socket.disconnect(true);
        return;
    }

    socket.on('join_session_room', (sessionId) => {
        if (sessionId) {
            // Future enhancement: check if socket.user has permission for this sessionId
            socket.join(sessionId);
            console.log(`Socket ${socket.id} (User: ${socket.user.username}) joined room ${sessionId}`);
            if (qrCodes[sessionId]) socket.emit('qr_code', { sessionId, qr: qrCodes[sessionId] });
            else if (clientReadyStatus[sessionId]) socket.emit('ready', { sessionId });
            else if (sessions[sessionId]) socket.emit('status_update', { sessionId, message: 'Session initializing...'});
            else socket.emit('status_update', { sessionId, message: 'Session not active. Initialize it first.' });
        }
    });
    socket.on('request_init_session', (sessionId) => {
        if (sessionId) {
            // Future enhancement: check if socket.user has permission for this sessionId
            if (sessions[sessionId]) {
                 sessions[sessionId].getState().then(st => {
                     io.to(sessionId).emit('status_update', { sessionId, message: `Session '${sessionId}' exists. State: ${st}`, status: st, qr: qrCodes[sessionId] });
                     if (qrCodes[sessionId]) io.to(sessionId).emit('qr_code', { sessionId, qr: qrCodes[sessionId] });
                 }).catch(() => {
                     createWhatsappSession(sessionId);
                     io.to(sessionId).emit('status_update', { sessionId, message: `Session '${sessionId}' re-initializing.`});
                 });
            } else {
                createWhatsappSession(sessionId);
                io.to(sessionId).emit('status_update', { sessionId, message: `Session '${sessionId}' initialization started.`});
            }
        }
    });
    socket.on('disconnect', () => console.log('Socket.IO user disconnected:', socket.id, socket.user ? `(User: ${socket.user.username})` : ''));
});

server.listen(PORT, () => {
    console.log(`Server with authentication running on http://localhost:${PORT}`);
});
