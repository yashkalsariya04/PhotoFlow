# 🔗 Frontend-Backend Integration Guide

## Current Status

✅ **Backend**: Running on port 3000 (currently in use - needs restart)  
✅ **Frontend**: Ready to start  
✅ **MongoDB**: Running locally as Windows service  
✅ **Environment Files**: Created  
✅ **API Client**: Configured in `src/lib/api.ts`  
✅ **CORS**: Enabled in backend

## Quick Integration Steps

### 1. Start Backend (Terminal 1)

```powershell
# Navigate to backend
cd C:\meet-port\virtus-gt-night-drive\lumina-studio\backend

# If port 3000 is in use, kill the process:
Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Start backend
npm run start:dev
# Or using npx:
npx nest start --watch
```

**Expected Output:**
```
[Nest] LOG [NestApplication] Nest application successfully started
[Nest] LOG Application is running on: http://localhost:3000
```

### 2. Start Frontend (Terminal 2)

```powershell
# Navigate to frontend
cd C:\meet-port\virtus-gt-night-drive\lumina-studio

# Start frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/ 
  ➜  Network: use --host to expose
```

### 3. Verify Integration

Open browser to **http://localhost:5173** and test:

#### Test Authentication
1. Go to `/signup`
2. Create account:
   - Name: Test User
   - Email: test@example.com
   - Password: password123
3. Should auto-login and redirect to `/dashboard`

#### Test Event Creation
1. Click "Create Event" or go to `/events/create`
2. Fill form:
   - Title: Test Wedding
   - Date: Any date
   - Description: (optional)
3. Click "Create Event"
4. Should see access code generated (e.g., `ABC12345`)

#### Test Photo Upload
1. On event detail page, upload photos
2. Should see face detection running
3. Photos appear in gallery with face count badges

#### Test Client Portal
1. Open **new private/incognito window**
2. Go to **http://localhost:5173/client**
3. Enter the access code from your event
4. Upload a selfie
5. Enter name
6. Click "Find My Photos"
7. Should see matched photos

## API Endpoints Available

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Events (Photographer - Requires Auth)
- `POST /api/events` - Create event
- `GET /api/events` - List events
- `GET /api/events/:id` - Get event details

### Photos (Photographer - Requires Auth)
- `POST /api/photos/upload` - Upload photo (with optional eventId)
- `GET /api/photos` - List photos
- `GET /api/photos/event/:eventId` - Get event photos
- `GET /api/photos/:id/download` - Download photo
- `GET /api/photos/:id/thumbnail` - Get thumbnail

### Client Access (Public - No Auth Required)
- `GET /api/events/access/:code` - Get event by access code
- `POST /api/events/access/:code/recognize` - Upload selfie & match faces
- `GET /api/events/client/:accessId` - Get client's matched photos

## Testing with cURL

### Register User
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

### Login
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

Save the returned JWT token.

### Create Event
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d "{\"title\":\"Test Event\",\"eventDate\":\"2024-12-25T00:00:00.000Z\"}"
```

### Upload Photo
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/photos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@path/to/photo.jpg" \
  -F "eventId=EVENT_ID"
```

## Environment Configuration

### Backend (.env)
Located at `backend/.env`:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/lumina-studio
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
```

### Frontend (.env)
Located at `.env`:
```env
VITE_API_URL=https://facematrix.sonomainfotech.in/api
VITE_APP_NAME=FaceMatrix
VITE_APP_URL=http://localhost:5173
```

## Common Issues & Solutions

### Issue: Port 3000 already in use
**Solution:**
```powershell
# Kill process on port 3000
Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess | ForEach-Object { Stop-Process -Id $_ -Force }

# Or change port in backend/.env
PORT=3001
# Then update frontend .env:
VITE_API_URL=http://localhost:3001/api
```

### Issue: CORS errors in browser
**Solution:**
Backend already has CORS enabled in `main.ts`:
```typescript
app.enableCors({
  origin: true,
  credentials: true,
});
```

If still having issues, update to:
```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

### Issue: MongoDB connection error
**Solution:**
```powershell
# Check MongoDB service status
Get-Service MongoDB

# Start MongoDB if stopped
Start-Service MongoDB

# Or if using Docker (when available):
docker start lumina-mongo
```

### Issue: Cannot find module errors in backend
**Solution:**
```powershell
cd backend
npm install
```

### Issue: Frontend build errors
**Solution:**
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

## API Client Usage in Frontend

The API client is already configured in `src/lib/api.ts`. Example usage:

### In Components
```typescript
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Register
const handleSignup = async (data) => {
  try {
    await api.register({
      name: data.name,
      email: data.email,
      password: data.password,
    });
    // Token is automatically stored
    navigate('/dashboard');
  } catch (error) {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message,
    });
  }
};

// Create Event
const handleCreateEvent = async (data) => {
  const result = await api.createEvent({
    title: data.title,
    description: data.description,
    eventDate: data.eventDate.toISOString(),
  });
  console.log('Access code:', result.event.accessCode);
};

// Upload Photo
const handlePhotoUpload = async (file, eventId) => {
  const result = await api.uploadPhoto(file, eventId);
  console.log('Uploaded:', result.photo);
};

// Client Access (No Auth)
const handleClientAccess = async (accessCode, selfie, clientData) => {
  const result = await api.recognizeFace(accessCode, selfie, clientData);
  console.log('Matched photos:', result.matchedPhotoCount);
  navigate(`/client/photos/${result.clientAccess._id}`);
};
```

## Development Workflow

### Day-to-Day Development

1. **Start Backend**
   ```powershell
   cd backend
   npm run start:dev
   ```

2. **Start Frontend** (new terminal)
   ```powershell
   npm run dev
   ```

3. **Make Changes**
   - Both servers support hot reload
   - Backend: Changes trigger recompilation
   - Frontend: Changes trigger instant HMR

4. **Test Changes**
   - Frontend: https://facematrix.sonomainfotech.in
   - Backend API: https://facematrix.sonomainfotech.in/api

### Adding New Features

1. **Backend**: Create in respective module
   ```
   backend/src/events/  - Event features
   backend/src/photos/  - Photo features
   backend/src/ai/      - AI features
   ```

2. **Frontend**: Add pages/components
   ```
   src/pages/           - New pages
   src/components/      - New components
   src/lib/api.ts       - Add API methods
   ```

3. **Update Routes**: Add to `src/App.tsx`

## Next Steps

1. ✅ Start both servers
2. ✅ Create test account
3. ✅ Create test event
4. ✅ Upload test photos
5. ✅ Test client access flow
6. 📖 Read [PLATFORM_README.md](./PLATFORM_README.md) for full documentation
7. 🚀 Start building features!

## Success Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 5173
- [ ] MongoDB connected
- [ ] Can register/login
- [ ] Can create events
- [ ] Can upload photos
- [ ] Can access client portal
- [ ] Can match faces
- [ ] Can download photos

## Resources

- **Full Documentation**: [PLATFORM_README.md](./PLATFORM_README.md)
- **Setup Guide**: [QUICK_START.md](./QUICK_START.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **API Docs**: Backend README (to be created)

---

**Ready to integrate! 🚀**

If you encounter any issues, check the terminal outputs for specific error messages.
