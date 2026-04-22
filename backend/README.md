# PhotoFlow Backend

A **local-first AI-powered photography platform** backend built with NestJS, MongoDB, and TypeScript. This backend enables photographers to upload, organize, and share high-resolution photos with AI-powered tagging and smart album features.

## 🎯 Features

### Authentication
- ✅ Email + password registration and login
- ✅ JWT-based authentication
- ✅ Secure password hashing with bcrypt

### Photo Management
- ✅ High-resolution photo upload
- ✅ Automatic EXIF metadata extraction
- ✅ Thumbnail generation using Sharp
- ✅ AI-powered automatic tagging
- ✅ Tag-based photo filtering
- ✅ Pagination support

### Albums
- ✅ Manual albums with photo management
- ✅ Smart albums with tag-based auto-inclusion
- ✅ Add/remove photos from albums
- ✅ Dynamic photo fetching for smart albums

### Sharing
- ✅ Generate shareable token URLs for photos and albums
- ✅ Optional link expiration
- ✅ Public access without authentication
- ✅ Link management

### AI Tagging
- ✅ Mock AI service for development
- ✅ EXIF-aware tag generation
- ✅ Extensible architecture for real ML integration

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | NestJS |
| Language | TypeScript |
| Database | MongoDB (local via Docker) |
| ODM | Mongoose |
| Authentication | JWT with Passport |
| Validation | Zod |
| Image Processing | Sharp |
| Metadata Extraction | exif-parser |
| File Storage | Local filesystem |

## 📁 Project Structure

```
backend/
├── src/
│   ├── auth/                 # Authentication module
│   │   ├── decorators/       # Custom decorators (CurrentUser)
│   │   ├── dto/              # Auth DTOs with Zod validation
│   │   ├── guards/           # JWT auth guard
│   │   ├── strategies/       # Passport JWT strategy
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── users/                # User schema
│   │   └── schemas/
│   │       └── user.schema.ts
│   ├── photos/               # Photo upload & management
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── photos.controller.ts
│   │   ├── photos.service.ts
│   │   └── photos.module.ts
│   ├── albums/               # Album management
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── albums.controller.ts
│   │   ├── albums.service.ts
│   │   └── albums.module.ts
│   ├── shared-links/         # Sharing functionality
│   │   ├── dto/
│   │   ├── schemas/
│   │   ├── shared-links.controller.ts
│   │   ├── shared-links.service.ts
│   │   └── shared-links.module.ts
│   ├── ai/                   # AI tagging service
│   │   ├── ai.service.ts
│   │   └── ai.module.ts
│   ├── common/               # Shared utilities
│   │   ├── filters/          # Exception filters
│   │   ├── interceptors/     # Logging interceptor
│   │   └── pipes/            # Zod validation pipe
│   ├── database/             # MongoDB connection
│   │   └── database.module.ts
│   ├── app.module.ts
│   └── main.ts
├── uploads/                  # Local file storage
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.x
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Start MongoDB with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Start the development server**
   ```bash
   npm run start:dev
   ```

The server will start on `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file in the backend root:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
MONGODB_URI=mongodb://localhost:27017/lumina-studio

# JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

## 📡 API Documentation

Base URL: `https://PhotoFlow.in/api`

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-01-06T10:30:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

### Photos

**All photo endpoints require authentication. Include JWT token in header:**
```
Authorization: Bearer <your-jwt-token>
```

#### Upload Photo
```http
POST /api/photos/upload
Content-Type: multipart/form-data

file: <image-file>
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439012",
  "filename": "1704537000000.jpg",
  "originalName": "sunset.jpg",
  "mimeType": "image/jpeg",
  "size": 2048576,
  "width": 4032,
  "height": 3024,
  "metadata": {
    "exif": { ... },
    "imageSize": { ... }
  },
  "tags": ["landscape", "outdoor", "golden-hour", "sunset", "nature"],
  "thumbnailFilename": "thumb_1704537000000.jpg",
  "createdAt": "2026-01-06T10:30:00.000Z"
}
```

#### Get All Photos
```http
GET /api/photos?page=1&limit=20&tags=landscape,sunset
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `tags` (optional): Comma-separated tags to filter by

**Response:**
```json
{
  "photos": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

#### Get Single Photo
```http
GET /api/photos/:id
```

#### Download Photo
```http
GET /api/photos/:id/download
```

#### Get Thumbnail
```http
GET /api/photos/:id/thumbnail
```

### Albums

#### Create Album (Manual)
```http
POST /api/albums
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Wedding 2026",
  "isSmart": false,
  "photoIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"]
}
```

#### Create Smart Album
```http
POST /api/albums
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "Golden Hour Collection",
  "isSmart": true,
  "tagRules": ["golden-hour", "sunset", "sunrise"]
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439014",
  "title": "Golden Hour Collection",
  "isSmart": true,
  "tagRules": ["golden-hour", "sunset", "sunrise"],
  "photoCount": 12,
  "photos": [...],
  "createdAt": "2026-01-06T10:30:00.000Z"
}
```

#### Get All Albums
```http
GET /api/albums
Authorization: Bearer <token>
```

#### Get Single Album
```http
GET /api/albums/:id
Authorization: Bearer <token>
```

#### Add Photos to Album
```http
POST /api/albums/:id/photos
Content-Type: application/json
Authorization: Bearer <token>

{
  "photoIds": ["507f1f77bcf86cd799439015"]
}
```

#### Remove Photos from Album
```http
DELETE /api/albums/:id/photos
Content-Type: application/json
Authorization: Bearer <token>

{
  "photoIds": ["507f1f77bcf86cd799439015"]
}
```

### Sharing

#### Share a Photo
```http
POST /api/share/photo/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "expiresInDays": 30
}
```

**Response:**
```json
{
  "id": "507f1f77bcf86cd799439016",
  "token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "url": "/share/a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "expiresAt": "2026-02-05T10:30:00.000Z",
  "createdAt": "2026-01-06T10:30:00.000Z"
}
```

#### Share an Album
```http
POST /api/share/album/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "expiresInDays": 7
}
```

#### Access Shared Resource (Public)
```http
GET /api/share/:token
```

**Response:**
```json
{
  "type": "photo",
  "data": { ... },
  "expiresAt": "2026-02-05T10:30:00.000Z"
}
```

#### Get User's Shared Links
```http
GET /api/share
Authorization: Bearer <token>
```

#### Delete Shared Link
```http
DELETE /api/share/:id
Authorization: Bearer <token>
```

## 🗄 Database Schemas

### User
```typescript
{
  _id: ObjectId
  name: string
  email: string (unique, indexed)
  passwordHash: string
  createdAt: Date
}
```

### Photo
```typescript
{
  _id: ObjectId
  userId: ObjectId (indexed)
  filename: string
  originalName: string
  mimeType: string
  size: number
  width: number
  height: number
  metadata: Object
  tags: string[] (indexed)
  thumbnailFilename: string
  createdAt: Date
}
```

### Album
```typescript
{
  _id: ObjectId
  userId: ObjectId (indexed)
  title: string
  isSmart: boolean
  tagRules: string[]
  photoIds: ObjectId[]
  createdAt: Date
}
```

### SharedLink
```typescript
{
  _id: ObjectId
  resourceType: "photo" | "album"
  resourceId: ObjectId
  userId: ObjectId
  token: string (unique, indexed)
  expiresAt: Date
  createdAt: Date
}
```

## 🧪 Testing the API

### Using cURL

**Register a user:**
```bash
curl -X POST https://PhotoFlow.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**Upload a photo:**
```bash
curl -X POST https://PhotoFlow.in/api/photos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

### Using Postman

1. Import the API endpoints
2. Set up environment variables for `baseUrl` and `token`
3. Create a collection with all endpoints
4. Use the `{{token}}` variable for authenticated requests

## 🔄 Development Workflow

1. **Start MongoDB:**
   ```bash
   docker-compose up -d
   ```

2. **Start development server:**
   ```bash
   npm run start:dev
   ```

3. **Watch for changes:**
   The server automatically restarts on file changes

4. **Check MongoDB:**
   ```bash
   docker exec -it lumina-mongodb mongosh
   use lumina-studio
   db.users.find()
   ```

## 🏗 Production Build

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## 🔐 Security Best Practices

1. **Change JWT Secret:** Update `JWT_SECRET` in `.env` with a strong random string
2. **Use HTTPS:** Always use HTTPS in production
3. **Rate Limiting:** Add rate limiting for auth endpoints
4. **File Validation:** The system validates file types on upload
5. **Input Validation:** All inputs are validated with Zod schemas

## 📝 Code Quality

The project follows these standards:

- **Clean Architecture:** Modular design with separation of concerns
- **Type Safety:** Full TypeScript with strict mode
- **Validation:** Zod schemas for all DTOs
- **Error Handling:** Centralized exception filter
- **Logging:** Request/response logging interceptor
- **No TODOs:** All code is production-ready

## 🔮 Future Enhancements

Replace the mock AI service with:
- **TensorFlow.js** for browser-based ML
- **ONNX Runtime** for optimized inference
- **Cloud AI Services** (AWS Rekognition, Google Vision, Azure Computer Vision)

## 🐛 Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
docker ps

# View MongoDB logs
docker logs lumina-mongodb

# Restart MongoDB
docker-compose restart mongodb
```

### Port Already in Use
```bash
# Kill process on port 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### File Upload Issues
- Check `UPLOAD_DIR` exists and has write permissions
- Verify `MAX_FILE_SIZE` in `.env`
- Ensure Sharp is properly installed: `npm rebuild sharp`

## 📄 License

MIT

## 👨‍💻 Author

Built for photographers who need local-first photo management with AI capabilities.

---

**Happy Coding! 📸✨**
