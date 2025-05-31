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
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// CORS Configuration
const corsOriginEnv = process.env.CORS_ORIGIN || 'http://localhost:3000';
const allowedOrigins = corsOriginEnv.split(',').map(origin => origin.trim());
console.log(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            var msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
            console.error(msg);
            return callback(new Error(msg), false);
        }
    },
    credentials: true
}));

app.use(express.json());

// --- Serve Frontend ---
const frontendDistPath = path.join(__dirname, 'frontend_build');
app.use(express.static(frontendDistPath));
console.log(`Serving static files from: ${frontendDistPath}`);

// --- Authentication & User Setup ---
const JWT_SECRET = process.env.JWT_SECRET || 'defaultjwtsecretfordev';
const users = [
    { id: 1, username: 'admin', passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'adminpassword', 10) },
    { id: 2, username: 'User1', passwordHash: bcrypt.hashSync(process.env.USER1_PASSWORD || 'user1password', 10) },
    { id: 3, username: 'User2', passwordHash: bcrypt.hashSync(process.env.USER2_PASSWORD || 'user2password', 10) }
];

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Token verification failed:', err.message);
            return res.sendStatus(403);
        }
        req.user = user;
        next();
    });
}

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true }
});

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) return next(new Error('Authentication error: Invalid token'));
            socket.user = decoded;
            next();
        });
    } else {
        next(new Error('Authentication error: No token provided'));
    }
});

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
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
        },
    });

    client.on('qr', (qr) => {
        console.log(`[${sessionId}] QR RECEIVED`);
        qrCodes[sessionId] = qr; clientReadyStatus[sessionId] = false;
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
        qrCodes[sessionId] = null; clientReadyStatus[sessionId] = false;
        io.to(sessionId).emit('auth_failure', { sessionId, message: msg });
        io.emit('status_update', { sessionId, message: `Authentication failure: ${msg}` });
        if (sessions[sessionId]) { sessions[sessionId].destroy().catch(e => console.error(`Error destroying client after auth_failure: ${e.message}`)); delete sessions[sessionId]; delete clientReadyStatus[sessionId];}
    });
    client.on('ready', () => {
        console.log(`[${sessionId}] WhatsApp client READY!`);
        clientReadyStatus[sessionId] = true; qrCodes[sessionId] = null;
        io.to(sessionId).emit('ready', { sessionId });
        io.emit('status_update', { sessionId, message: 'Client is READY!' });
    });
    client.on('message', async msg => {
        io.to(sessionId).emit('new_message', { sessionId, message: { from: msg.from, to: msg.to, body: msg.body, timestamp: msg.timestamp, id: msg.id.id, author: msg.author, isStatus: msg.isStatus, isGroupMsg: msg.isGroupMsg, hasMedia: msg.hasMedia, type: msg.type }});
    });
    client.on('disconnected', (reason) => {
        console.log(`[${sessionId}] Client logged out. Reason:`, reason);
        clientReadyStatus[sessionId] = false; qrCodes[sessionId] = null;
        io.to(sessionId).emit('disconnected', { sessionId, reason });
        io.emit('status_update', { sessionId, message: `Client disconnected: ${reason}.` });
        if (sessions[sessionId]) { delete sessions[sessionId]; delete clientReadyStatus[sessionId]; }
    });
    client.initialize().catch(err => {
        console.error(`[${sessionId}] Initialization ERROR:`, err.message);
        io.to(sessionId).emit('init_error', { sessionId, error: err.message });
        io.emit('status_update', { sessionId, message: `Initialization Error: ${err.message}` });
        delete sessions[sessionId]; delete qrCodes[sessionId]; delete clientReadyStatus[sessionId];
    });
    sessions[sessionId] = client; clientReadyStatus[sessionId] = false; qrCodes[sessionId] = null;
    return client;
}

// --- API Routes ---
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password are required.' });
    const user = users.find(u => u.username === username);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials (user not found).' });
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) return res.status(401).json({ success: false, error: 'Invalid credentials (password mismatch).' });
    const userPayload = { id: user.id, username: user.username };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, message: 'Login successful', token: token, user: userPayload });
});

app.post('/session/init/:sessionId', authenticateToken, (req, res) => {
    const { sessionId } = req.params;
    if (sessions[sessionId]) {
        sessions[sessionId].getState().then(state => res.json({ success: true, message: `Session '${sessionId}' exists.`, status: state || 'INITIALIZING', qr: qrCodes[sessionId] })).catch(() => { createWhatsappSession(sessionId); res.json({ success: true, message: `Session '${sessionId}' re-initializing.`, status: 'RE_INITIALIZING' }); });
    } else { createWhatsappSession(sessionId); res.json({ success: true, message: `Session '${sessionId}' initialization started.`, status: 'INITIALIZING' }); }
});
app.get('/sessions', authenticateToken, (req, res) => res.json({ success: true, sessions: Object.keys(sessions).map(id => ({ sessionId: id, isReady: clientReadyStatus[id] || false, hasQr: !!qrCodes[id] })) }));
app.post('/session/remove/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params; const client = sessions[sessionId];
    if (client) { try { await client.logout(); setTimeout(async () => { await client.destroy(); }, 1000); } catch (e) { console.error(`[${sessionId}] Error removing:`, e.message); if (client) await client.destroy().catch(err => {}); }}
    delete sessions[sessionId]; delete qrCodes[sessionId]; delete clientReadyStatus[sessionId];
    io.emit('session_removed', { sessionId }); io.emit('status_update', { sessionId, message: 'Session removed.' });
    res.json({ success: true, message: `Session '${sessionId}' removed.` });
});
app.get('/session/is-registered/:sessionId/:number', authenticateToken, async (req, res) => {
    const { sessionId, number } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { let numId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`; const isRegistered = await client.isRegisteredUser(numId); res.json({ success: true, isRegistered, numId }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/session/send-message/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params; const { number, message } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`; const msgSent = await client.sendMessage(chatId, message); io.to(sessionId).emit('message_sent', { sessionId, to: chatId, body: message, id: msgSent.id.id, timestamp: msgSent.timestamp }); res.json({ success: true, message: 'Message sent!'}); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/session/chats/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { const chats = await client.getChats(); res.json({ success: true, chats: chats.map(c => ({ id:c.id._serialized, name:c.name, isGroup:c.isGroup, unreadCount:c.unreadCount, timestamp:c.timestamp, lastMessage: c.lastMessage ? { body:c.lastMessage.body, from:c.lastMessage.from, to:c.lastMessage.to, fromMe:c.lastMessage.fromMe, timestamp:c.lastMessage.timestamp, hasMedia:c.lastMessage.hasMedia, type:c.lastMessage.type, id: c.lastMessage.id } : null })) }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/session/contact-info/:sessionId/:contactId', authenticateToken, async (req, res) => {
    const { sessionId, contactId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { const contact = await client.getContactById(contactId.includes('@') ? contactId : `${contactId.replace(/\D/g, '')}@c.us`); const pic = await contact.getProfilePicUrl(); res.json({ success: true, contactInfo: { id:contact.id._serialized, name:contact.name, number:contact.number, pushname:contact.pushname, isMe:contact.isMe, profilePicUrl:pic||null } }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/session/send-image/:sessionId', authenticateToken, upload.single('imageFile'), async (req, res) => {
    const { sessionId } = req.params; const { number, caption, imageUrl } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.`});
    if (!number || (!req.file && !imageUrl)) return res.status(400).json({ success: false, error: 'Recipient and image source required.' });
    try { let media; if (req.file) media = new MessageMedia(req.file.mimetype, req.file.buffer.toString('base64'), req.file.originalname); else { const r = await axios.get(imageUrl, {responseType:'arraybuffer'}); media = new MessageMedia(r.headers['content-type']||'image/jpeg', Buffer.from(r.data,'binary').toString('base64'), path.basename(new URL(imageUrl).pathname)||'image.png');}
          let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`; await client.sendMessage(chatId, media, { caption: caption || '' }); io.to(sessionId).emit('media_sent', { sessionId, to: chatId, type: 'image', filename: media.filename, caption }); res.json({ success: true, message: 'Image sent!' });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/session/send-location/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params; const { number, latitude, longitude, description } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { const loc = new Location(parseFloat(latitude), parseFloat(longitude), description || undefined); let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`; await client.sendMessage(chatId, loc); io.to(sessionId).emit('location_sent', { sessionId, to: chatId, latitude, longitude, description }); res.json({ success: true, message: 'Location sent!' }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/session/set-status/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params; const { statusMessage } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { await client.setStatus(statusMessage); io.to(sessionId).emit('status_message_set', { sessionId, status: statusMessage }); res.json({ success: true, message: 'Status updated!' }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/session/:sessionId/chat/:chatId/send-typing', authenticateToken, async (req, res) => {
    const { sessionId, chatId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { const chat = await client.getChatById(chatId); await chat.sendStateTyping(); res.json({ success: true, message: `Typing state sent.` }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/session/:sessionId/chat/:chatId/send-seen', authenticateToken, async (req, res) => {
    const { sessionId, chatId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { const chat = await client.getChatById(chatId); await chat.sendSeen(); res.json({ success: true, message: `Seen receipt sent.` }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.post('/session/:sessionId/set-presence-online', authenticateToken, async (req, res) => {
    const { sessionId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { await client.sendPresenceAvailable(); res.json({ success: true, message: 'Presence set online.' }); } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// --- Socket.IO Listeners ---
io.on('connection', (socket) => {
    if (!socket.user) { socket.disconnect(true); return; } // Should be handled by io.use middleware already
    console.log('Socket.IO user connected:', socket.id, `(User: ${socket.user.username})`);
    socket.on('join_session_room', (sessionId) => { if (sessionId) { socket.join(sessionId); if (qrCodes[sessionId]) socket.emit('qr_code', { sessionId, qr: qrCodes[sessionId] }); else if (clientReadyStatus[sessionId]) socket.emit('ready', { sessionId }); else if (sessions[sessionId]) socket.emit('status_update', { sessionId, message: 'Session initializing...'}); else socket.emit('status_update', { sessionId, message: 'Session not active.' });}});
    socket.on('request_init_session', (sessionId) => { if (sessionId) { if (sessions[sessionId]) { sessions[sessionId].getState().then(st => { io.to(sessionId).emit('status_update', { sessionId, message: `Session exists. State: ${st}`, status: st, qr: qrCodes[sessionId] }); if (qrCodes[sessionId]) io.to(sessionId).emit('qr_code', { sessionId, qr: qrCodes[sessionId] }); }).catch(() => { createWhatsappSession(sessionId); io.to(sessionId).emit('status_update', { sessionId, message: `Session re-initializing.`}); }); } else { createWhatsappSession(sessionId); io.to(sessionId).emit('status_update', { sessionId, message: `Session initialization started.`}); } } });
    socket.on('disconnect', () => console.log('Socket.IO user disconnected:', socket.id));
});

// --- SPA Fallback Route ---
// This MUST be the VERY LAST route handler for GET requests
/* COMMENT OUT THIS ENTIRE BLOCK
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) {
      if (err.status === 404) { // Common case if index.html itself is missing
        console.error(`SPA Fallback: frontend_build/index.html not found at ${frontendDistPath}`);
        res.status(404).send('Application entry point not found. Build the frontend.');
      } else {
        console.error('SPA Fallback Error sending index.html:', err);
        res.status(500).send('Error serving application.');
      }
    }
  });
});
*/
server.listen(PORT, () => {
    console.log(`Server with authentication running on http://localhost:${PORT}`);
});
