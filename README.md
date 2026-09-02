# AI Study Assistant

AI Study Assistant is a full-stack web application designed to help students study smarter. Students can upload notes, extract text from documents, track their progress, and practice with AI-powered quiz generation to reinforce learning.

## Features

- User authentication with registration and login
- Upload study notes and documents
- Extract text from uploaded files
- AI-assisted quiz generation based on notes
- Progress tracking dashboard
- Responsive React frontend and Express backend

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB
- Authentication: JWT + bcrypt
- File handling: Multer + PDF parsing

## Prerequisites

Before running the project, make sure you have:

- Node.js installed (v18 or newer recommended)
- MongoDB installed and running locally
- npm package manager

## Project Structure

- client/ — React frontend
- server/ — Express API and MongoDB models
- README.md — project documentation

## How to Run the Project

### 1. Start MongoDB

Make sure MongoDB is running on your machine.

Example local connection:

- Host: 127.0.0.1
- Port: 27017
- Database: ai_study_assistant

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Start the backend server

```bash
cd server
npm start
```

The backend will run on:

- http://localhost:5000

### 4. Install frontend dependencies

```bash
cd client
npm install
```

### 5. Start the frontend

```bash
cd client
npm run dev -- --host 0.0.0.0
```

The frontend will run on:

- http://localhost:5173

## Default Login Credentials

A demo account is already available for quick access:

- Email: demo@studyassistant.com
- Password: Demo@123

You can also create a new account from the registration page if needed.

## Useful Notes

- The backend expects MongoDB to be available on the default local URL:
  - mongodb://127.0.0.1:27017/ai_study_assistant
- If you are using a custom environment configuration, update the values in the server .env file before running the app.

## Typical User Flow

1. Register or log in
2. Upload notes in the dashboard
3. View extracted content and study materials
4. Generate quizzes based on notes
5. Track learning progress

## License

This project is for educational and learning purposes.
