# Student Stress Level Checker

A web application that collects student stress assessment responses from a Google Form, analyzes stress levels, and provides personalized support through an AI chatbot, mood-based music therapy, and curated articles.

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Java Spring Boot
- **Database:** MongoDB Atlas
- **AI Chatbot:** Google Gemini API
- **Music:** Freesound API
- **Data Source:** Google Sheets (via Google Sheets API)

## Features

- Student stress level assessment (synced from Google Sheets)
- AI-powered chatbot for mental health support
- Mood-based music recommendations
- Curated wellness articles
- Admin dashboard for monitoring student data

## Prerequisites

- **Java 17+** (ensure `JAVA_HOME` is set)
- **Node.js** v16+
- MongoDB Atlas account
- Google Cloud service account with Sheets API access
- Gemini API key
- Freesound API key

## Configuration

Before running the backend, copy the example config and fill in your credentials:

```bash
cp backend/src/main/resources/application.properties.example backend/src/main/resources/application.properties
```

Edit `application.properties` with your actual values. Also create a `.env` file in the `backend/` directory with:

```
FREESOUND_API_KEY=your_freesound_api_key
```

Place your Google service account JSON key file in the `backend/` directory.

## Running the Project

You will need two terminal windows.

### 1. Start the Backend (Java Spring Boot)

```powershell
cd backend
.\run.ps1
```

> Alternatively, if Maven is installed: `mvn spring-boot:run`

- Server runs on: `http://localhost:5000`

### 2. Start the Frontend (React)

```bash
cd frontend
npm install
npm run dev
```

- App runs on: `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sync-responses` | Sync data from Google Sheets to MongoDB |
| POST | `/api/chat` | Send a message to the AI chatbot |
| GET | `/api/user-data?email=` | Get stress data for a user |
| GET | `/api/music?stressLevel=` | Get music recommendations |
| GET | `/api/articles` | Get wellness articles |
| POST | `/api/insights` | Get AI-generated insights for a user |
| GET | `/api/chat-history?email=` | Get chat history for a user |
