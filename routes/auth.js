const express = require('express');
const { createHash, timingSafeEqual } = require('node:crypto');

const router = express.Router();
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@email.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345';
const COOKIE_OPTIONS = {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production'
};

function safeEqual(firstValue, secondValue) {
    const firstHash = createHash('sha256').update(firstValue).digest();
    const secondHash = createHash('sha256').update(secondValue).digest();
    return timingSafeEqual(firstHash, secondHash);
}

router.post('/login', async (req, res, next) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string'
        || !safeEqual(email.trim().toLowerCase(), ADMIN_EMAIL.toLowerCase())
        || !safeEqual(password, ADMIN_PASSWORD)) {
        return res.status(401).json({ message: 'Invalid email or password.' });
    }

    try {
        await new Promise((resolve, reject) => {
            req.session.regenerate((error) => error ? reject(error) : resolve());
        });
        req.session.adminEmail = ADMIN_EMAIL;
        await new Promise((resolve, reject) => {
            req.session.save((error) => error ? reject(error) : resolve());
        });
        return res.json({ email: ADMIN_EMAIL });
    } catch (error) {
        return next(error);
    }
});

router.get('/session', (req, res) => {
    if (!req.session.adminEmail) {
        return res.status(401).json({ message: 'Not signed in.' });
    }

    return res.json({ email: req.session.adminEmail });
});

router.post('/logout', (req, res, next) => {
    req.session.destroy((error) => {
        if (error) {
            return next(error);
        }

        res.clearCookie('student.sid', COOKIE_OPTIONS);
        return res.sendStatus(204);
    });
});

module.exports = router;