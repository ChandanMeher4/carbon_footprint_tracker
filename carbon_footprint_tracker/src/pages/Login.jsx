import { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { useNavigate } from "react-router-dom";
//import "../styles/Login.css"; // Adjust the path if needed

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const loginWithEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/"); // redirect to home after login
    } catch (err) {
      alert(err.message);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, provider);
      navigate("/"); // redirect to home after login
    } catch (err) {
      alert(err.message);
    }
  };

  const goToSignup = () => {
    navigate("/signup"); // navigate to signup page
  };

  return (
    <div>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={loginWithEmail}>Login</button>
      <button onClick={loginWithGoogle}>Login with Google</button>
      <button onClick={goToSignup}>Don't have an account? Sign Up</button>
    </div>
  );
};

export default Login;
