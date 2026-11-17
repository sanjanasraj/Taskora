# Taskora – Task Management Application

Taskora is a full-stack task management application designed to help users organize, track, and manage their daily tasks through a simple and user-friendly interface.

## Features

- **User Authentication** – User registration and login.
- **Task Management** – Create, view, edit, and delete tasks.
- **Task Priorities** – Organize tasks based on priority.
- **Status Tracking** – Track Pending, In Progress, and Completed tasks.
- **Search Tasks** – Quickly find tasks by title.
- **Filter Tasks** – Filter tasks based on their status.
- **Dashboard** – View task statistics and recent tasks.
- **Data Persistence** – Store user accounts and tasks using SQLite.
- **Responsive Design** – Access the application on desktop and mobile screens.

## Tech Stack

| Technology | Purpose |
|---|---|
| React | Frontend |
| Vite | Development server and build tool |
| CSS | Styling and responsive design |
| Python | Backend |
| Flask | REST API |
| SQLite | Database |
| Git & GitHub | Version control |

## Project Structure

```text
Taskora/
│
├── backend/
│   └── app.py
│
├── public/
│
├── src/
│   ├── assets/
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
│
├── .gitignore
├── index.html
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Python 3
- Git

### 1. Clone the repository

```bash
git clone https://github.com/sanjanasraj/Taskora.git
cd Taskora
```

### 2. Set up the backend

Open a terminal:

```bash
cd backend
python -m venv .venv
```

Install the required packages:

```bash
python -m pip install Flask Flask-Cors
```

Start the Flask server:

```bash
python app.py
```

The backend runs at:

`http://localhost:5000`

### 3. Set up the frontend

Open another terminal in the main Taskora directory:

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## Future Improvements

- Task reminders and notifications
- Calendar integration
- Enhanced dashboard analytics
- Additional customization options

## Author

**Sanjana S Raj**

GitHub: [@sanjanasraj](https://github.com/sanjanasraj)

---

*Built as a full-stack development project to practice React, Python, Flask, REST APIs, and database integration.*
