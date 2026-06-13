# SpeakUp - Anonymous Crime Reporting Platform 🛡️

A secure, anonymous crime reporting and intelligence-sharing platform designed to reduce the communication gap between citizens and law enforcement agencies. Built using **React.js, Express, TailwindCSS, and PostgreSQL (Supabase)**.

---

## 🚀 Key Features Implemented

*   **100% Anonymous Submissions**: Citizens can report incidents without creating a profile or exposing their IP/personal details.
*   **AI Redaction & Analysis**:
    *   Integrates **OpenAI GPT-4o-mini** to automatically redact personally identifiable information (PII) like names, emails, and phone numbers from narrative descriptions.
    *   Performs automated severity analysis (Low, Medium, High) and generates one-sentence incident summaries.
    *   **Graceful Local Fallback**: If no OpenAI API key is supplied, the system automatically falls back to regex-based redaction and keyword-matching severity categorizations.
*   **Media Evidence Uploads**: Supports attaching photos, videos, and document evidence to strengthen case files, powered by `multer` file handling.
*   **Interactive Geotag Mapping**:
    *   Optional geolocation tagging during submission using a Leaflet interactive map pointer.
    *   Admin Dashboard renders a live **Geo-Intelligence Map** pinning all tagged cases, color-coded by severity.
*   **Admin Case Management Console**:
    *   Dashboard summaries showing total, pending, and resolved cases.
    *   Interactive filter controls (by category, severity, and status).
    *   Incident narratives inspector with media player components and detailed action remarks logs.
*   **Recharts Analytics**: Dynamic pie charts showing severity distribution and bar charts highlighting crime category aggregations.
*   **Voice Dictation**: Support for voice-to-text narrative inputs using the Web Speech API.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, TailwindCSS, Leaflet, Recharts, Framer Motion, Lucide Icons, Canvas-Confetti
*   **Backend**: Node.js, Express.js (ES Modules), Multer, pg (PostgreSQL Pool Client), OpenAI API
*   **Database**: PostgreSQL (Supabase Cloud Database instance)

---

## ⚙️ Local Setup Instructions

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/yforyash/Speakup-ai.git
    cd Speakup-ai
    ```

2.  **Install All Workspace Packages**:
    ```bash
    npm run install-all
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file inside the `backend/` directory:
    ```env
    PORT=5055
    DATABASE_URL=your_supabase_postgresql_connection_string
    
    # Optional OpenAI Key (system runs local fallback analysis if left blank)
    OPENAI_API_KEY=
    ```

4.  **Run Development Servers**:
    ```bash
    npm run dev
    ```
    This starts the frontend on `http://localhost:5173` and backend on `http://localhost:5055` concurrently.

---

## ☁️ Deployment

For deployment instructions on Render (backend) and Vercel (frontend), please refer to the [README_DEPLOYMENT.md](README_DEPLOYMENT.md) file.
