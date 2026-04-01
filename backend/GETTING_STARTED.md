# 🚀 Getting Started with FaceMatrix Backend

This guide will help you get the FaceMatrix backend up and running in minutes.

## Prerequisites

Before you begin, ensure you have:

- ✅ **Node.js 18+** ([Download](https://nodejs.org/))
- ✅ **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- ✅ **Git** (optional, for cloning)
- ✅ **Postman** or **cURL** (for API testing)

## Quick Start (3 Steps)

### Step 1: Install Dependencies

Navigate to the backend folder and install packages:

```bash
cd backend
npm install
```

This will install all required dependencies including NestJS, MongoDB drivers, Sharp, and more.

### Step 2: Start MongoDB

Start the MongoDB container using Docker Compose:

```bash
docker-compose up -d
```

Verify MongoDB is running:

```bash
docker ps
```

You should see a container named `lumina-mongodb` running.

### Step 3: Start the Server

Run the development server:

```bash
npm run start:dev
```

You should see:

```
🚀 FaceMatrix Backend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Server running on http://localhost:3000
✅ API available at https://facematrix.sonomainfotech.in/api
✅ MongoDB connected successfully
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**🎉 You're ready to go!**

---

## Automated Setup (Alternative)

### Windows:
```bash
setup.bat
```

### Linux/Mac:
```bash
chmod +x setup.sh
./setup.sh
```

This will automatically:
- Install dependencies
- Create `.env` file
- Start MongoDB
- Create uploads directory

---

## Testing the API

### Option 1: Automated Test Script

**Windows:**
```bash
test-api.bat
```

**Linux/Mac:**
```bash
chmod +x test-api.sh
./test-api.sh
```

This script will:
- ✅ Test server availability
- ✅ Register a test user
- ✅ Login and get JWT token
- ✅ Test protected endpoints
- ✅ Create albums
- ✅ Verify authentication

### Option 2: Manual Testing with cURL

**1. Register a user:**
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

**2. Save the token from the response:**
```json
{
  "user": {...},
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**3. Upload a photo:**
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/photos/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/photo.jpg"
```

### Option 3: Postman

1. **Import the collection:**
   - Open Postman
   - Click "Import"
   - Select `postman-collection.json`

2. **Set up environment:**
   - Create a new environment
   - Add variable `baseUrl` = `https://facematrix.sonomainfotech.in/api`
      - Add variable `token` (leave empty for now)

3. **Register and Login:**
   - Run "Register" request
   - Run "Login" request
   - Copy the token from response
   - Paste it into the `token` environment variable

4. **Test all endpoints:**
   - Upload photos
   - Create albums
   - Share resources

---

## Directory Structure

After setup, your backend folder should look like:

```
backend/
├── node_modules/        # Dependencies (created by npm install)
├── dist/                # Compiled code (created by build)
├── uploads/             # Photo storage (created at runtime)
├── src/                 # Source code
├── .env                 # Environment variables
├── docker-compose.yml   # MongoDB configuration
└── package.json         # Project metadata
```

---

## Environment Configuration

The `.env` file controls the backend configuration:

```env
# Server port
PORT=3000

# MongoDB connection
MONGODB_URI=mongodb://localhost:27017/lumina-studio

# JWT secret (change in production!)
JWT_SECRET=your-secret-key-change-this-in-production

# Token expiration
JWT_EXPIRES_IN=7d

# File upload settings
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800  # 50 MB
```

---

## Common Commands

### Development
```bash
npm run start:dev      # Start with hot-reload
npm run start:debug    # Start with debugging
npm run build          # Compile TypeScript
npm run start:prod     # Start production build
```

### Docker
```bash
docker-compose up -d         # Start MongoDB
docker-compose down          # Stop MongoDB
docker-compose logs -f       # View MongoDB logs
docker exec -it lumina-mongodb mongosh  # Access MongoDB shell
```

### Database
```bash
# Connect to MongoDB
mongosh mongodb://localhost:27017/lumina-studio

# View collections
show collections

# View users
db.users.find()

# View photos
db.photos.find()

# View albums
db.albums.find()
```

---

## Troubleshooting

### ❌ Port 3000 already in use

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

Or change the port in `.env`:
```env
PORT=3001
```

### ❌ MongoDB connection failed

1. Check if Docker is running:
   ```bash
   docker ps
   ```

2. Restart MongoDB:
   ```bash
   docker-compose restart mongodb
   ```

3. Check MongoDB logs:
   ```bash
   docker logs lumina-mongodb
   ```

4. Verify connection string in `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/lumina-studio
   ```

### ❌ Sharp installation issues

Sharp requires native dependencies. If you encounter errors:

```bash
npm rebuild sharp
```

Or reinstall:
```bash
npm uninstall sharp
npm install sharp
```

### ❌ File upload fails

1. Check `uploads/` directory exists
2. Verify file size is under 50 MB
3. Ensure file is an image type (jpg, png, etc.)
4. Check file permissions on `uploads/` folder

### ❌ Authentication not working

1. Verify JWT_SECRET is set in `.env`
2. Check token format: `Authorization: Bearer <token>`
3. Ensure token hasn't expired (default: 7 days)
4. Re-login to get a fresh token

---

## Next Steps

Now that your backend is running:

### 1. Explore the API
- Read [API_REFERENCE.md](API_REFERENCE.md) for all endpoints
- Import [postman-collection.json](postman-collection.json) for easy testing

### 2. Upload Some Photos
- Use Postman or cURL to upload test photos
- Check `uploads/` folder to see stored files
- View generated thumbnails

### 3. Create Albums
- Create manual albums with specific photos
- Create smart albums with tag rules
- Photos are auto-tagged by the AI service

### 4. Test Sharing
- Generate share links for photos/albums
- Access shared resources without authentication
- Set expiration dates for links

### 5. Inspect the Database
```bash
mongosh mongodb://localhost:27017/lumina-studio

# View all users
db.users.find().pretty()

# View photos with tags
db.photos.find({}, {tags: 1, originalName: 1}).pretty()

# View smart albums
db.albums.find({isSmart: true}).pretty()
```

### 6. Check Server Logs
The development server logs all requests:
```
[HTTP] POST /api/auth/register 201 - 45ms
[HTTP] POST /api/auth/login 200 - 89ms
[HTTP] POST /api/photos/upload 201 - 234ms
[HTTP] GET /api/photos 200 - 12ms
```

---

## Development Workflow

### Typical Development Session

1. **Start services:**
   ```bash
   docker-compose up -d
   npm run start:dev
   ```

2. **Make code changes:**
   - Edit files in `src/`
   - Server auto-restarts on save
   - Check console for errors

3. **Test changes:**
   - Use Postman/cURL to test endpoints
   - Check database with mongosh
   - View server logs

4. **Stop services:**
   ```bash
   # Ctrl+C to stop server
   docker-compose down
   ```

### Code Quality

Run linting and formatting:
```bash
npm run lint        # Check code quality
npm run format      # Format code with Prettier
```

---

## Production Deployment

When ready for production:

1. **Update environment:**
   ```env
   NODE_ENV=production
   JWT_SECRET=<strong-random-secret>
   MONGODB_URI=<production-mongodb-uri>
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Start production server:**
   ```bash
   npm run start:prod
   ```

4. **Additional considerations:**
   - Use a process manager (PM2, systemd)
   - Set up HTTPS/SSL
   - Configure CORS for your frontend domain
   - Add rate limiting
   - Set up monitoring and logging
   - Use a production MongoDB cluster

---

## Getting Help

- 📖 **Full Documentation:** [README.md](README.md)
- 📋 **API Reference:** [API_REFERENCE.md](API_REFERENCE.md)
- 📊 **Project Summary:** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- 🐛 **Issues:** Check troubleshooting section above

---

## What's Next?

The backend is fully functional and production-ready. Here are some ideas for enhancement:

- 🤖 Replace mock AI with real ML models (TensorFlow.js, ONNX)
- 🔍 Add full-text search for photos
- 🗑️ Implement photo deletion
- 👤 Add user profile management
- 🎨 Add image filters/editing capabilities
- 📊 Add analytics and usage statistics
- 🔐 Add refresh tokens for better security
- 📧 Add email verification
- 🌐 Add multi-language support

---

**Happy coding! 🎉📸✨**
