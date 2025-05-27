// backend/server.js
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');
const path = require('path');
const multer = require('multer');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*", methods: ["GET", "POST"] }});

const PORT = process.env.PORT || 3000;

const sessions = {};
const qrCodes = {};
const clientReadyStatus = {};

function createWhatsappSession(sessionId) {
    console.log(`[${sessionId}] Initializing WhatsApp client...`);
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId, dataPath: path.join(__dirname, '.wwebjs_auth') }),
        puppeteer: { headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--disable-gpu'] },
    });

    client.on('qr', (qr) => { console.log(`[${sessionId}] QR RECEIVED`); qrCodes[sessionId] = qr; clientReadyStatus[sessionId] = false; io.to(sessionId).emit('qr_code', { sessionId, qr }); io.emit('status_update', { sessionId, message: 'QR code received. Scan.', qr }); });
    client.on('authenticated', () => { console.log(`[${sessionId}] AUTHENTICATED`); qrCodes[sessionId] = null; io.to(sessionId).emit('authenticated', { sessionId }); io.emit('status_update', { sessionId, message: 'Authenticated!' }); });
    client.on('auth_failure', msg => { console.error(`[${sessionId}] AUTH FAILURE:`, msg); qrCodes[sessionId] = null; clientReadyStatus[sessionId] = false; io.to(sessionId).emit('auth_failure', { sessionId, message: msg }); io.emit('status_update', { sessionId, message: `Auth failure: ${msg}` }); });
    client.on('ready', () => { console.log(`[${sessionId}] WhatsApp client READY!`); clientReadyStatus[sessionId] = true; qrCodes[sessionId] = null; io.to(sessionId).emit('ready', { sessionId }); io.emit('status_update', { sessionId, message: 'Client is READY!' }); });
    client.on('message', async msg => { console.log(`[${sessionId}] RX MSG From:${msg.from} Body:${msg.body}`); io.to(sessionId).emit('new_message', { sessionId, message: { from: msg.from, to: msg.to, body: msg.body, timestamp: msg.timestamp, id: msg.id.id, author: msg.author, isStatus: msg.isStatus, isGroupMsg: msg.isGroupMsg, hasMedia: msg.hasMedia, type: msg.type }}); });
    client.on('disconnected', (reason) => { console.log(`[${sessionId}] Client logged out. Reason:`, reason); clientReadyStatus[sessionId] = false; qrCodes[sessionId] = null; io.to(sessionId).emit('disconnected', { sessionId, reason }); io.emit('status_update', { sessionId, message: `Client disconnected: ${reason}.` }); });
    client.initialize().catch(err => { console.error(`[${sessionId}] Init ERROR:`, err.message); io.to(sessionId).emit('init_error', { sessionId, error: err.message }); io.emit('status_update', { sessionId, message: `Init Error: ${err.message}` }); delete sessions[sessionId]; delete qrCodes[sessionId]; delete clientReadyStatus[sessionId]; });
    sessions[sessionId] = client; clientReadyStatus[sessionId] = false; qrCodes[sessionId] = null; return client;
}

app.post('/session/init/:sessionId', (req, res) => {
    const { sessionId } = req.params; if (!sessionId) return res.status(400).json({ success: false, error: 'Session ID required.' });
    if (sessions[sessionId]) { sessions[sessionId].getState().then(state => res.json({ success: true, message: `Session '${sessionId}' exists/processing.`, status: state || 'INITIALIZING', qr: qrCodes[sessionId] })).catch(() => { createWhatsappSession(sessionId); res.json({ success: true, message: `Session '${sessionId}' re-initializing.`, status: 'RE_INITIALIZING' });});
    } else { createWhatsappSession(sessionId); res.json({ success: true, message: `Session '${sessionId}' init started.`, status: 'INITIALIZING' }); }
});
app.get('/sessions', (req, res) => res.json({ success: true, sessions: Object.keys(sessions).map(id => ({ sessionId: id, isReady: clientReadyStatus[id] || false, hasQr: !!qrCodes[id] })) }));
app.post('/session/remove/:sessionId', async (req, res) => {
    const { sessionId } = req.params; const client = sessions[sessionId];
    if (client) { try { await client.destroy(); console.log(`[${sessionId}] Client destroyed.`); } catch (e) { console.error(`[${sessionId}] Err destroying:`, e);}} else { console.log(`[${sessionId}] No client to remove.`);}
    delete sessions[sessionId]; delete qrCodes[sessionId]; delete clientReadyStatus[sessionId];
    io.emit('session_removed', { sessionId }); io.emit('status_update', { sessionId, message: 'Session removed.' });
    res.json({ success: true, message: `Session '${sessionId}' removed.` });
});
app.post('/session/send-message/:sessionId', async (req, res) => {
    const { sessionId } = req.params; const { number, message } = req.body; const client = sessions[sessionId];
    console.log(`[${sessionId}] Received API call to send message to ${number}`);
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!number || !message) return res.status(400).json({ success: false, error: 'Recipient & message required.' });
    try { if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
        console.log(`[${sessionId}] Sending message to ${chatId}: "${message}"`);
        const msgSent = await client.sendMessage(chatId, message);
        io.to(sessionId).emit('message_sent', { sessionId, to: chatId, body: message, id: msgSent.id.id, timestamp: msgSent.timestamp });
        res.json({ success: true, message: 'Message sent!', msgData: {id: msgSent.id.id, timestamp: msgSent.timestamp} });
    } catch (e) { console.error(`[${sessionId}] Send message error to ${number}:`, e.message); res.status(500).json({ success: false, error: `Send fail: ${e.message}` }); }
});
app.get('/session/chats/:sessionId', async (req, res) => { /* ... (same as last full code) ... */ 
    const { sessionId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    try { if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        const chats = await client.getChats();
        res.json({ success: true, chats: chats.map(c => ({ id:c.id._serialized, name:c.name, isGroup:c.isGroup, unreadCount:c.unreadCount, timestamp:c.timestamp, lastMessage: c.lastMessage ? { body:c.lastMessage.body, from:c.lastMessage.from, to:c.lastMessage.to, fromMe:c.lastMessage.fromMe, timestamp:c.lastMessage.timestamp, hasMedia:c.lastMessage.hasMedia, type:c.lastMessage.type } : null })) });
    } catch (e) { console.error(`[${sessionId}] Chat fetch error:`, e.message); res.status(500).json({ success: false, error: `Chat fetch fail: ${e.message}` }); }
});
app.get('/session/contact-info/:sessionId/:contactId', async (req, res) => { /* ... (same as last full code) ... */ 
    const { sessionId, contactId } = req.params; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!contactId) return res.status(400).json({ success: false, error: 'Contact ID required.' });
    try { const formattedId = contactId.includes('@') ? contactId : `${contactId.replace(/\D/g, '')}@c.us`;
        const contact = await client.getContactById(formattedId); const pic = await contact.getProfilePicUrl();
        res.json({ success: true, contactInfo: { id:contact.id._serialized, name:contact.name, number:contact.number, pushname:contact.pushname, isMe:contact.isMe, isUser:contact.isUser, isGroup:contact.isGroup, isWAUser:contact.isWAUser, isBlocked:contact.isBlocked, profilePicUrl:pic||null } });
    } catch (e) { console.error(`[${sessionId}] Contact info error for ${contactId}:`, e.message); res.status(500).json({ success: false, error: `Contact info fail: ${e.message}` }); }
});
app.post('/session/send-image/:sessionId', upload.single('imageFile'), async (req, res) => { /* ... (same as last full code, handles imageUrl from req.body) ... */ 
    const { sessionId } = req.params; const { number, caption, imageUrl } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!number) return res.status(400).json({ success: false, error: 'Recipient required.' });
    if (!req.file && !imageUrl) return res.status(400).json({ success: false, error: 'Image file or URL required.' });
    try { if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        let media, filename = 'image.png';
        if (req.file) { media = new MessageMedia(req.file.mimetype, req.file.buffer.toString('base64'), req.file.originalname); filename = req.file.originalname; }
        else if (imageUrl) { const r = await axios.get(imageUrl, {responseType:'arraybuffer'}); const mt = r.headers['content-type']||'image/jpeg'; const buf = Buffer.from(r.data,'binary'); try {filename=path.basename(new URL(imageUrl).pathname)||filename;}catch(e){} media = new MessageMedia(mt,buf.toString('base64'),filename); }
        let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
        await client.sendMessage(chatId, media, { caption: caption || '' });
        io.to(sessionId).emit('media_sent', { sessionId, to: chatId, type: 'image', filename, caption: caption || '' });
        res.json({ success: true, message: 'Image sent!' });
    } catch (e) { console.error(`[${sessionId}] Image send error to ${number}:`, e.message); res.status(500).json({ success: false, error: `Image send fail: ${e.message}` }); }
});
app.post('/session/send-location/:sessionId', async (req, res) => { /* ... (same as last full code) ... */ 
    const { sessionId } = req.params; const { number, latitude, longitude, description } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (!number || !latitude || !longitude) return res.status(400).json({ success: false, error: 'Recipient, lat, lon required.' });
    try { if (await client.getState() !== 'CONNECTED') return res.status(400).json({ success: false, error: `Client ${sessionId} not connected.` });
        const loc = new Location(parseFloat(latitude), parseFloat(longitude), description || undefined);
        let chatId = number.includes('@') ? number : `${number.replace(/\D/g, '')}@c.us`;
        await client.sendMessage(chatId, loc);
        io.to(sessionId).emit('location_sent', { sessionId, to: chatId, latitude, longitude, description });
        res.json({ success: true, message: 'Location sent!' });
    } catch (e) { console.error(`[${sessionId}] Location send error to ${number}:`, e.message); res.status(500).json({ success: false, error: `Location send fail: ${e.message}` }); }
});
app.post('/session/set-status/:sessionId', async (req, res) => { /* ... (same as last full code) ... */ 
    const { sessionId } = req.params; const { statusMessage } = req.body; const client = sessions[sessionId];
    if (!client || !clientReadyStatus[sessionId]) return res.status(400).json({ success: false, error: `Session ${sessionId} not ready.` });
    if (typeof statusMessage !== 'string') return res.status(400).json({ success: false, error: 'statusMessage (string) required.' });
    try { await client.setStatus(statusMessage); io.to(sessionId).emit('status_message_set', { sessionId, status: statusMessage });
        res.json({ success: true, message: 'Status updated!' });
    } catch (e) { console.error(`[${sessionId}] Set status error:`, e.message); res.status(500).json({ success: false, error: `Set status fail: ${e.message}` }); }
});

io.on('connection', (socket) => { /* ... (same as last full code) ... */ 
    console.log('Socket.IO user connected:', socket.id);
    socket.on('join_session_room', (sessionId) => { if (sessionId) { socket.join(sessionId); console.log(`Socket ${socket.id} joined ${sessionId}`); if (qrCodes[sessionId]) socket.emit('qr_code', { sessionId, qr: qrCodes[sessionId] }); else if (clientReadyStatus[sessionId]) socket.emit('ready', { sessionId }); else if (sessions[sessionId]) socket.emit('status_update', { sessionId, message: 'Session initializing...'}); else socket.emit('status_update', { sessionId, message: 'Session not active.' });}});
    socket.on('request_init_session', (sessionId) => { if (sessionId) { if (sessions[sessionId]) { sessions[sessionId].getState().then(st => { io.to(sessionId).emit('status_update', { sessionId, message: `Session '${sessionId}' exists. State: ${st}`, status: st, qr: qrCodes[sessionId] }); if (qrCodes[sessionId]) io.to(sessionId).emit('qr_code', { sessionId, qr: qrCodes[sessionId] }); }).catch(() => { createWhatsappSession(sessionId); io.to(sessionId).emit('status_update', { sessionId, message: `Session '${sessionId}' re-initializing.`}); }); } else { createWhatsappSession(sessionId); io.to(sessionId).emit('status_update', { sessionId, message: `Session '${sessionId}' init started.`});}}});
    socket.on('disconnect', () => console.log('Socket.IO user disconnected:', socket.id));
});
server.listen(PORT, () => console.log(`Multi-session backend on http://localhost:${PORT}`));
