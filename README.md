
# Semester Swap - Setup Guide

## 1. Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or Atlas URI)
- Cloudinary Account (for Image Uploads)
- Firebase Project (Authentication & Admin)

## 2. API Keys & Environment Variables

### 🟢 Backend (.env)
Create `backend/.env` with:
```properties
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/semester_swap

# Admin Email (Must match the Google Account you use to login)
ADMIN_EMAIL=your_admin_email@gmail.com
ADMIN_SECRET=your_secure_admin_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Firebase Admin SDK (Single Line JSON)
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
```

### 🔵 Frontend (.env.local)
Create `frontend/.env.local` with:
```properties
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com

# Firebase Client Config
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...
```

## 3. How to Run

### Terminal 1: Backend
```bash
cd backend
npm install
npm run dev
```

### Terminal 2: Frontend
```bash
cd frontend
npm install
npm run dev
```

## 4. Features Implemented (v2.0)

### ✅ Authentication (Firebase)
- **Google Sign-In**: Users can sign in securely with their Google account.
- **Context API**: `AuthContext` manages user session globally.
- **Protected Routes**: `/sell` and `/dashboard` redirect to login if not authenticated.

### ✅ Backend Security
- **Token Verification**: Middleware verifies Firebase ID tokens on API requests.
- **Ownership Checks**: Users can only delete their own listings.
- **Admin Middleware**: Strictly limits admin routes to the configured `ADMIN_EMAIL`.

### ✅ Admin Dashboard (`/admin`)
- **Approve/Reject**: Admins can view pending books and take action.
- **Secret Route**: Only accessible to the admin email.

## 5. Next Steps
1. **Enable Auth in Firebase Console**: Go to Authentication -> Sign-in method -> Enable Google.
2. **Verify Admin Email**: Ensure the email you log in with matches `ADMIN_EMAIL` in `.env`.
3. **Test Flow**: 
   - Login as a normal user -> List a book (`/sell`).
   - Login as admin -> Approve the book (`/admin`).
   - Verify it appears on the homepage (`/`).
