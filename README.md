# DeskGuard – Smart Library Seat Booking & Anti-Hoarding System

DeskGuard is a modern full-stack web application designed to eliminate library desk hoarding and facilitate fair seat allocation. Built with a sleek futuristic dark/light glassmorphic UI, it coordinates real-time floor updates via WebSockets, automatic expiration of vacant seats via cron checkouts, interactive floor plans, detailed dashboard analytics, and student presence verification mechanisms.

---

## 🚀 Key Features

1. **Simulated QR-Code Desk Check-In**
   - Students select a desk on the interactive SVG map and scan the unique desk identifier using the simulated camera scanner to start their study session.
2. **Real-time Map Status Nodes**
   - Instant map synchronization using Socket.IO. Desks are color-coded in real time:
     - 🟢 **Green (Available)**: Free to book.
     - 🔴 **Red (Occupied)**: Active study session.
     - 🟡 **Yellow (Away Mode)**: Temporary leave slot active (20-minute limit).
3. **Away Mode Expiry Timer**
   - Students can mark their desk as "Away" when stepping out. The backend cron job ticks every minute; if they do not check back in within 20 minutes, the desk is auto-released.
4. **Auto-Abandon Presence Verification ("Still Here?" prompt)**
   - Every 2 hours, an active student is prompted on their dashboard with a modal asking: *Are you still studying?*
   - They must click **"Confirm Presence"** within a 5-minute grace period.
   - If they fail to respond, the desk is flagged as abandoned and instantly released back into the available pool.
5. **Interactive Floor Blueprint**
   - High-fidelity vector SVG layout containing designated study zones: *Quiet Study Area*, *Tech Coding Lab*, and *Collaborative Space*.
6. **Librarian Cockpit Controls**
   - Staff members can search active students, review occupied desks, view timers, and **Force Release** any desk.
7. **Busiest Hours & Occupancy Analytics**
   - Data visualizer charts plotting peak operating hours, daily occupancy percentages, popular study zones, and high-frequency seats.
8. **Export Audit Reports**
   - Instantly compiles and downloads a formatted PDF system audit report containing statistics and user metrics.

---

## 🛠️ Technology Stack

* **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, Recharts, jsPDF, Socket.io-client, Axios, Lucide Icons.
* **Backend**: Node.js, Express.js, Socket.IO, Node-Cron, JSON Web Tokens (JWT), BcryptJS.
* **Database**:
  * **Production**: PostgreSQL.
  * **Development (Zero-Config)**: The backend automatically falls back to a file-backed pure JavaScript JSON database (`deskguard_db.json`) if PostgreSQL credentials are not set. This guarantees the project runs instantly on any machine (including Windows ARM64, macOS, Linux) without requiring external software installations.

---

## 🔑 Hackathon Quick Login Credentials

The database is pre-seeded with the following default accounts. Use them for immediate testing:

| Role | Username | Password |
| :--- | :--- | :--- |
| **🎓 Student** | `alex_student` | `student123` |
| **🔑 Librarian** | `sarah_librarian` | `librarian123` |
| **🛠️ Admin** | `admin_user` | `admin123` |

---

## 💻 Local Setup & Execution Instructions

Follow these steps to run both the backend server and frontend client locally:

### 1. Backend Server Setup

Navigate to the `backend/` folder, configure environment variables if using PostgreSQL (otherwise leave blank to use the JSON fallback), and launch:

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Run backend API server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend React Setup

Open a new terminal window, navigate to the `frontend/` folder, install packages, and boot the Vite server:

```bash
# Navigate to frontend
cd frontend

# Install dependencies (handles React 19 peer-deps safely)
npm install --legacy-peer-deps

# Run Vite dev server (runs on http://localhost:5173 or next available)
npm run dev
```

Open the printed URL (e.g. `http://localhost:5173`) in your browser to evaluate DeskGuard!

---

## 🧪 Quick Sandbox Evaluation (Test Simulator)

Because waiting 2 hours for a presence check or 20 minutes for Away mode to expire is impractical during evaluation, we built a **Test Simulator console** directly into the student's Active Booking panel.

### Verification Scenarios you can test:

1. **Test: 20-Minute Away Expiry**
   - Log in as `alex_student`, select a green desk, click **Scan QR**, and select **Simulate Camera QR Scan** to check in.
   - Click **Set Away** on the dashboard. The desk turns Yellow.
   - Click **"☕ Simulate 20-min Away Expiry"** in the simulator panel.
   - **Result**: The simulator updates the database timestamp to 21 minutes ago and triggers a cron scan. The desk is instantly auto-released, turning Green. A warning notification appears in the log tray.
2. **Test: 2-Hour "Still Here?" Verification Prompt**
   - Check in to a desk.
   - Click **"🕒 Simulate 2-hour stay ("Still Here?")"** in the simulator.
   - **Result**: The backend updates the check-in time to 2+ hours ago and fires a scan. The high-priority **"Are you still here?"** modal overlay pops up immediately on the student's screen with a live 5-minute countdown.
   - Click **"Yes, I'm still studying!"** to verify presence. You will see a green success alert and a burst of confetti!
3. **Test: 5-Minute Grace Expiry (Abandonment)**
   - Check in to a desk and trigger the 2-hour stay check (above) so the "Still Here?" modal is visible.
   - Click **"⏳ Simulate 5-min grace timeout (No response)"** in the simulator.
   - **Result**: The backend marks the grace timer as exceeded. The seat is instantly auto-released (turning Green), and an alert notification log is dispatched to the user.

---

## 📈 Deployment Recommendations

### Frontend (Vercel)
- Create a new project on Vercel pointing to the `frontend/` subdirectory.
- Configure environment variable: `VITE_API_URL=https://your-backend-url.onrender.com/api` and `VITE_BACKEND_URL=https://your-backend-url.onrender.com`.

### Backend (Render / Railway)
- Create a Web Service pointing to the `backend/` subdirectory.
- Set build command: `npm install`.
- Set start command: `npm start`.

### Database (Supabase / Render PG)
- Provision a Managed PostgreSQL database.
- Supply the `DATABASE_URL` string to the backend's environment variables on Render. The server will automatically detect it and create all tables.
