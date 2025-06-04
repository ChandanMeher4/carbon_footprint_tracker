import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, provider } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/Signup.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name || !gender || !age) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save extra user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        gender,
        age,
        createdAt: new Date(),
      });

      navigate("/"); // redirect to home
    } catch (err) {
      setError(err.message);
    }
  };

  const signupWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user data already exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        // Save basic profile data
        await setDoc(doc(db, "users", user.uid), {
          name: user.displayName || "",
          email: user.email,
          gender: "", // you can add a step to let user complete their profile later
          age: "",
          createdAt: new Date(),
        });
      }

      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  const goToLogin = () => {
    navigate("/login");
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            value={gender}
            required
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
          <input
            type="number"
            placeholder="Age"
            value={age}
            required
            onChange={(e) => setAge(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Sign Up</button>
          {error && <p className="error">{error}</p>}
        </form>

        <button
          type="button"
          onClick={signupWithGoogle}
          className="google-login"
        >
          <img
            src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg"
            alt="Google"
          />
          Sign Up with Google
        </button>

        <button
          type="button"
          onClick={goToLogin}
          className="secondary-button"
        >
          Already have an account? Login
        </button>
      </div>
    </div>
  );
}
