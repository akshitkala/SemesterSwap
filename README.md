# Semester Swap - Setup Guide

## 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas URI)
- Cloudinary Account (for Image Uploads)
- Firebase Project (for Auth - Phase 2)

## 2. API Keys & Environment Variables

You need to create `.env` files in both `backend/` and `frontend/` folders.

### 🟢 Backend (.env)
Create `backend/.env` with:
```properties
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/semester_swap
ADMIN_SECRET=your_secure_admin_key_here

# Image Uploads (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Authentication (Phase 2 - Sellers)
FIREBASE_SERVICE_ACCOUNT_PATH=./config/serviceAccountKey.json
```
**Important:** You must download `serviceAccountKey.json` from Firebase Console and place it in `backend/config/`.

### 🔵 Frontend (.env.local)
Create `frontend/.env.local` with:
```properties
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 3. How to Run

You need **two** terminal windows running simultaneously.

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```
> Server will start on `http://localhost:5000`

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```
> App will start on `http://localhost:3000`

## 4. Testing
1. Visit `http://localhost:3000` to see the homepage.
2. Visit `http://localhost:5000/health` to check backend status.
