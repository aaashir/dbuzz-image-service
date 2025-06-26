# DBUZZ Image Service

A Node.js service for uploading images to Backblaze B2 Cloud Storage with PM2 process management.

## Features

-   🚀 Fast image uploads to Backblaze B2
-   🔒 Security with rate limiting and file validation
-   📊 Health check endpoint
-   🔄 PM2 clustering for high availability
-   📝 Comprehensive logging
-   🛡️ Input validation and error handling
-   🌐 CORS enabled for web applications

## Prerequisites

-   Node.js (v16 or higher)
-   npm or yarn
-   Backblaze B2 account
-   PM2 (for production)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your Backblaze B2 credentials:

```env
PORT=3000
NODE_ENV=development

B2_APPLICATION_KEY_ID=your_application_key_id_here
B2_APPLICATION_KEY=your_application_key_here
B2_BUCKET_ID=your_bucket_id_here
B2_BUCKET_NAME=your_bucket_name_here
```

### 3. Get Backblaze B2 Credentials

1. Go to [Backblaze B2 Console](https://secure.backblaze.com/b2_buckets.htm)
2. Create a new bucket (or use existing)
3. Go to "App Keys" and create a new application key
4. Copy the Key ID and Application Key
5. Note your bucket ID and name

### 4. Create Logs Directory

```bash
mkdir logs
```

## Running the Service

### Development Mode

```bash
# Using npm
npm run dev

# Or directly with node
npm start
```

### Production with PM2

```bash
# Install PM2 globally (if not already installed)
npm install -g pm2

# Start the service
npm run pm2:start

# Check status
pm2 status

# View logs
pm2 logs dbuzz-image-service

# Stop the service
npm run pm2:stop

# Restart the service
npm run pm2:restart
```

## API Documentation

### Health Check

**GET** `/health`

Returns the service status.

**Deployed URL:** `https://endpoint.d.buzz/api/v1/image/health` (nginx routes `/api/v1/image/` to the service)

**Response:**

```json
{
    "status": "OK",
    "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Upload Image

**POST** `/upload`

Uploads an image to Backblaze B2 and returns a preview URL.

**Deployed URL:** `https://endpoint.d.buzz/api/v1/image/upload` (nginx routes `/api/v1/image/` to the service)

**Request:**

-   Method: `POST`
-   Content-Type: `multipart/form-data`
-   Body: Form data with `image` field containing the image file

**Response (Success):**

```json
{
    "success": true,
    "message": "Image uploaded successfully",
    "data": {
        "fileId": "4_z27c88f1d182b150646ff0b16_f200ec4a2a9bd4e44_d20240115_m103000_c000_v0312004_t0000",
        "fileName": "1705314600000-abc123.jpg",
        "previewUrl": "https://f002.backblazeb2.com/file/your-bucket-name/1705314600000-abc123.jpg",
        "fileSize": 245760,
        "mimeType": "image/jpeg",
        "uploadedAt": "2024-01-15T10:30:00.000Z"
    }
}
```

**Response (Error):**

```json
{
    "success": false,
    "error": "Failed to upload image",
    "message": "Error details here"
}
```

## Usage Examples

### cURL

```bash
# Using original endpoint
curl -X POST \
  http://localhost:3000/upload \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/your/image.jpg' \
  -F 'customFileName=my-custom-name'

# Using versioned endpoint (for deployed environments)
curl -X POST \
  https://endpoint.d.buzz/api/v1/image/upload \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@/path/to/your/image.jpg' \
  -F 'customFileName=my-custom-name'
```

### JavaScript (Fetch API)

```javascript
const formData = new FormData()
const file = fileInput.files[0]
const customImageName = file.name.replace(/ /g, '-')

formData.append('file', file, file.name)
formData.append('customFileName', customImageName)

fetch('http://localhost:3000/upload', {
    method: 'POST',
    body: formData,
})
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            console.log('Image uploaded:', data.data.previewUrl)
        } else {
            console.error('Upload failed:', data.error)
        }
    })
    .catch((error) => console.error('Error:', error))
```

### React Example

```jsx
import React, { useState } from 'react'

function ImageUploader() {
    const [uploading, setUploading] = useState(false)
    const [imageUrl, setImageUrl] = useState('')

    const handleUpload = async (event) => {
        const file = event.target.files[0]
        if (!file) return

        setUploading(true)
        const formData = new FormData()
        const customImageName = file.name.replace(/ /g, '-')

        formData.append('file', file, file.name)
        formData.append('customFileName', customImageName)

        try {
            const response = await fetch('http://localhost:3000/upload', {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (data.success) {
                setImageUrl(data.data.previewUrl)
            } else {
                alert('Upload failed: ' + data.error)
            }
        } catch (error) {
            alert('Upload error: ' + error.message)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div>
            <input
                type='file'
                accept='image/*'
                onChange={handleUpload}
                disabled={uploading}
            />
            {uploading && <p>Uploading...</p>}
            {imageUrl && (
                <img
                    src={imageUrl}
                    alt='Uploaded'
                    style={{ maxWidth: '300px' }}
                />
            )}
        </div>
    )
}

export default ImageUploader
```

## Configuration

### File Limits

-   Maximum file size: 10MB
-   Allowed file types: Images only (JPEG, PNG, GIF, WebP, etc.)
-   Rate limit: 10 uploads per 15 minutes per IP

### PM2 Configuration

The service is configured to:

-   Use all available CPU cores in cluster mode
-   Restart automatically on crashes
-   Rotate logs
-   Monitor memory usage (restart if > 1GB)

## Monitoring

### PM2 Commands

```bash
# View real-time logs
pm2 logs dbuzz-image-service

# Monitor CPU and memory
pm2 monit

# View detailed info
pm2 show dbuzz-image-service

# Restart if needed
pm2 restart dbuzz-image-service
```

### Log Files

Logs are stored in the `logs/` directory:

-   `out.log` - Standard output
-   `err.log` - Error logs
-   `combined.log` - Combined logs

## Security Features

-   **Helmet.js**: Security headers
-   **CORS**: Cross-origin resource sharing
-   **Rate Limiting**: Prevents abuse
-   **File Validation**: Only images allowed
-   **Size Limits**: 10MB maximum
-   **Input Sanitization**: Secure filename generation

## Troubleshooting

### Common Issues

1. **"Bucket not found" error**

    - Verify `B2_BUCKET_ID` and `B2_BUCKET_NAME` in `.env`
    - Ensure the bucket exists in your B2 account

2. **"Unauthorized" error**

    - Check `B2_APPLICATION_KEY_ID` and `B2_APPLICATION_KEY`
    - Ensure the application key has read/write permissions

3. **"File too large" error**

    - Images must be under 10MB
    - Adjust the limit in `server.js` if needed

4. **PM2 not starting**
    - Check if port 3000 is available
    - Verify all environment variables are set
    - Check logs: `pm2 logs dbuzz-image-service`

### Debug Mode

Set `NODE_ENV=development` in your `.env` file for detailed error messages.

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please create an issue in the repository.
