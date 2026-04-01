# 🚀 Quick Start Guide

Get PhotoFlow running in 5 minutes!

## Prerequisites

Make sure you have installed:
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Bun** ([Install](https://bun.sh/)): `curl -fsSL https://bun.sh/install | bash`
- **Docker** ([Download](https://www.docker.com/)) - for MongoDB

## Step 1: Start MongoDB

```bash
docker run -d -p 27017:27017 --name lumina-mongo mongo:7.0
```

Verify it's running:
```bash
docker ps
```

## Step 2: Setup Backend

```bash
# Navigate to backend
cd backend

# Install dependencies
bun install

# Create environment file
cp .env.example .env

# Edit .env if needed (default values should work)
# MongoDB URI: mongodb://localhost:27017/lumina-studio
# JWT Secret: Change in production!

# Start backend in development mode
bun run start:dev
```

Backend will start on **http://localhost:3000**

You should see:
```
[Nest] LOG [NestApplication] Nest application successfully started +2ms
[Nest] LOG Application is running on: http://localhost:3000
```

## Step 3: Setup Frontend

Open a **new terminal** window:

```bash
# Navigate to frontend (from project root)
cd lumina-studio

# Install dependencies  
bun install

# Create environment file
cp .env.example .env

# Start development server
bun run dev
```

Frontend will start on **https://PhotoFlow.sonomainfotech.in**

## Step 4: Create Your First Account

1. Open **https://PhotoFlow.sonomainfotech.in** in your browser
2. Click **"Get Started"** or navigate to `/signup`
3. Fill in:
   - Name: `Test Photographer`
   - Email: `test@example.com`
   - Password: `password123`
4. Click **"Sign Up"**

You'll be automatically logged in!

## Step 5: Create Your First Event

1. In the dashboard, click **"Create Event"** or navigate to `/events/create`
2. Fill in:
   - **Event Title**: `Sample Wedding`
   - **Event Date**: Select any date
   - **Description** (optional): `Test event for demo`
3. Click **"Create Event"**

✅ You'll see a unique access code generated (e.g., `ABC12345`)

## Step 6: Upload Photos

1. On the event detail page, drag and drop photos into the upload area
2. Or click to browse and select multiple photos
3. AI will automatically detect faces in each photo
4. Watch the face count badge appear on photos

## Step 7: Test Client Access

1. Copy the access code from your event
2. Open a **private/incognito browser window** (or just a new tab)
3. Navigate to **https://PhotoFlow.sonomainfotech.in/client**
4. Enter the access code
5. Upload a selfie (any photo with a face will work for testing)
6. Enter your name and click **"Find My Photos"**

🎉 You'll see all matched photos!

## Quick Commands Reference

### Backend

```bash
# Start development
bun run start:dev

# Build for production
bun run build

# Start production
bun run start:prod

# Run tests (when added)
bun run test
```

### Frontend

```bash
# Start development
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Lint code
bun run lint
```

### MongoDB

```bash
# Start MongoDB
docker start lumina-mongo

# Stop MongoDB
docker stop lumina-mongo

# View logs
docker logs lumina-mongo

# MongoDB shell access
docker exec -it lumina-mongo mongosh
```

## Troubleshooting

### Backend won't start

**Error:** `MongoServerError: connect ECONNREFUSED`
- **Solution:** Make sure MongoDB is running: `docker ps`

**Error:** `Port 3000 already in use`
- **Solution:** Change PORT in `backend/.env` to 3001 or kill the process

### Frontend won't start

**Error:** `EADDRINUSE: address already in use ::5173`
- **Solution:** Change port in `vite.config.ts` or kill the process

**Error:** `Cannot connect to API`
- **Solution:** Verify backend is running on http://localhost:3000
- Check `VITE_API_URL` in frontend `.env`

### Photos not uploading

**Error:** `ENOENT: no such file or directory`
- **Solution:** Check `UPLOAD_DIR` exists or will be created
- Default is `./uploads` in backend directory

### Facial recognition not working

**Note:** This is expected! The current implementation is a **mock service**. It generates random embeddings and similarity scores. To see matches:
- Upload multiple photos to an event
- Use any selfie - the mock will find "matches"
- Check [PLATFORM_README.md](./PLATFORM_README.md) for real ML integration guide

## Environment Variables

### Backend (.env)

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/lumina-studio

# Authentication
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760  # 10MB
```

### Frontend (.env)

```bash
VITE_API_URL=https://PhotoFlow.sonomainfotech.in/api
VITE_APP_NAME=PhotoFlow
VITE_APP_URL=https://PhotoFlow.sonomainfotech.in
```

## Default Test Data

After signup, you can use these credentials:

```
Email: test@example.com
Password: password123
```

## API Testing

You can test API endpoints with curl:

```bash
# Register
curl -X POST https://PhotoFlow.sonomainfotech.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'

# Login
curl -X POST https://PhotoFlow.sonomainfotech.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create event (replace TOKEN)
curl -X POST https://PhotoFlow.sonomainfotech.in/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Test Event","eventDate":"2024-12-25T00:00:00.000Z"}'
```

## Next Steps

- ✅ Read [PLATFORM_README.md](./PLATFORM_README.md) for full documentation
- ✅ Explore all pages: Events, Upload, Albums, Gallery, Settings
- ✅ Test the client portal workflow
- ✅ Try uploading different types of photos
- ✅ Check facial recognition results
- ✅ Customize the UI colors and branding

## Common Development Tasks

### Reset Database

```bash
# Stop and remove MongoDB container
docker stop lumina-mongo
docker rm lumina-mongo

# Start fresh MongoDB
docker run -d -p 27017:27017 --name lumina-mongo mongo:7.0
```

### Clear Uploads

```bash
cd backend
rm -rf uploads/*
```

### Reset Frontend State

```bash
# Clear browser localStorage
# Open browser console and run:
localStorage.clear()

# Then refresh the page
```

## Getting Help

- **GitHub Issues**: [Report bugs or request features]
- **Documentation**: See [PLATFORM_README.md](./PLATFORM_README.md)
- **Code Comments**: Check inline documentation in source files

## Development Tips

1. **Hot Reload**: Both frontend and backend support hot reload
2. **TypeScript**: Use TypeScript for type safety
3. **VS Code**: Recommended for best development experience
4. **Extensions**:
   - ESLint
   - Prettier
   - Tailwind CSS IntelliSense
   - MongoDB for VS Code

---

**Happy coding! 🎨📸**

Need help? Check [PLATFORM_README.md](./PLATFORM_README.md) for detailed information.
