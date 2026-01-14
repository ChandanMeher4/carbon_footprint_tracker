# 🌿 Carbon Footprint Tracker

**Carbon Footprint Tracker** is a React-based web application designed to help individuals monitor their daily environmental impact. By logging activities related to transport, energy usage, and diet, users can visualize their carbon emissions and track their progress toward a more sustainable lifestyle.

## 🚀 Key Features

* **📊 Interactive Dashboards:** Visualize emission trends over time using dynamic charts (Bar, Line, and Pie charts powered by `Recharts`).
* **📝 Activity Logging:** Easy-to-use forms to log daily activities like driving, electricity consumption, and waste generation.
* **🔐 Secure Authentication:** User sign-up and login managed via **Firebase Authentication**.
* **☁️ Real-time Data:** Stores and retrieves user activity logs securely using **Firebase**.
* **⚡ Fast & Responsive:** Built with **Vite** for lightning-fast development and optimized production builds.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite)
* **Backend / Database:** Firebase (Auth & Firestore)
* **Visualization:** Recharts
* **Routing:** React Router DOM
* **Styling:** CSS3 (Custom Modules)

---

## ⚙️ Installation & Setup

Prerequisites: Node.js installed and a Firebase project set up.

### 1. Clone the Repository
```bash
git clone [https://github.com/yourusername/carbon_footprint_tracker.git](https://github.com/yourusername/carbon_footprint_tracker.git)
cd carbon_footprint_tracker
2. Install Dependencies
Bash

npm install
3. Configure Firebase
Create a firebase.js file in src/ (or update the existing one) with your Firebase credentials:

JavaScript

// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
4. Run the App
Bash

npm run dev
Open http://localhost:5173 to view it in the browser.

📂 Project Structure
/src/pages/EmissionTrends.jsx: The analytics dashboard containing visual graphs.

/src/pages/LogActivity.jsx: The form interface for inputting daily usage data.

/src/context or /hooks: Contains useAuth for managing user sessions.

🤝 Contributing
Contributions are welcome! If you have ideas for new features (like gamification or social sharing), feel free to fork the repo and submit a PR.

📄 License
This project is open-source and available under the MIT License.
