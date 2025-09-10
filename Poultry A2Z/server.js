const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'data.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('.'));

// Ensure backup directory exists
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
    }
}

// Create backup
async function createBackup() {
    await ensureBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `data-backup-${timestamp}.json`);

    try {
        const currentData = await fs.readFile(DATA_FILE, 'utf8');
        await fs.writeFile(backupFile, currentData);
        return `data-backup-${timestamp}.json`;
    } catch (error) {
        console.error('Backup creation failed:', error);
        return null;
    }
}

// Get current data
app.get('/api/data', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading data:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// Update data
app.post('/api/data', async (req, res) => {
    try {
        const newData = req.body;

        // Validate JSON structure
        if (!newData.siteConfig || !newData.categories) {
            return res.status(400).json({ error: 'Invalid data structure' });
        }

        // Create backup
        const backupName = await createBackup();

        // Write new data
        await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));

        res.json({
            success: true,
            message: 'Data updated successfully',
            backup: backupName || 'Backup failed'
        });
    } catch (error) {
        console.error('Error updating data:', error);
        res.status(500).json({ error: 'Failed to update data: ' + error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Poultry A2Z Admin Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin Panel: http://localhost:${PORT}/admin.html`);
    console.log(`🌐 Main Site: http://localhost:${PORT}/index.html`);
});