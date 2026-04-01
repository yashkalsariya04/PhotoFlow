# 📋 API Quick Reference

Base URL: `https://facematrix.sonomainfotech.in/api`

## Authentication Endpoints

### Register
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

**Response:** Save the `token` value for authenticated requests.

---

## Photos Endpoints

Set your token:
```bash
TOKEN="your-jwt-token-here"
```

### Upload Photo
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/photos/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/photo.jpg"
```

### Get All Photos
```bash
curl -X GET "https://facematrix.sonomainfotech.in/api/photos?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Photos by Tags
```bash
curl -X GET "https://facematrix.sonomainfotech.in/api/photos?tags=landscape,sunset" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Photo
```bash
curl -X GET "https://facematrix.sonomainfotech.in/api/photos/PHOTO_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Download Photo
```bash
curl -X GET "https://facematrix.sonomainfotech.in/api/photos/PHOTO_ID/download" \
  -H "Authorization: Bearer $TOKEN" \
  --output photo.jpg
```

### Get Thumbnail
```bash
curl -X GET "https://facematrix.sonomainfotech.in/api/photos/PHOTO_ID/thumbnail" \
  -H "Authorization: Bearer $TOKEN" \
  --output thumbnail.jpg
```

---

## Albums Endpoints

### Create Manual Album
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Wedding 2026",
    "isSmart": false,
    "photoIds": ["PHOTO_ID_1", "PHOTO_ID_2"]
  }'
```

### Create Smart Album
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Golden Hour Photos",
    "isSmart": true,
    "tagRules": ["golden-hour", "sunset", "sunrise"]
  }'
```

### Get All Albums
```bash
curl -X GET https://facematrix.sonomainfotech.in/api/albums \
  -H "Authorization: Bearer $TOKEN"
```

### Get Single Album
```bash
curl -X GET https://facematrix.sonomainfotech.in/api/albums/ALBUM_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Add Photos to Album
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/albums/ALBUM_ID/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "photoIds": ["PHOTO_ID_1", "PHOTO_ID_2"]
  }'
```

### Remove Photos from Album
```bash
curl -X DELETE https://facematrix.sonomainfotech.in/api/albums/ALBUM_ID/photos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "photoIds": ["PHOTO_ID_1"]
  }'
```

---

## Sharing Endpoints

### Share a Photo
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/share/photo/PHOTO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "expiresInDays": 30
  }'
```

**Response:** Returns a `token` that can be used in the public URL.

### Share an Album
```bash
curl -X POST https://facematrix.sonomainfotech.in/api/share/album/ALBUM_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "expiresInDays": 7
  }'
```

### Access Shared Resource (Public - No Auth)
```bash
curl -X GET https://facematrix.sonomainfotech.in/api/share/SHARE_TOKEN
```

### Get All My Shared Links
```bash
curl -X GET https://facematrix.sonomainfotech.in/api/share \
  -H "Authorization: Bearer $TOKEN"
```

### Delete Shared Link
```bash
curl -X DELETE https://facematrix.sonomainfotech.in/api/share/LINK_ID \
  -H "Authorization: Bearer $TOKEN"
```

---

## Common AI Tags

The mock AI service generates tags from these categories:

**Subjects:** portrait, landscape, architecture, nature, wildlife, street, macro

**Settings:** indoor, outdoor, studio, urban, rural

**Lighting:** natural-light, artificial-light, golden-hour, blue-hour, night

**Events:** wedding, event, concert, sports, party

**Style:** documentary, artistic, commercial, editorial, fine-art

**Colors:** vibrant, monochrome, warm-tones, cool-tones, high-contrast

**Composition:** rule-of-thirds, symmetrical, minimal, busy, centered

**Orientation:** landscape-orientation, portrait-orientation, square

---

## Response Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `500` - Internal Server Error

---

## Workflow Example

1. **Register & Login**
   ```bash
   # Register
   curl -X POST https://facematrix.sonomainfotech.in/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Jane","email":"jane@test.com","password":"pass1234"}'
   
   # Login (save the token)
   curl -X POST https://facematrix.sonomainfotech.in/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"jane@test.com","password":"pass1234"}'
   ```

2. **Upload Photos**
   ```bash
   TOKEN="eyJhbGc..."  # From login response
   
   curl -X POST https://facematrix.sonomainfotech.in/api/photos/upload \
     -H "Authorization: Bearer $TOKEN" \
     -F "file=@sunset.jpg"
   
   # Note the photo ID from response
   ```

3. **Create Smart Album**
   ```bash
   curl -X POST https://facematrix.sonomainfotech.in/api/albums \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"title":"Sunsets","isSmart":true,"tagRules":["sunset","golden-hour"]}'
   ```

4. **Share Album**
   ```bash
   curl -X POST https://facematrix.sonomainfotech.in/api/share/album/ALBUM_ID \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"expiresInDays":30}'
   
   # Share the token URL with anyone
   ```

5. **Access Shared Album (No Auth)**
   ```bash
   curl -X GET https://facematrix.sonomainfotech.in/api/share/SHARE_TOKEN
   ```

---

## Tips

- **Save your token:** Store it in an environment variable for easier testing
- **Use jq for JSON:** Pipe responses through `jq` for pretty printing
- **Postman:** Import `postman-collection.json` for GUI testing
- **Check logs:** Server logs show all requests in real-time
- **MongoDB:** Use `mongosh` to inspect the database directly

---

**Happy Testing! 🚀**
