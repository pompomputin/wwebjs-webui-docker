// backend/server.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Confirmed path for .env

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const { Client, LocalAuth, MessageMedia, Location } = require('whatsapp-web.js');
const multer = require('multer');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); // Mongoose for MongoDB interaction

const app = express();

// --- CORS Configuration (Allow all for testing - production should be specific) ---
app.use(cors({
    origin: '*', // Allow all origins for testing. In production, use process.env.CORS_ORIGIN.split(',')
    methods: ["GET", "POST", "PUT", "DELETE"], // Ensure all necessary methods are allowed
    credentials: true
}));

app.use(express.json());

// --- MongoDB Connection ---
const MONGODB_URI = process.env.MONGODB_URI; // Get URI from .env
if (!MONGODB_URI) {
    console.error("MONGODB_URI is not defined in the .env file! Exiting process.");
    process.exit(1); // Exit if no URI to prevent further errors
}

mongoose.connect(MONGODB_URI, { dbName: 'whatsapp_autoresponders' }) // Specify database name here
    .then(() => {
        console.log('MongoDB connected successfully!');
        seedUsers(); // Seed default users after successful connection
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
        // Log the URI that was attempted to connect to
        console.error(`Attempted MONGODB_URI: ${MONGODB_URI.split('@')[0]}@... (password hidden)`);
        process.exit(1); // Exit if connection fails
    });


// --- Mongoose Schema and Model for AutoResponder ---
const autoResponderSchema = new mongoose.Schema({
    sessionId: { type: String, required: true }, // Associate with a WhatsApp session
    keyword: { type: String, required: true },
    messageType: { type: String, required: true, enum: ['text', 'image', 'video', 'document'] },
    keywordType: { type: String, required: true, enum: ['equal', 'contains', 'startsWith', 'endsWith', 'regex'] },
    quoted: { type: Boolean, default: false },
    replyOnlyWhen: { type: String, required: true, enum: ['all', 'group', 'private'] },
    status: { type: String, required: true, enum: ['active', 'inactive'], default: 'active' },
    messageContent: { type: String, required: true }, // The actual reply message or media URL
    createdAt: { type: Date, default: Date.now }
});

const AutoResponder = mongoose.model('AutoResponder', autoResponderSchema, 'autoresponders'); // 'autoresponders' is the collection name

// --- Mongoose Schema and Model for User ---
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema, 'users'); // 'users' is the collection name for users

// --- User Seeding ---
async function seedUsers() {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const adminPassword = process.env.ADMIN_PASSWORD || 'adminpassword';
            if (adminPassword === 'adminpassword') {
                console.warn('WARNING: Using default admin password. Please set ADMIN_PASSWORD in your .env file for security.');
            }
            const adminPasswordHash = bcrypt.hashSync(adminPassword, 10);
            await User.create({ username: 'admin', passwordHash: adminPasswordHash, isAdmin: true });
            console.log('Default admin user created.');
        }

        const user1Exists = await User.findOne({ username: 'User1' });
        if (!user1Exists && process.env.USER1_PASSWORD) {
            const user1PasswordHash = bcrypt.hashSync(process.env.USER1_PASSWORD, 10);
            await User.create({ username: 'User1', passwordHash: user1PasswordHash });
            console.log('Default User1 created.');
        }

        const user2Exists = await User.findOne({ username: 'User2' });
        if (!user2Exists && process.env.USER2_PASSWORD) {
            const user2PasswordHash = bcrypt.hashSync(process.env.USER2_PASSWORD, 10);
            await User.create({ username: 'User2', passwordHash: user2PasswordHash });
            console.log('Default User2 created.');
        }
    } catch (error) {
        console.error('Error seeding users:', error);
    }
}

// --- Authentication & User Setup ---
const JWT_SECRET = process.env.JWT_SECRET || 'defaultjwtsecretfordev';

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
    cors: { origin: '*', methods: ["GET", "POST", "PUT", "DELETE"], credentials: true } // Allow all for socket.io as well
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
const initializing = {};

function cleanupSession(sessionId) {
    delete sessions[sessionId];
    delete qrCodes[sessionId]; 
    delete clientReadyStatus[sessionId];
    delete initializing[sessionId];
    
    io.emit('session_removed', { sessionId });
    io.emit('status_update', { 
        sessionId, 
        message: 'Session removed.',
        qrCleared: true
    });
}

function createWhatsappSession(sessionId) {
    if (initializing[sessionId]) {
        console.log(`[${sessionId}] Session initialization already in progress, skipping duplicate request`);
        return null;
    }
    
    if (sessions[sessionId]) {
        console.log(`[${sessionId}] Session already exists, not initializing again`);
        return sessions[sessionId];
    }
    
    console.log(`[${sessionId}] Initializing WhatsApp client...`);
    initializing[sessionId] = true;
    
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: sessionId, dataPath: path.join(__dirname, '.wwebjs_auth') }),
        puppeteer: {
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote', '--single-process', '--disable-gpu']
        },
    });

    sessions[sessionId] = { 
        client,
        settings: { 
            isTypingIndicatorEnabled: false,
            autoSendSeenEnabled: false,
            maintainOnlinePresenceEnabled: false,
        }
    };

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
        
        if (sessions[sessionId]) {
            sessions[sessionId].client.destroy().catch(e => console.error(`Error destroying client after auth_failure: ${e.message}`));
            cleanupSession(sessionId);
        }
    });
    
    client.on('ready', () => {
        console.log(`[${sessionId}] WhatsApp client READY!`);
        clientReadyStatus[sessionId] = true; 
        qrCodes[sessionId] = null;
        io.to(sessionId).emit('ready', { sessionId });
        io.emit('status_update', { sessionId, message: 'Client is READY!' });
        delete initializing[sessionId];
    });
    
    client.on('message', async msg => {
        io.to(sessionId).emit('new_message', { sessionId, message: { from: msg.from, to: msg.to, body: msg.body, timestamp: msg.timestamp, id: msg.id.id, author: msg.author, isStatus: msg.isStatus, isGroupMsg: msg.isGroupMsg, hasMedia: msg.hasMedia, type: msg.type }});
    });
    
    client.on('disconnected', (reason) => {
        console.log(`[${sessionId}] Client logged out. Reason:`, reason);
        cleanupSession(sessionId);
        io.to(sessionId).emit('disconnected', { sessionId, reason });
    });
    
    client.initialize().catch(err => {
        console.error(`[${sessionId}] Initialization ERROR:`, err.message);
        io.to(sessionId).emit('init_error', { sessionId, error: err.message });
        io.emit('status_update', { sessionId, message: `Initialization Error: ${err.message}` });
        cleanupSession(sessionId);
    }).finally(() => {
        if (!sessions[sessionId] || !sessions[sessionId].client) {
            delete initializing[sessionId];
        }
    });
    
    return sessions[sessionId].client;
}

// --- Number Normalization Function ---
function normalizeToJid(rawNumber, userSelectedCountryCode) {
    if (typeof rawNumber !== 'string') {
        rawNumber = String(rawNumber);
    }

    if (rawNumber.includes('@')) {
        return rawNumber;
    }

    if (rawNumber.startsWith('+')) {
        return `${rawNumber.substring(1).replace(/\D/g, '')}@c.us`;
    }

    let cleanedNumber = rawNumber.replace(/\D/g, '');

    if (userSelectedCountryCode && String(userSelectedCountryCode).trim() !== "") {
        const cc = String(userSelectedCountryCode).replace(/\D/g, '');
        if (cleanedNumber.startsWith('0')) {
            return `${cc}${cleanedNumber.substring(1)}@c.us`;
        }
        else if (cleanedNumber.startsWith(cc)) {
            return `${cleanedNumber}@c.us`;
        }
        else {
            return `${cc}${cleanedNumber}@c.us`;
        }
    } else {
        return `${cleanedNumber}@c.us`;
    }
}

// --- ALL API Routes ---

// MODIFIED: Login API to authenticate against MongoDB User collection
app.post('/auth/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password are required.' });

    try {
        const user = await User.findOne({ username: username });
        if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials (user not found).' });

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) return res.status(401).json({ success: false, error: 'Invalid credentials (password mismatch).' });

        const userPayload = { id: user._id, username: user.username, isAdmin: user.isAdmin };
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '24h' });
        res.json({ success: true, message: 'Login successful', token: token, user: userPayload });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, error: 'An unexpected error occurred during login.' });
    }
});


app.post('/session/init/:sessionId', authenticateToken, (req, res) => {
    const { sessionId } = req.params;
    
    if (initializing[sessionId]) {
        return res.json({ 
            success: true, 
            message: `Session '${sessionId}' initialization already in progress.`, 
            status: 'INITIALIZING' 
        });
    }
    
    if (sessions[sessionId] && sessions[sessionId].client) {
        sessions[sessionId].client.getState()
            .then(state => {
                res.json({ 
                    success: true, 
                    message: `Session '${sessionId}' exists.`, 
                    status: state || 'INITIALIZING', 
                    qr: qrCodes[sessionId] 
                });
            })
            .catch(() => { 
                if (sessions[sessionId] && sessions[sessionId].client) {
                    try { sessions[sessionId].client.destroy(); } catch(e) { /* ignore */ }
                    cleanupSession(sessionId);
                }
                
                createWhatsappSession(sessionId); 
                res.json({ 
                    success: true, 
                    message: `Session '${sessionId}' re-initializing.`, 
                    status: 'RE_INITIALIZING' 
                });
            });
    } else { 
        createWhatsappSession(sessionId); 
        res.json({ 
            success: true, 
            message: `Session '${sessionId}' initialization started.`, 
            status: 'INITIALIZING' 
        });
    }
});

app.get('/sessions', authenticateToken, (req, res) => {
    const sessionList = Object.keys(sessions).map(id => ({ 
        sessionId: id, 
        isReady: clientReadyStatus[id] || false, 
        hasQr: !!qrCodes[id],
        initializing: !!initializing[id],
        settings: sessions[id] ? sessions[id].settings : {}
    }));
    
    res.json({ success: true, sessions: sessionList });
});

app.post('/session/remove/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;
    
    if (client) {
        try {
            await client.logout();
            
            setTimeout(async () => {
                try {
                    await client.destroy();
                } catch (destroyErr) {
                    console.error(`[${sessionId}] Error destroying client: ${destroyErr.message}`);
                }
            }, 1000);
        } catch (e) {
            console.error(`[${sessionId}] Error removing:`, e.message);
            if (client) {
                try {
                    await client.destroy();
                } catch (destroyErr) {
                    console.error(`[${sessionId}] Error destroying client: ${destroyErr.message}`);
                }
            }
        }
    }
    
    cleanupSession(sessionId);
    res.json({ success: true, message: `Session '${sessionId}' removed.` });
});

app.post('/session/send-message/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { number, message, countryCode } = req.body;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success: false, error: 'Session not ready or not found.' });
    }
    if (!number || !message) {
        return res.status(400).json({ success: false, error: 'Number and message are required.' });
    }

    try {
        const jid = normalizeToJid(number, countryCode);
        await client.sendMessage(jid, message);
        res.json({ success: true, message: 'Message sent.' });
    } catch (error) {
        console.error(`Error sending message for session ${sessionId}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/session/send-image/:sessionId', authenticateToken, upload.single('file'), async (req, res) => {
    const { sessionId } = req.params;
    const { number, caption, url, countryCode } = req.body;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success: false, error: 'Session not ready or not found.' });
    }
    if (!number) {
        return res.status(400).json({ success: false, error: 'Recipient number is required.' });
    }

    try {
        const jid = normalizeToJid(number, countryCode);
        let media;
        if (req.file) {
            media = new MessageMedia(req.file.mimetype, req.file.buffer.toString('base64'));
        } else if (url) {
            media = await MessageMedia.fromUrl(url);
        } else {
            return res.status(400).json({ success: false, error: 'No file uploaded or URL provided.' });
        }

        await client.sendMessage(jid, media, { caption: caption || '' });
        res.json({ success: true, message: 'Media sent.' });
    } catch (error) {
        console.error(`Error sending media for session ${sessionId}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/session/send-location/:sessionId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { number, latitude, longitude, description, countryCode } = req.body;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success: false, error: 'Session not ready or not found.' });
    }
    if (!number || typeof latitude === 'undefined' || typeof longitude === 'undefined') {
        return res.status(400).json({ success = false, error = 'Number, latitude, and longitude are required.' });
    }

    try {
        const jid = normalizeToJid(number, countryCode);
        const location = new Location(latitude, longitude, description || '');
        await client.sendMessage(jid, location);
        res.json({ success: true, message: 'Location sent.' });
    } catch (error) {
        console.error(`Error sending location for session ${sessionId}:`, error);
        res.status(500).json({ success: true, error: error.message });
    }
});

app.get('/session/contact-info/:sessionId/:contactId', authenticateToken, async (req, res) => {
    const { sessionId, contactId } = req.params;
    const { countryCode } = req.query;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success = false, error = 'Session not ready or not found.' });
    }
    if (!contactId) {
        return res.status(400).json({ success = false, error = 'Contact ID is required.' });
    }

    try {
        const jid = normalizeToJid(contactId, countryCode);
        const contact = await client.getContactById(jid);
        
        let profilePicUrl = null;
        try {
            profilePicUrl = await client.getProfilePicUrl(jid);
        } catch (e) {
            console.warn(`Could not get profile picture for ${jid}: ${e.message}`);
        }

        const contactInfo = {
            id: contact.id._serialized,
            name: contact.name || contact.pushname,
            number: contact.number,
            isBusiness: contact.isBusiness,
            pushname: contact.pushname,
            profileStatus: contact.statusMessege,
            profilePicUrl: profilePicUrl
        };
        res.json({ success: true, contact: contactInfo });
    } catch (error) {
        console.error(`Error getting contact info for session ${sessionId}, contact ${contactId}:`, error);
        res.status(500).json({ success = false, error = error.message });
    }
});

app.post('/session/:sessionId/set-presence-online', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { enabled } = req.body;
    const sessionObj = sessions[sessionId];
    const client = sessionObj ? sessionObj.client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success = false, error = 'Session not ready or not found.' });
    }

    try {
        if (enabled) {
            await client.setStatus('Online');
            sessionObj.settings.maintainOnlinePresenceEnabled = true;
            res.json({ success: true, message: 'Profile status set to "Online".' });
        } else {
            sessionObj.settings.maintainOnlinePresenceEnabled = false;
            res.json({ success: true, message: 'Online presence simulation disabled locally.' });
        }
    } catch (error) {
        console.error(`Error setting presence online for session ${sessionId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error setting profile status.' });
    }
});

app.post('/session/:sessionId/settings/typing', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { enabled } = req.body;
    const sessionObj = sessions[sessionId];

    if (!sessionObj) {
        return res.status(400).json({ success = false, error = 'Session not found.' });
    }

    sessionObj.settings.isTypingIndicatorEnabled = enabled;
    res.json({ success: true, message: `Typing indicator setting updated to ${enabled}.` });
});

app.post('/session/:sessionId/settings/autoseen', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { enabled } = req.body;
    const sessionObj = sessions[sessionId];

    if (!sessionObj) {
        return res.status(400).json({ success = false, error = 'Session not found.' });
    }

    sessionObj.settings.autoSendSeenEnabled = enabled;
    res.json({ success: true, message: `Auto send seen setting updated to ${enabled}.` });
});


app.post('/session/:sessionId/chat/:chatId/send-typing', authenticateToken, async (req, res) => {
    const { sessionId, chatId } = req.params;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success = false, error = 'Session not ready or not found.' });
    }

    try {
        await client.sendChatstate('typing', chatId);
        res.json({ success: true, message: 'Typing state sent.' });
    } catch (error) {
        console.error(`Error sending typing state for session ${sessionId}, chat ${chatId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error sending typing state.' });
    }
});

app.post('/session/:sessionId/chat/:chatId/send-seen', authenticateToken, async (req, res) => {
    const { sessionId, chatId } = req.params;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success = false, error = 'Session not ready or not found.' });
    }

    try {
        await client.sendSeen(chatId);
        res.json({ success: true, message: 'Seen receipt sent.' });
    } catch (error) {
        console.error(`Error sending seen receipt for session ${sessionId}, chat ${chatId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error sending seen receipt.' });
    }
});

app.post('/session/:sessionId/set-presence-online', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const client = sessions[sessionId] ? sessions[sessionId].client : null;

    if (!client || !clientReadyStatus[sessionId]) {
        return res.status(400).json({ success = false, error = 'Session not ready or not found.' });
    }

    try {
        await client.setStatus('Online');
        res.json({ success: true, message: 'Presence set to Online.' });
    } catch (error) {
        console.error(`Error setting presence online for session ${sessionId}:`, error);
        res.status(500).json({ success = false, error = error.message });
    }
});

// --- Auto-Responder CRUD APIs ---

// Get all auto-responders for a session
app.get('/session/:sessionId/auto-responders', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    try {
        const responders = await AutoResponder.find({ sessionId: sessionId });
        res.json({ success: true, responders });
    } catch (error) {
        console.error(`Error getting auto-responders for session ${sessionId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error fetching auto-responders.' });
    }
});

// Create a new auto-responder
app.post('/session/:sessionId/auto-responders', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { keyword, messageType, keywordType, quoted, replyOnlyWhen, status, messageContent } = req.body;

    if (!keyword || !messageType || !messageContent) {
        return res.status(400).json({ success = false, error = 'Keyword, messageType, and messageContent are required.' });
    }

    try {
        const newResponder = new AutoResponder({
            sessionId,
            keyword,
            messageType,
            keywordType,
            quoted,
            replyOnlyWhen,
            status,
            messageContent
        });
        const savedResponder = await newResponder.save();
        res.status(201).json({ success: true, responder: savedResponder, message: 'Auto-responder created.' });
    } catch (error) {
        console.error(`Error creating auto-responder for session ${sessionId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error creating auto-responder.' });
    }
});

// Update an auto-responder
app.put('/session/:sessionId/auto-responders/:responderId', authenticateToken, async (req, res) => {
    const { sessionId, responderId } = req.params;
    const { keyword, messageType, keywordType, quoted, replyOnlyWhen, status, messageContent } = req.body;

    try {
        const updatedResponder = await AutoResponder.findOneAndUpdate(
            { _id: responderId, sessionId: sessionId },
            { keyword, messageType, keywordType, quoted, replyOnlyWhen, status, messageContent },
            { new: true, runValidators: true }
        );

        if (!updatedResponder) {
            return res.status(404).json({ success = false, error = 'Auto-responder not found or does not belong to this session.' });
        }
        res.json({ success: true, responder: updatedResponder, message: 'Auto-responder updated.' });
    } catch (error) {
        console.error(`Error updating auto-responder ${responderId} for session ${sessionId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error updating auto-responder.' });
    }
});

// Delete an auto-responder
app.delete('/session/:sessionId/auto-responders/:responderId', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    try {
        const deletedResponder = await AutoResponder.findOneAndDelete({ _id: responderId, sessionId: sessionId });

        if (!deletedResponder) {
            return res.status(404).json({ success = false, error = 'Auto-responder not found or does not belong to this session.' });
        }
        res.json({ success: true, message: 'Auto-responder deleted.' });
    } catch (error) {
        console.error(`Error deleting auto-responder ${responderId} for session ${sessionId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error deleting auto-responder.' });
    }
});

// Batch delete auto-responders
app.post('/session/:sessionId/auto-responders/batch-delete', authenticateToken, async (req, res) => {
    const { sessionId } = req.params;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success = false, error = 'An array of responder IDs is required for batch delete.' });
    }

    try {
        const result = await AutoResponder.deleteMany({ _id: { $in: ids }, sessionId: sessionId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success = false, message = 'No matching auto-responders found for deletion.', deletedCount = 0 });
        }
        res.json({ success: true, message: `${result.deletedCount} auto-responder(s) deleted.`, deletedCount: result.deletedCount });
    } catch (error) {
        console.error(`Error batch deleting auto-responders for session ${sessionId}:`, error);
        res.status(500).json({ success = false, error = error.message || 'Error batch deleting auto-responders.' });
    }
});


// --- Serve Frontend (MOVED DOWN TO ENSURE API ROUTES ARE PRIORITIZED) ---
const frontendDistPath = path.join(__dirname, 'frontend_build');
app.use(express.static(frontendDistPath));
console.log(`Serving static files from: ${frontendDistPath}`);


// --- Socket.IO Listeners ---
io.on('connection', (socket) => {
    if (!socket.user) { 
        socket.disconnect(true); 
        return; 
    } 
    
    console.log('Socket.IO user connected:', socket.id, `(User: ${socket.user.username})`);
    
    socket.on('join_session_room', (sessionId) => { 
        if (sessionId) { 
            socket.join(sessionId); 
            
            if (qrCodes[sessionId]) {
                socket.emit('qr_code', { sessionId, qr: qrCodes[sessionId] });
            } 
            else if (clientReadyStatus[sessionId]) {
                socket.emit('ready', { sessionId });
            } 
            else if (sessions[sessionId]) {
                socket.emit('status_update', { 
                    sessionId, 
                    message: initializing[sessionId] ? 'Session initializing...' : 'Session exists.',
                    settings: sessions[sessionId].settings
                });
            } 
            else {
                socket.emit('status_update', { 
                    sessionId, 
                    message: 'Session not active.',
                    qrCleared: true
                });
            }
        }
    });
    
    socket.on('request_init_session', (sessionId) => { 
        if (!sessionId) return;
        
        if (initializing[sessionId]) {
            console.log(`[${sessionId}] Session initialization already in progress, not starting again`);
            socket.emit('status_update', { 
                sessionId, 
                message: `Session initialization in progress.` 
            });
            return;
        }
        
        if (sessions[sessionId] && sessions[sessionId].client) {
            sessions[sessionId].client.getState()
                .then(st => {
                    socket.emit('status_update', { 
                        sessionId, 
                        message: `Session exists. State: ${st}`, 
                        status: st,
                        settings: sessions[sessionId].settings
                    });
                    
                    if (qrCodes[sessionId]) {
                        socket.emit('qr_code', { 
                            sessionId, 
                            qr: qrCodes[sessionId] 
                        });
                    }
                })
                .catch(() => { 
                    if (sessions[sessionId] && sessions[sessionId].client) {
                        try { sessions[sessionId].client.destroy(); } catch(e) { /* ignore */ }
                        cleanupSession(sessionId);
                    }
                    
                    createWhatsappSession(sessionId); 
                    socket.emit('status_update', { 
                        sessionId, 
                        message: `Session re-initializing.`
                    });
                });
        } else { 
            createWhatsappSession(sessionId); 
            socket.emit('status_update', { 
                sessionId, 
                message: `Session initialization started.`
            });
        } 
    });
    
    socket.on('disconnect', () => console.log('Socket.IO user disconnected:', socket.id));
});

server.listen(PORT, () => {
    console.log(`Server with authentication running on http://localhost:${PORT}`);
});