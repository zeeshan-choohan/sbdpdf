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

// Add IndexNow functionality to a new route
router.post('/submit-indexnow', async (req, res) => {
    const urlList = req.body.urlList || []; // Expecting list of URLs in request body
    const key = '5d72b8c4b3744971b8a96575bd7760ed'; // Your API key
    const keyLocation = `https://scribdpdfdownloader.com/${key}.txt`; // Path to key file

    if (!urlList.length) {
        return res.status(400).json({ message: 'No URLs provided for submission.' });
    }

    const requestBody = {
        host: 'scribdpdfdownloader.com',
        key: key,
        keyLocation: keyLocation,
        urlList: urlList
    };

    try {
        const response = await axios.post('https://api.indexnow.org/indexnow', requestBody, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        res.status(200).json({ message: 'URLs submitted successfully', data: response.data });
    } catch (error) {
        console.error('Error submitting URLs to IndexNow:', error);
        res.status(500).json({ message: 'Error submitting URLs', error: error.message });
    }
});

// Catch-all route for 404 errors
router.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, '404.html'));
});

module.exports = router;
