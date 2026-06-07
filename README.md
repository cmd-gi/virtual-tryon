# Virtual Try-On Kiosk

## Overview
Virtual Try-On Kiosk is a portrait-first retail experience built with Next.js and FastAPI. The kiosk guides a user through capture, preference selection, recommendations, and a final try-on preview. An admin portal manages the clothing catalog, while the backend stores garments in SQLite-backed records and orchestrates ComfyUI-based cloth swapping with the selected garment and user photo.

## Features

- Touch-first kiosk flow for portrait displays.
- Welcome, capture, preferences, recommendations, try-on, and exit screens.
- Clothing recommendations filtered by occasion, style, gender, and category.
- Admin portal for creating, editing, and deleting catalog items.
- Local garment image storage for fast retrieval during try-on generation.
- ComfyUI-backed try-on pipeline using the selected garment and webcam photo.
- Session-oriented UX with cleanup designed for public kiosk use.

## 📸 Snapshots

### Landing Page
![Landing Page](snapshots/1_Landing_Page.png)

### Preferences Selection
![Preferences Selection](snapshots/2_Preferences_Selection.png)

### Outfit Catalog
![Outfit Catalog](snapshots/3_Outfit_Catalog.png)

### Final Try-On Result
![Final Try-On Result](snapshots/4_Final_TryOn_Result.jpeg)

### Admin Panel
![Admin Panel](snapshots/5_Admin_Panel.png)

## 🏗️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with `tailwindcss-animate`
- **UI Components**: [Shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context (`SessionContext`)
- **Forms**: `react-hook-form` with `zod` validation

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.10+
- **Database**: SQLite (via `aiosqlite`)
- **ORM**: SQLAlchemy
- **AI/ML**: Google GenAI SDK
- **Task Runner**: Uvicorn

## 📂 Project Structure

```
kiosk-app-build/
├── app/                    # Next.js App Router
│   ├── admin/              # Admin portal routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Kiosk entry page
├── backend/                # FastAPI Backend
│   ├── database/           # DB connection and models
│   ├── routes/             # API endpoints for clothing and try-on
│   ├── services/           # ComfyUI client and backend services
│   ├── storage/            # Image storage
│   ├── main.py             # App entry point
│   └── requirements.txt    # Python dependencies
├── components/             # React Components
│   ├── admin/              # Admin-specific components
│   ├── screens/            # Kiosk flow screens
│   ├── ui/                 # Reusable UI components
│   └── kiosk-shell.tsx     # Main wrapper for kiosk UI
├── lib/                    # Utilities & Context
│   └── session-context.tsx # Session state management
└── public/                 # Static assets
```

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18 or higher
- **Python**: v3.10 or higher
- **pnpm** (recommended) or npm

### 1. Frontend Setup
1.  Navigate to the project root:
    ```bash
    cd kiosk-app-build
    ```
2.  Install dependencies:
    ```bash
    pnpm install
    ```
3.  Start the development server:
    ```bash
    pnpm dev
    ```
    The frontend will be available at `http://localhost:3000`.
    If the backend runs elsewhere, set `NEXT_PUBLIC_API_URL` in a frontend `.env.local` file.

### 2. Backend Setup
1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create a virtual environment:
    ```bash
    python -m venv venv
    ```
3.  Activate the virtual environment:
    - **Windows**: `venv\Scripts\activate`
    - **Mac/Linux**: `source venv/bin/activate`
4.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
5.  Set up environment variables:
    - Create a `.env` file in `backend/`
    - Set `COMFYUI_URL` to your ComfyUI server URL
    - Set `COMFYUI_TOKEN` if your ComfyUI server requires authorization
    - Set `DATABASE_URL` only if you want to override the default SQLite path
6.  Start the backend server:
    ```bash
    python main.py
    ```
    The backend API will be available at `http://localhost:8000`.
    API Docs: `http://localhost:8000/docs`

## ⚙️ Configuration
- **Frontend API URL**: `NEXT_PUBLIC_API_URL` controls where the kiosk sends API requests.
- **Backend API prefix**: `/api` in `backend/config.py`.
- **ComfyUI connection**: `COMFYUI_URL` and optional `COMFYUI_TOKEN` in `backend/.env`.
- **Database**: SQLite by default via `backend/config.py`.
- **Kiosk session behavior**: Managed in `lib/session-context.tsx`.

## 🤝 Contributing
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'Add NewFeature'`).
4.  Push to the branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

---
**Smart Kiosk App** &copy; 2024
