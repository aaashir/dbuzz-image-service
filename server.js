const express = require('express')
const multer = require('multer')
const B2 = require('backblaze-b2')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3101

// Security middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Rate limiting
const uploadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: 'Too many upload attempts, please try again later.',
})

// Initialize Backblaze B2
const b2 = new B2({
    applicationKeyId: process.env.B2_APPLICATION_KEY_ID,
    applicationKey: process.env.B2_APPLICATION_KEY,
})

// Configure multer for memory storage
const storage = multer.memoryStorage()
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(new Error('Only image files are allowed!'), false)
        }
    },
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() })
})



// Upload endpoint
app.post('/upload', uploadLimiter, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' })
        }

        // Authorize with B2
        await b2.authorize()

        // Generate filename using customFileName or fallback to original logic
        const timestamp = Date.now()
        const originalName = req.file.originalname
        const extension = originalName.split('.').pop()

        let fileName
        if (req.body.customFileName) {
            // Use custom filename from frontend, ensure it has proper extension
            const customName = req.body.customFileName
            const hasExtension = customName.includes('.')
            fileName = hasExtension ? customName : `${customName}.${extension}`
        } else {
            // Fallback to timestamp-based naming
            fileName = `${timestamp}-${Math.random()
                .toString(36)
                .substring(7)}.${extension}`
        }

        // Get upload URL
        const uploadUrlResponse = await b2.getUploadUrl({
            bucketId: process.env.B2_BUCKET_ID,
        })

        // Upload file to B2
        const uploadResponse = await b2.uploadFile({
            uploadUrl: uploadUrlResponse.data.uploadUrl,
            uploadAuthToken: uploadUrlResponse.data.authorizationToken,
            fileName: fileName,
            data: req.file.buffer,
            mime: req.file.mimetype,
        })

        // Generate preview URL
        const bucketName = process.env.B2_BUCKET_NAME
        const previewUrl = `https://f005.backblazeb2.com/file/${bucketName}/${fileName}`

        res.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                fileId: uploadResponse.data.fileId,
                fileName: fileName,
                previewUrl: previewUrl,
                fileSize: req.file.size,
                mimeType: req.file.mimetype,
                uploadedAt: new Date().toISOString(),
            },
        })
    } catch (error) {
        console.error('Upload error:', error)
        res.status(500).json({
            success: false,
            error: 'Failed to upload image',
            message: error.message,
        })
    }
})



// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res
                .status(400)
                .json({ error: 'File too large. Maximum size is 10MB.' })
        }
    }

    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ error: error.message })
    }

    console.error('Unhandled error:', error)
    res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' })
})

// Start server
app.listen(PORT, () => {
    console.log(`🚀 DBUZZ Image Service running on port ${PORT}`)
    console.log(`📊 Health check: http://localhost:${PORT}/health`)
    console.log(`📤 Upload endpoint: http://localhost:${PORT}/upload`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully')
    process.exit(0)
})

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully')
    process.exit(0)
})

module.exports = app
