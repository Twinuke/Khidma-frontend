# Khidma React Native Frontend

A React Native mobile application built with Expo for the Khidma backend.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (will be installed automatically)
- For iOS: Xcode (Mac only)
- For Android: Android Studio

## Installation

1. Install dependencies:
```bash
npm install
```

2. Update the API URL in `src/config/api.ts`:
   - Replace `http://localhost:3000/api` with your backend URL
   - For Android emulator, use `http://10.0.2.2:PORT/api` instead of `localhost`
   - For iOS simulator, `localhost` works fine
   - For physical devices, use your computer's IP address (e.g., `http://192.168.1.100:3000/api`)

## Running the App

### Start the development server:
```bash
npm start
```

### Run on specific platform:
```bash
# iOS Simulator (Mac only)
npm run ios

# Android Emulator
npm run android

# Web Browser
npm run web
```

## Project Structure

```
├── App.tsx                 # Main app component with navigation
├── index.js                # Entry point
├── src/
│   ├── config/
│   │   └── api.ts          # API configuration and axios setup
│   └── pages/
│       ├── Login.tsx       # Login page
│       └── Home.tsx        # Home page (after login)
```

## Backend Integration

The app is configured to connect to your backend API. Make sure to:

1. Update the `API_BASE_URL` in `src/config/api.ts`
2. Ensure your backend CORS settings allow requests from your app
3. The login endpoint is expected at `/auth/login` - update if different

## Next Steps

- Implement token storage (AsyncStorage or Expo SecureStore)
- Add more screens and navigation
- Customize the login page styling
- Add form validation
- Implement error handling

## Troubleshooting

- **Connection issues**: Make sure your backend is running and accessible
- **Android localhost**: Use `10.0.2.2` instead of `localhost` for Android emulator
- **iOS localhost**: Use `localhost` or your computer's IP address
