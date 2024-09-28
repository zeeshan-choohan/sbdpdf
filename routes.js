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

router.get('/how-to-read-scribd-files-for-free' , (req , res) => {
    res.sendFile(path.join(__dirname, 'how-to-read-scribd-files-for-free.html'));
});

router.get('/where-to-find-downloaded-scribd-files' , (req , res) => {
    res.sendFile(path.join(__dirname, 'where-to-find-downloaded-scribd-files.html'));
});
router.get('/how-to-download-scribd-documents-as-pdf' , (req , res) => {
    res.sendFile(path.join(__dirname, 'how-to-download-scribd-documents-as-pdf.html'));
});
router.get('/how-much-is-scribd-monthly-subscription' , (req , res) => {
    res.sendFile(path.join(__dirname, 'how-much-is-scribd-monthly-subscription.html'));
});
router.get('/how-to-get-a-refund-from-scribd' , (req , res) => {
    res.sendFile(path.join(__dirname, 'how-to-get-a-refund-from-scribd.html'));
});

router.get('/how-to-cancel-scribd-subscription' , (req , res) => {
    res.sendFile(path.join(__dirname, 'how-to-cancel-scribd-subscription.html'));
});

router.get('/es_blog' , (req , res) => {
    res.sendFile(path.join(__dirname, 'es_blog.html'));
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

// Catch-all route for 404 errors
router.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

module.exports = router;
