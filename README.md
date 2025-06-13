# SwipeConnect

A modern job-finding mobile app with a swipe interface for job applications, LinkedIn integration, and a beautiful UI.

## Features

- Swipe interface for job applications (like Tinder)
- LinkedIn OAuth authentication
- Job details view with company information
- Save jobs for later
- User profile with preferences
- Real-time job matching
- Modern and intuitive UI

## Tech Stack

### Frontend
- React Native
- TypeScript
- React Navigation
- React Native Gesture Handler
- React Native Reanimated
- Axios for API calls
- AsyncStorage for local storage

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- Passport.js for authentication
- LinkedIn OAuth integration
- Job scraping functionality

## Project Structure

```
swipe-connect/
├── frontend/               # React Native app
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── navigation/    # Navigation setup
│   │   ├── services/      # API services
│   │   └── components/    # Reusable components
│   └── package.json
│
└── backend/               # Node.js server
    ├── src/
    │   ├── controllers/  # Route controllers
    │   ├── models/       # Database models
    │   ├── routes/       # API routes
    │   ├── services/     # Business logic
    │   └── server.ts     # Entry point
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- React Native development environment setup
- LinkedIn Developer account for OAuth

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/swipe-connect.git
   cd swipe-connect
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

4. Set up environment variables:
   - Create `.env` file in the backend directory
   - Add the following variables:
     ```
     MONGODB_URI=your_mongodb_uri
     LINKEDIN_CLIENT_ID=your_linkedin_client_id
     LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
     JWT_SECRET=your_jwt_secret
     ```

### Running the App

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend app:
   ```bash
   cd frontend
   npm run android  # for Android
   # or
   npm run ios     # for iOS
   ```

## API Endpoints

### Authentication
- `GET /auth/linkedin` - LinkedIn OAuth login
- `GET /auth/linkedin/callback` - LinkedIn OAuth callback

### Jobs
- `GET /jobs` - Get job listings
- `POST /jobs/:id/save` - Save a job
- `POST /jobs/:id/swipe` - Swipe on a job (like/dislike)
- `GET /jobs/saved` - Get saved jobs

### User
- `GET /user/profile` - Get user profile
- `PUT /user/preferences` - Update user preferences

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- LinkedIn API for authentication
- React Native community for amazing tools and libraries
- All contributors who help improve the project 