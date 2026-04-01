# 🚀 Production Deployment Checklist

## Pre-Deployment

### Security

- [ ] Change `JWT_SECRET` to a strong random value
  ```bash
  # Generate secure secret
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- [ ] Update CORS origins in backend
- [ ] Enable rate limiting
- [ ] Set secure cookie flags
- [ ] Review file upload limits
- [ ] Enable HTTPS/SSL
- [ ] Set secure headers (helmet.js)
- [ ] Sanitize user inputs
- [ ] Review MongoDB indexes
- [ ] Enable MongoDB authentication

### Environment Variables

**Backend (.env.production)**
```env
NODE_ENV=production
PORT=3000

# Database - Use managed MongoDB (Atlas, etc.)
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/lumina-studio

# Authentication
JWT_SECRET=<your-generated-64-char-hex-string>
JWT_EXPIRES_IN=7d

# Upload
UPLOAD_DIR=./uploads  # or S3 bucket path
MAX_FILE_SIZE=10485760

# Optional: Cloud Storage
AWS_REGION=us-east-1
AWS_S3_BUCKET=lumina-photos
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

**Frontend (.env.production)**
```env
VITE_API_URL=https://api.yourdomain.com/api
VITE_APP_NAME=PhotoFlow
VITE_APP_URL=https://yourdomain.com
```

### Code Quality

- [ ] Run linter: `bun run lint`
- [ ] Fix TypeScript errors
- [ ] Remove console.logs
- [ ] Remove TODO comments or track them
- [ ] Review error handling
- [ ] Add logging (Winston, Pino)
- [ ] Test all critical paths

### Database

- [ ] Set up production MongoDB (MongoDB Atlas recommended)
- [ ] Create database backup strategy
- [ ] Set up indexes:
  ```javascript
  // Events
  db.events.createIndex({ photographerId: 1, createdAt: -1 })
  db.events.createIndex({ accessCode: 1 }, { unique: true })
  
  // Photos
  db.photos.createIndex({ userId: 1, uploadedAt: -1 })
  db.photos.createIndex({ eventId: 1, createdAt: -1 })
  db.photos.createIndex({ faceCount: 1 })
  
  // ClientAccess
  db.clientaccesses.createIndex({ eventId: 1, createdAt: -1 })
  ```
- [ ] Configure retention policies
- [ ] Set up monitoring/alerts

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel)**
1. Connect GitHub repository
2. Select frontend directory
3. Build command: `bun run build`
4. Output directory: `dist`
5. Add environment variables
6. Deploy

**Backend (Railway)**
1. New project → Deploy from GitHub
2. Select backend directory
3. Add MongoDB service or connect external
4. Add environment variables
5. Deploy

### Option 2: AWS

**Frontend (S3 + CloudFront)**
```bash
# Build
bun run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

**Backend (EC2 or ECS)**
```bash
# Build
cd backend
bun run build

# Docker
docker build -t lumina-backend .
docker push your-registry/lumina-backend:latest

# Deploy to ECS/EKS
```

**Database**
- Use MongoDB Atlas
- Or self-hosted on EC2 with backups

### Option 3: DigitalOcean

**App Platform**
1. Create new app
2. Link GitHub repository
3. Configure components:
   - Frontend: Static Site
   - Backend: Web Service
   - Database: Managed MongoDB
4. Add environment variables
5. Deploy

### Option 4: Self-Hosted (VPS)

**Server Setup (Ubuntu 22.04)**
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Bun
curl -fsSL https://bun.sh/install | bash

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# Install Nginx
sudo apt-get install -y nginx

# Install PM2
sudo npm install -g pm2
```

**Backend Deployment**
```bash
# Clone repository
git clone <your-repo>
cd lumina-studio/backend

# Install dependencies
bun install

# Build
bun run build

# Start with PM2
pm2 start dist/main.js --name lumina-backend
pm2 save
pm2 startup
```

**Frontend Deployment**
```bash
cd lumina-studio
bun install
bun run build

# Copy to Nginx
sudo cp -r dist/* /var/www/lumina-studio/
```

**Nginx Configuration**
```nginx
# /etc/nginx/sites-available/lumina-studio
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/lumina-studio;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/lumina-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**SSL with Let's Encrypt**
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Post-Deployment

### Monitoring

- [ ] Set up application monitoring (Sentry, LogRocket)
- [ ] Set up server monitoring (Datadog, New Relic)
- [ ] Configure error tracking
- [ ] Set up uptime monitoring (Uptime Robot)
- [ ] Configure MongoDB monitoring
- [ ] Set up log aggregation
- [ ] Create health check endpoint

### Performance

- [ ] Enable gzip compression
- [ ] Configure CDN for static assets
- [ ] Optimize images (WebP, compression)
- [ ] Enable browser caching
- [ ] Implement Redis caching (optional)
- [ ] Database query optimization
- [ ] Load testing (k6, Artillery)

### Backup & Recovery

- [ ] Automated database backups (daily)
- [ ] Test backup restoration
- [ ] Photo storage backup (if local)
- [ ] Document recovery procedures
- [ ] Set up disaster recovery plan

### Documentation

- [ ] Document deployment process
- [ ] Create runbook for common issues
- [ ] Document environment variables
- [ ] API documentation (Swagger)
- [ ] User guides
- [ ] Admin documentation

### Testing

- [ ] Smoke tests on production
- [ ] Test all user workflows
- [ ] Test payment integration (if added)
- [ ] Test email notifications (if added)
- [ ] Load testing
- [ ] Security testing
- [ ] Mobile responsiveness

## Domain & DNS

- [ ] Purchase domain
- [ ] Configure DNS:
  ```
  A     @              → Your server IP
  A     www            → Your server IP
  A     api            → Your backend IP
  CNAME www            → yourdomain.com
  ```
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Test domain access

## Cloud Storage (Recommended)

### AWS S3 Integration

Update `backend/src/photos/photos.service.ts`:

```typescript
import { S3 } from 'aws-sdk';

const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Upload to S3 instead of local filesystem
await s3.upload({
  Bucket: process.env.AWS_S3_BUCKET,
  Key: `photos/${userId}/${filename}`,
  Body: file.buffer,
  ContentType: file.mimetype,
}).promise();
```

## ML Integration (Future)

When ready to add real facial recognition:

1. **Choose ML Service**
   - AWS Rekognition
   - Azure Face API
   - Google Cloud Vision
   - Self-hosted (face-api.js, InsightFace)

2. **Update Service**
   ```typescript
   // backend/src/ai/face-recognition.service.ts
   async detectFaces(imageBuffer: Buffer) {
     // Replace mock with real ML API call
     const result = await mlService.detectFaces(imageBuffer);
     return {
       faceCount: result.faces.length,
       faces: result.faces.map(face => ({
         boundingBox: face.boundingBox,
         embedding: face.embedding,
         confidence: face.confidence,
       })),
     };
   }
   ```

3. **Test Thoroughly**
   - Accuracy testing
   - Performance testing
   - Edge cases (no face, multiple faces)
   - Privacy compliance

## Compliance & Legal

- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if CA users)
- [ ] Cookie consent
- [ ] Data retention policy
- [ ] User data deletion
- [ ] Photo rights management

## Cost Optimization

- [ ] Review cloud resource usage
- [ ] Optimize database queries
- [ ] Implement image compression
- [ ] Use CDN for assets
- [ ] Monitor API usage
- [ ] Set up billing alerts
- [ ] Consider reserved instances (AWS)

## Launch

### Soft Launch
1. Deploy to production
2. Test with small group
3. Gather feedback
4. Fix critical issues
5. Monitor performance

### Public Launch
1. Marketing website updates
2. Social media announcement
3. Email existing users
4. Press release (if applicable)
5. Monitor traffic and errors
6. Be ready for support requests

## Maintenance

### Daily
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Review user issues

### Weekly
- [ ] Database backup verification
- [ ] Performance review
- [ ] Security updates

### Monthly
- [ ] Dependency updates
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review

## Rollback Plan

Have a rollback strategy:

1. **Git Tags**: Tag stable releases
   ```bash
   git tag -a v1.0.0 -m "Production release 1.0.0"
   git push origin v1.0.0
   ```

2. **Database Backups**: Before schema changes

3. **Quick Rollback**:
   ```bash
   git checkout v1.0.0
   bun install
   bun run build
   pm2 restart lumina-backend
   ```

## Success Metrics

Track these KPIs:

- [ ] Uptime (target: 99.9%)
- [ ] Response time (target: < 200ms)
- [ ] Error rate (target: < 0.1%)
- [ ] User registrations
- [ ] Events created
- [ ] Photos uploaded
- [ ] Client accesses
- [ ] Photo downloads

## Support

Set up support channels:

- [ ] Email: support@yourdomain.com
- [ ] Documentation site
- [ ] FAQ page
- [ ] Help center
- [ ] Community forum (optional)
- [ ] Live chat (optional)

---

**Ready for production! 🚀**

Remember: Start small, test thoroughly, scale gradually.
