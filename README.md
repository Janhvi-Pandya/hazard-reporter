# Hazard Reporter

Hazard Reporter is a comprehensive, modern web application for incident management and reporting. It allows users to submit reports about various hazards (e.g., electrical, structural, fire safety) and provides administrators with a powerful dashboard to triage, classify, and manage these incidents.

## 🚀 Features

- **Role-Based Access Control**:
  - **Admin Mode**: Full access to all incidents across the system, AI-driven analysis, and system-wide incident statistics.
  - **User Mode**: A tailored experience where users manage only the incidents they've personally reported.
- **Smart Routing & AI Analysis**: Automatic assignment to relevant teams based on category and urgency, backed by simulated AI insights to prioritize critical issues.
- **Interactive Dashboard**:
  - Real-time incident queue with filtering (status, severity, category) and sorting.
  - Incident mapping (simulated visualization of hazard locations).
- **Incident Reporting**:
  - Detailed submission forms capturing category, severity, location data, and photo evidence.
  - Location pinning using an interactive coordinate picker.
- **Modern UI/UX**:
  - "Liquid Glass" design aesthetic built with Tailwind CSS.
  - Custom animations, hover effects, and a fully responsive layout.

## 🛠️ Technology Stack

- **Frontend**:
  - React (with hooks and Context API for state management)
  - React Router DOM for routing
  - Vite for fast development and building
  - Tailwind CSS for styling and custom animations
  - Lucide React for consistent, scalable icons
- **Backend**:
  - Node.js & Express.js server
  - SQLite (via `sql.js`) for lightweight database management
  - Local file storage mechanism for image uploads (`multer`)
  - Basic stateless JWT-inspired authentication

## 📂 Project Structure

```
keriu/
├── public/                 # Static assets
├── server/
│   ├── index.js            # Express server entry point
│   ├── hazard.db           # SQLite database file
│   └── uploads/            # Uploaded incident images
├── src/
│   ├── components/         # Reusable UI components (AIInsights, IncidentMap, etc.)
│   ├── context/            # React Contexts (AuthContext)
│   ├── pages/              # Main view components (Dashboard, Login, SubmitReport, etc.)
│   ├── App.tsx             # Main routing and layout component
│   ├── index.css           # Global styles and Tailwind directives
│   ├── types.ts            # TypeScript interfaces
│   └── api.ts              # Frontend API client
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind theme configuration
└── vite.config.ts          # Vite bundler configuration
```

## ⚙️ Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Janhvi-Pandya/keriu.git
   cd keriu
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

### Running the Application

The project uses `concurrently` to run both the frontend React app and the Node backend server simultaneously.

```bash
npm run dev
```

- The **frontend** will be available at: `http://localhost:5173`
- The **backend server** will be available at: `http://localhost:3001`

### Default Accounts

The database comes pre-seeded with an administrator account for testing purposes:

- **Username**: `admin`
- **Password**: `admin123`

You can create new standard user accounts via the registration page.

## 🗺️ Application Flow

1. **Landing / Login**: Users are greeted by a secure login portal. The toggle allows quick switching between logging in as a standard user or an admin.
2. **Dashboard**: 
   - Non-admin users are placed into **"My Reports"** mode, viewing only their submissions.
   - Admins default to the **"Active Incident Queue"**, seeing all system-wide hazards, with the ability to toggle a "User" view.
3. **Submit Report**: Users can fill out a comprehensive hazard notification featuring image upload and interactive map pinning. Submissions grant a unique tracking code.
4. **Track Report**: Users can check the status of anonymous or previously submitted reports using their assigned tracking code.

## 📝 License

This project is licensed under the MIT License.
