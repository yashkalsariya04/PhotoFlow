# PhotoFlow - Event Photo Delivery Platform

A modern, AI-powered photography platform that helps photographers deliver event photos to clients using facial recognition technology.

## 🌟 Overview

PhotoFlow transforms how photographers share event photos with clients. Upload photos from any event (weddings, corporate events, parties), and clients can instantly find their photos by uploading a selfie. Our AI-powered facial recognition matches faces across all event photos automatically.

### Key Features

- **Event Management**: Create and organize photography events with unique access codes
- **AI Facial Recognition**: Automatic face detection and matching using embeddings
- **Client Self-Service**: Clients find their photos with just a selfie - no login required
- **Photographer Dashboard**: Comprehensive event and photo management interface
- **Secure Access**: Event-based access codes for privacy and security
- **Batch Upload**: Upload multiple photos at once with automatic face detection
- **Photo Download**: Clients can select and download their matched photos

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for blazing-fast development
- TailwindCSS + shadcn/ui for beautiful UI components
- React Router for navigation
- Framer Motion for animations
- React Query for data fetching

**Backend:**
- Node.js + TypeScript
- NestJS framework
- MongoDB with Mongoose ODM
- JWT authentication
- Sharp for image processing
- Local filesystem storage

### Project Structure

```
lumina-studio/
├── src/
│   ├── components/
│   │   ├── dashboard/          # Dashboard widgets
│   │   ├── landing/            # Landing page sections
│   │   ├── layout/             # Layout components
│   │   └── ui/                 # shadcn/ui components
│   ├── pages/
│   │   ├── Dashboard.tsx       # Photographer dashboard
│   │   ├── Events.tsx          # Event list
│   │   ├── CreateEvent.tsx     # Event creation
│   │   ├── EventDetail.tsx     # Event management
│   │   ├── ClientPortal.tsx    # Client access code entry
│   │   ├── ClientEventAccess.tsx # Selfie upload
│   │   └── ClientPhotos.tsx    # Matched photos gallery
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   └── utils.ts            # Utilities
│   └── App.tsx                 # Route configuration
│
backend/
├── src/
│   ├── events/                 # Event management module
│   │   ├── schemas/
│   │   │   ├── event.schema.ts
│   │   │   └── client-access.schema.ts
│   │   ├── events.service.ts
│   │   └── events.controller.ts
│   ├── photos/                 # Photo management module
│   ├── ai/                     # AI services
│   │   ├── ai.service.ts       # AI tagging
│   │   └── face-recognition.service.ts
│   ├── auth/                   # Authentication
│   └── users/                  # User management
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Bun (recommended) or npm/yarn
- MongoDB 7.0 (via Docker recommended)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd lumina-studio
```

2. **Install frontend dependencies**
```bash
bun install
```

3. **Install backend dependencies**
```bash
cd backend
bun install
```

4. **Set up environment variables**

Frontend (.env):
```env
VITE_API_URL=https://PhotoFlow.in/api
VITE_APP_NAME=PhotoFlow
VITE_APP_URL=https://PhotoFlow.in
```

Backend (backend/.env):
```env
# Server
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/lumina-studio

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

5. **Start MongoDB**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

6. **Start the backend**
```bash
cd backend
bun run start:dev
```

7. **Start the frontend**
```bash
bun run dev
```

Visit https://PhotoFlow.in for the frontend and https://PhotoFlow.in/api for the backend.

## 📖 User Workflows

### Photographer Workflow

1. **Create Account**: Sign up at `/signup`
2. **Create Event**: Navigate to `/events/create`
   - Enter event title (e.g., "Smith Wedding 2024")
   - Add description (optional)
   - Select event date
   - System generates unique 8-character access code
3. **Upload Photos**: Go to event detail page
   - Upload multiple photos via drag-and-drop
   - AI automatically detects faces and generates embeddings
   - Track face count per photo
4. **Share Access**: Copy access code or direct client link
   - Share with all event attendees
   - Monitor client access count

### Client Workflow

1. **Access Event**: Visit `/client` or use direct link
   - Enter 8-character access code from photographer
2. **Upload Selfie**: On event page
   - Take selfie or upload photo
   - Enter name (required) and contact info (optional)
3. **View Matched Photos**: Automatically redirected to results
   - See all photos featuring their face
   - View match confidence (future feature)
4. **Download**: Select photos and download
   - Individual or batch download
   - Original quality

## 🔧 API Endpoints

### Events (Photographer - Requires Auth)

```
POST   /api/events                    # Create event
GET    /api/events                    # List all events
GET    /api/events/:id                # Get event details
```

### Client Access (Public - No Auth)

```
GET    /api/events/access/:code              # Get event by access code
POST   /api/events/access/:code/recognize    # Upload selfie, match faces
GET    /api/events/client/:accessId          # Get client's matched photos
```

### Photos (Photographer - Requires Auth)

```
POST   /api/photos/upload             # Upload photo (with eventId)
GET    /api/photos/event/:eventId     # Get all event photos
GET    /api/photos/:id/download       # Download original
GET    /api/photos/:id/thumbnail      # Get thumbnail
```

### Authentication

```
POST   /api/auth/register             # Create account
POST   /api/auth/login                # Login
```

## 🤖 Facial Recognition

### Current Implementation (Mock)

The facial recognition system is currently implemented as a **mock service** designed to be easily replaced with real ML models:

**Face Detection:**
- Generates 128-dimensional embedding vectors (normalized)
- Simulates 1-3 faces per photo based on file size
- Creates bounding boxes for each detected face
- Assigns confidence scores (0.85-0.95)

**Matching Algorithm:**
- Cosine similarity between embeddings
- Default threshold: 0.6 (configurable)
- Returns photos sorted by similarity score

### Replacing with Real ML

To integrate real facial recognition (e.g., FaceNet, ArcFace, InsightFace):

1. Update `backend/src/ai/face-recognition.service.ts`
2. Replace mock implementations in:
   - `detectFaces()`: Use actual face detection model
   - `generateFaceEmbedding()`: Use actual embedding model
3. Keep the same interface and data structures
4. Embeddings are stored as `number[]` in MongoDB

Example integration points:
```typescript
// Current mock
async detectFaces(imageBuffer: Buffer) {
  // TODO: Replace with actual ML model
  // Example: Use @vladmandic/face-api or similar
}

// Interface to maintain
interface FaceEmbedding {
  boundingBox: { x: number; y: number; width: number; height: number };
  embedding: number[];  // 128-dimensional vector
  confidence: number;   // 0-1 score
}
```

## 📊 Database Schema

### Event Schema
```typescript
{
  photographerId: ObjectId,
  title: string,
  description?: string,
  eventDate: Date,
  accessCode: string,        // Unique 8-char code
  photoCount: number,
  clientAccessCount: number,
  isActive: boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### ClientAccess Schema
```typescript
{
  eventId: ObjectId,
  clientName: string,
  clientEmail?: string,
  clientPhone?: string,
  faceEmbedding: {
    embedding: number[],     // 128-dim vector
    confidence: number
  },
  matchedPhotoIds: ObjectId[],
  matchedPhotoCount: number,
  createdAt: Date
}
```

### Photo Schema
```typescript
{
  userId: ObjectId,
  eventId?: ObjectId,
  filename: string,
  path: string,
  thumbnailPath: string,
  metadata: {
    size: number,
    mimeType: string,
    width: number,
    height: number,
    takenAt?: Date
  },
  faceEmbeddings: [{
    boundingBox: { x, y, width, height },
    embedding: number[],
    confidence: number
  }],
  faceCount: number,
  aiTags: string[],
  uploadedAt: Date
}
```

## 🔐 Security Features

- JWT-based authentication for photographers
- Event-based access control via unique codes
- No client authentication required (by design)
- MongoDB injection protection via Mongoose
- File upload size limits (10MB default)
- CORS configuration
- Input validation with Zod schemas

## 🎨 UI Components

Built with **shadcn/ui** components:
- Forms: Input, Textarea, Select, Calendar, DatePicker
- Data Display: Card, Badge, Table, Tabs
- Feedback: Alert, Toast, Dialog, Skeleton
- Navigation: Sidebar, Breadcrumb, Pagination
- Media: Avatar, AspectRatio, Carousel

## 📱 Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly interfaces
- Optimized image loading

## 🧪 Testing (Future)

Planned testing infrastructure:
- Unit tests: Jest + React Testing Library
- E2E tests: Playwright
- API tests: Supertest
- Component tests: Storybook

## 🚀 Deployment

### Frontend (Vercel/Netlify)

```bash
bun run build
# Deploy ./dist folder
```

Environment variables to set:
- `VITE_API_URL`: Your backend API URL

### Backend (Railway/Render/AWS)

```bash
cd backend
bun run build
bun run start:prod
```

Environment variables required:
- All variables from backend/.env
- `MONGODB_URI`: Production MongoDB connection string
- `JWT_SECRET`: Strong secret key for production


Backend .env file
Application
NODE_ENV=development
PORT=3000

Database
MONGODB_URI=mongodb://localhost:27017/lumina-studio

JWT
JWT_SECRET=your-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=52428800
STORAGE_LIMIT_GB=10
MODELS_PATH=./models

SMTP / Email (for sending new user passwords)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=@gmail.com
SMTP_PASS= app password
SMTP_FROM=@gmail.com

GEMINI_API_KEY=AIzaSyAtCUvt1HHGpdnZ-EFiTn3tSrHxIgnkRuA
HUGGINGFACE_API_KEY=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
REPLICATE_API_KEY=r8_FHBRIQYzbLPtvr0FgGWJXYphCknRqcY1eAJKA

Frontend .env file
API Configuration
VITE_API_URL=https://photoflow.sonomainfotech.in/api

Application
VITE_APP_NAME=PhotoFlow
VITE_APP_URL=https://photoflow.sonomainfotech.in

API Configuration
VITE_API_URL=http://localhost:3000/api

Application
VITE_APP_NAME=Lumina Studio
VITE_APP_URL=http://localhost:5173

## 📈 Future Enhancements

- [ ] Real ML facial recognition integration
- [ ] Multiple face recognition per client
- [ ] Client photo favorites and collections
- [ ] Photographer watermarking options
- [ ] Photo editing and filters
- [ ] Event analytics dashboard
- [ ] Email notifications
- [ ] Payment integration for photo purchases
- [ ] Social media sharing
- [ ] Mobile apps (React Native)

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Lucide Icons](https://lucide.dev/) for icons
- [Unsplash](https://unsplash.com/) for stock photos
- [NestJS](https://nestjs.com/) for backend framework

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue]
- Email: support@luminastudio.com (placeholder)

---

**Built with ❤️ for photographers and their clients**

