
# 🌿 Carbon Footprint Tracker

**Carbon Footprint Tracker** is a React-based web application that helps individuals monitor and reduce their environmental impact. Users can log daily activities related to transportation, energy usage, and lifestyle choices, then visualize their carbon emissions over time through interactive dashboards.

---

## 🚀 Features

* 📊 **Interactive Dashboards**
  Visualize emission trends using **Bar, Line, and Pie charts** powered by **Recharts**.

* 📝 **Activity Logging**
  Simple and intuitive forms to log daily activities such as driving, electricity consumption, and waste generation.

* 🔐 **Authentication**
  Secure user sign-up and login using **Firebase Authentication**.

* ☁️ **Real-time Data Storage**
  User activity data is stored and retrieved securely using **Firebase Firestore**.

* ⚡ **Fast & Responsive**
  Built with **Vite** for blazing-fast development and optimized production builds.

---

## 🛠️ Tech Stack

* **Frontend:** React.js (Vite)
* **Backend / Database:** Firebase (Authentication & Firestore)
* **Charts & Visualization:** Recharts
* **Routing:** React Router DOM
* **Styling:** CSS3 (Custom Modules)

---

## ⚙️ Installation & Setup

### Prerequisites

* Node.js (v16+ recommended)
* A Firebase project (Authentication & Firestore enabled)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/yourusername/carbon_footprint_tracker.git
cd carbon_footprint_tracker
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Configure Firebase

Create a `firebase.js` file inside the `src/` directory and add your Firebase credentials:

```javascript
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
```

> ⚠️ **Tip:** Never commit your Firebase keys to a public repository. Use environment variables (`.env`) for production.

---

### 4️⃣ Run the Application

```bash
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser to view the app.

---

## 📂 Project Structure

```
src/
│── pages/
│   ├── EmissionTrends.jsx   # Dashboard with visual analytics
│   ├── LogActivity.jsx     # Activity logging form
│
│── context/ or hooks/
│   └── useAuth.js          # Authentication & user session logic
│
│── firebase.js             # Firebase configuration
```

---

## 🤝 Contributing

Contributions are welcome!
If you have ideas such as:

* 🌱 Gamification (badges, streaks)
* 🏆 Carbon reduction goals
* 👥 Social sharing & comparisons

Feel free to **fork the repository**, create a feature branch, and submit a pull request.

---

## 📄 License

This project is open-source and available under the **MIT License**.

# 🌿 Carbon Footprint Tracker

![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=black)
![Recharts](https://img.shields.io/badge/Recharts-Data%20Visualization-22B5BF)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-success)

