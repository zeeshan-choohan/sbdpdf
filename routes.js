const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();

// Default pages routing
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

router.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'blog.html'));
});

router.get('/privacy-policy', (req, res) => {
    res.sendFile(path.join(__dirname, 'privacy_policy.html'));
});

router.get('/disclaimer', (req, res) => {
    res.sendFile(path.join(__dirname, 'disclaimer.html'));
});

router.get('/terms-of-service', (req, res) => {
    res.sendFile(path.join(__dirname, 'terms_of_service.html'));
});

router.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'about.html'));
});

router.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});

// Language-specific routes
router.get('/:lang', async (req, res, next) => {
    const lang = req.params.lang?.toLowerCase();
    const validLanguages = ['es', 'de', 'fr', 'id', 'it', 'pt', 'ro', 'ru'];

    // Check if the lang parameter is in the list of valid languages
    if (validLanguages.includes(lang)) {
        try {
            const filePath = path.join(__dirname, `${lang}_index.html`);
            await fs.access(filePath);
            res.sendFile(filePath);
        } catch (err) {
            res.status(404).sendFile(path.join(__dirname, '404.html'));
        }
    } else {
        // If the lang parameter is not a valid language, pass control to the next route
        next();
    }
});

module.exports = router;
