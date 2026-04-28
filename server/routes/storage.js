const express = require('express');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '../uploads');

// GET /api/storage/files — list all files (admin only)
router.get('/files', protect, authorize('admin'), (req, res) => {
    try {
        const folders = ['projects', 'grievances', 'others'];
        let allFiles = [];

        folders.forEach(folder => {
            const folderPath = path.join(UPLOAD_ROOT, folder);
            if (fs.existsSync(folderPath)) {
                const files = fs.readdirSync(folderPath);
                files.forEach(file => {
                    const stats = fs.statSync(path.join(folderPath, file));
                    allFiles.push({
                        name: file,
                        folder: folder,
                        path: `/uploads/${folder}/${file}`,
                        size: stats.size,
                        createdAt: stats.birthtime,
                        type: path.extname(file).toLowerCase().replace('.', '')
                    });
                });
            }
        });

        res.json({ success: true, files: allFiles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/storage/files/:folder/:name — delete a file
router.delete('/files/:folder/:name', protect, authorize('admin'), (req, res) => {
    try {
        const { folder, name } = req.params;
        const filePath = path.join(UPLOAD_ROOT, folder, name);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'File deleted successfully' });
        } else {
            res.status(404).json({ success: false, message: 'File not found' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
