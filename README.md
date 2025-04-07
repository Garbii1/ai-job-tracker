# AI-Powered Job Application Tracker

A full-stack web application designed to help job seekers organize their job search, track applications, store documents securely via Cloudinary, and leverage AI-powered insights (OpenAI) to improve their strategy. Built with the MERN stack (MongoDB, Express, React, Node.js) and deployed using free-tier services.

**Live Demo:** [https://ai-job-tracker-ten.vercel.app/](https://ai-job-tracker-ten.vercel.app/)
**Backend API Hosted On:** Render (Free Tier)

**(Note on AI Features):** The AI assistance features rely on the OpenAI API. Due to using free trial credits or free tier limitations, these features might be temporarily unavailable in the live demo if the usage quota has been exceeded. The integration code itself is functional.*

**(Note on Deployment):** This application is hosted entirely on free service tiers (Vercel, Render, MongoDB Atlas, Cloudinary), which may result in initial loading delays ("cold starts") for the backend API after periods of inactivity.*

---

## Screenshots

*(Screenshots included below show the Login, Registration, Dashboard, and Add New Application pages)*

**Login Page**
![JobTracker AI Login Page](./images/login.jpeg)  

**Registration Page**
![JobTracker AI Registration Page](./images/registration.jpeg)

**Dashboard Page**
![JobTracker AI Dashboard Page](./images/dashboard.jpeg)

**Add Application Page**
![JobTracker AI Add Application Page](./images/application.jpeg)


---

## Features

*   **User Authentication:** Secure registration and login using JWT and password hashing (bcryptjs).
*   **Application Tracking:** Add, view, edit, and delete job applications (Company, Position, Date, Status, Notes, Links, etc.).
*   **Dashboard:** At-a-glance view of application statistics and a sortable list of all applications.
*   **Cloudinary File Storage:** Securely upload and manage resumes and cover letters via Cloudinary; files persist reliably.
*   **Reminders:** Input fields for follow-up and interview dates, highlighted on the dashboard.
*   **AI-Powered Insights (OpenAI Integration):**
    *   Generate draft cover letters based on job descriptions.
    *   Analyze application fit against job descriptions and suggest improvements.
    *   Suggest personalized follow-up strategies based on application status.
    *   *(Note: Subject to OpenAI API quota limitations in the live demo).*
*   **Responsive Design:** Basic responsiveness for usability on various screen sizes.

---

## Tech Stack

*   **Frontend:** React (with Vite), React Router, Axios, `react-icons`, `he` (for HTML entity decoding)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (via MongoDB Atlas Free Tier)
*   **ODM:** Mongoose
*   **Authentication:** JWT (JSON Web Tokens), bcryptjs
*   **File Uploads:** Multer, **Cloudinary** (Cloud Storage & SDK - Free Tier)
*   **AI:** OpenAI API (`gpt-3.5-turbo` or similar)
*   **Deployment:**
    *   Frontend: **Vercel** (Free Hobby Plan)
    *   Backend API: **Render** (Free Web Service Tier)

---

## Getting Started (Local Development)

### Prerequisites

*   Node.js (v18.x or later recommended)
*   npm or yarn
*   Git
*   **MongoDB Atlas Account:** Free tier sufficient. Get your connection string.
*   **OpenAI API Key:** Obtain from [OpenAI Platform](https://platform.openai.com/api-keys). Free trial credits available initially.
*   **Cloudinary Account:** Free tier available. Get your `Cloud Name`, `API Key`, and `API Secret`.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Garbii1/ai-job-tracker.git
    cd ai-job-tracker
    ```

2.  **Backend Setup (`server` directory):**
    ```bash
    cd server
    npm install
    ```
    *   Create a `.env` file in the `server` directory (`server/.env`). **Do NOT commit this file.**
    *   Add the following environment variables, replacing placeholders with your actual credentials:
        ```dotenv
        # MongoDB Atlas Connection String
        MONGO_URI=<Your MongoDB Atlas Connection String>

        # JWT Secret (make this long and random)
        JWT_SECRET=<Your Strong JWT Secret>
        JWT_EXPIRES_IN=1d

        # Server Port (for local dev)
        PORT=5001

        # OpenAI API Key
        OPENAI_API_KEY=sk-<Your OpenAI API Key>

        # Cloudinary Credentials
        CLOUDINARY_CLOUD_NAME=<Your Cloudinary Cloud Name>
        CLOUDINARY_API_KEY=<Your Cloudinary API Key>
        CLOUDINARY_API_SECRET=<Your Cloudinary API Secret>

        # Frontend URL (for local dev CORS)
        CLIENT_URL=http://localhost:5173
        ```
    *   Run the backend server:
        ```bash
        npm run dev
        ```
        The API should be running on `http://localhost:5001`.

3.  **Frontend Setup (`client` directory):**
    *   Open a **new terminal** window/tab.
    ```bash
    cd ../client # Navigate back to root, then into client
    npm install
    ```
    *   Create a `.env.local` file in the `client` directory (`client/.env.local`). **Do NOT commit this file.**
    *   Add the backend API URL for local development:
        ```dotenv
        VITE_API_BASE_URL=http://localhost:5001/api
        ```
    *   Run the frontend development server:
        ```bash
        npm run dev
        ```
        The application should be accessible at `http://localhost:5173`.

---

## Deployment

This application is deployed using free tiers:

*   **Backend API:** Hosted on **Render** ([render.com](https://render.com/)).
    *   Connect GitHub repo.
    *   Set **Root Directory** to `server`.
    *   Build command: `npm install`.
    *   Start command: `npm start`.
    *   Add all backend environment variables (from `server/.env`) to Render's "Environment" settings, including `MONGO_URI`, `JWT_SECRET`, `OPENAI_API_KEY`, `CLOUDINARY_*`, and `NODE_ENV=production`. Set `CLIENT_URL` to the deployed Vercel frontend URL.
*   **Frontend UI:** Hosted on **Vercel** ([vercel.com](https://vercel.com/)).
    *   Connect GitHub repo.
    *   Set **Root Directory** to `client`.
    *   Framework Preset: `Vite`.
    *   Add the `VITE_API_BASE_URL` environment variable in Vercel's settings, pointing to the deployed Render API URL (e.g., `https://your-render-app-name.onrender.com/api`).


---