# 🚀 HackVerse — College Hackathon Management System

HackVerse is a comprehensive platform designed to streamline the management of college hackathons, from team registration and problem selection to mentor assignment and progress tracking.

## 👥 User Roles & Access

### 1. Student (Team Leader)
*   **Account**: Managed by the team leader for a team of exactly 4 members.
*   **Primary Actions**: Register team, select a problem statement, choose a mentor, submit weekly progress, and finalize project details.

### 2. Mentor (Faculty/Expert)
*   **Account**: Created by Admin.
*   **Primary Actions**: Review assigned teams, approve/provide feedback on weekly progress reports, and rate final submissions.

### 3. Administrator
*   **Account**: Master control (`admin@hackverse.com`).
*   **Primary Actions**: Monitor all registrations, manage problem statements (add/edit/delete), register mentors, and view overall hackathon analytics.

---

## 🛠 Project Workflows

### 📥 1. Registration & Authentication
*   **Team Formation**: Exactly 4 members required. The leader provides their full details (Name, USN, Phone, Email, Dept) and adds names/USNs for 3 other members.
*   **Role-Based Login**: A single login page (`login.html`) redirects users based on their credentials:
    *   Team Email → Student Dashboard
    *   Faculty Email → Mentor Dashboard
    *   Admin Credentials → Admin Panel

### 🎓 2. Student Workflow
1.  **Dashboard**: Overview of team status and quick links.
2.  **Problem Selection**: Browse problems assigned to your department. One problem per team. (Once selected, it's locked to that team).
3.  **Team Roster**: View team details. Use the **"Edit USNs"** button to update member information if missed during registration.
4.  **Mentor Selection**: Choose an available mentor from your department. Mentors have a capacity limit (8 teams total).
5.  **Progress Tracking**: Submit weekly reports. View mentor feedback and approval status for each milestone.
6.  **Final Submission**: Submit the GitHub repository, demo video, and project description.

### 👨‍🏫 3. Mentor Workflow
1.  **My Teams**: View all teams that have selected you as their mentor.
2.  **Progress Review**: Access a dedicated page for each team to see their weekly updates.
3.  **Feedback Loop**: Approve reports or mark them as "Needs Revision" with specific comments.
4.  **Final Grading**: Review the project link and video once submitted to provide final ratings.

### 🔐 4. Admin Workflow
1.  **Overview**: Real-time stats on total teams, participants, and problem selection rates.
2.  **Registration Management**: View full roster of all teams across all departments. Search and filter capabilities included.
3.  **Problem Statements**: Manage the pool of challenges for each department track.
4.  **Mentor Management**: Add new faculty members and monitor their current team assignments (Current/Total Capacity).

---

## 🏗 Technical Architecture
*   **Frontend**: Vanilla HTML5, CSS3 (Modern Neon Aesthetic), and JavaScript (ES6+ Modules).
*   **Backend/Database**: Supabase (PostgreSQL) for real-time data storage and Auth.
*   **Deployment**: Optimized for Vite-based development and static hosting.

## ⚖️ Safety & Resilience
*   **Database Fallbacks**: The system is designed to be resilient. If optional columns (like `member_usn`) are missing from the database, the interface will still load names and notify the user to run migrations rather than breaking.
*   **Auth Guarding**: All internal pages are protected by session-based authentication.
