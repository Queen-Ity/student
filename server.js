require('dotenv').config();

const express = require('express');
const dns = require('dns');
const mongoose = require('mongoose');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const { randomBytes } = require('node:crypto');
const studentRoutes = require('./routes/students');
const authRoutes = require('./routes/auth');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

dns.setServers(['8.8.8.8', '1.1.1.1']);

if (!process.env.ADMIN_PASSWORD) {
    console.warn('The default admin password is active. Set ADMIN_PASSWORD before deployment.');
}

// CONNECT TO MONGODB
async function startServer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        if (process.env.NODE_ENV === 'production') {
            app.set('trust proxy', 1);
        }

        app.use(session({
            name: 'student.sid',
            secret: process.env.SESSION_SECRET || randomBytes(32).toString('hex'),
            store: MongoStore.create({
                client: mongoose.connection.getClient(),
                collectionName: 'sessions'
            }),
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                sameSite: 'strict',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 8 * 60 * 60 * 1000
            }
        }));

        app.use('/api/auth', authRoutes);
        app.use('/api/students', studentRoutes);

        app.listen(PORT, () => {
            console.log(`Server is running on: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}

startServer();