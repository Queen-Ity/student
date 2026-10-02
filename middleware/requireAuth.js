function requireAuth(req, res, next) {
    if (req.session && req.session.adminEmail) {
        return next();
    }

    return res.status(401).json({ message: 'Please sign in to continue.' });
}

module.exports = requireAuth;