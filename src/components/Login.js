import React, { useState } from "react";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { getDatabase, ref, set } from "firebase/database";
import "../styles/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const auth = getAuth();
  const navigate = useNavigate();
  const db=getDatabase();
  

  // Handle Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      navigate("/dashboard/home");
    } catch (err) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Login
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();

    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;

      // Extract user details from the result
      const userData = {
        username: user.displayName, 
        email: user.email,
        profilePhoto: user.photoURL|| "",        
      };

      // Save user data in Realtime Database under the user's UID
      const userRef = ref(db, `users/${user.uid}`);
      set(userRef, userData);

      console.log("User data saved to database:", userData);
        navigate("/dashboard/home");
      })
      .catch((error) => {
        console.error("Google login error:", error);
        setError("Failed to log in with Google.");
      });
  };

  // Handle Password Reset
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert("Password reset email sent. Please check your inbox.");
      setShowForgotPassword(false);
    } catch (err) {
      setError("Failed to send reset email. Please check the email address.");
    }
  };

  return (
    <div className="login-root">
      <div className="login-container">
        <h1>Login</h1>

        {/* Regular Login Form */}
        {!showForgotPassword && (
          <>
            <form onSubmit={handleLogin} className="login-form">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <p>
              <a
                onClick={() => setShowForgotPassword(true)} className="forgot-pass"
              >
                Forgot Password?
              </a>
            </p>
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </button>
              {error && <p className="error">{error}</p>}
            </form>
            <button className="google-login-btn" onClick={handleGoogleLogin}>
  <img
    src="data:image/png;base64,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"
    alt="Google Logo"
    className="google-logo"
  />
  Login with Google
</button>
            <p>
              Don't have an account? <a href="/register">Register here</a>
            </p>
          </>
        )}

        {/* Forgot Password Form */}
        {showForgotPassword && (
          <>
            <h2>Reset Password</h2>
            <form onSubmit={handleForgotPassword} className="reset-password-form">
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
              />
              <button type="submit">Send Reset Email</button>
              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="back-to-login-btn"
              >
                Back to Login
              </button>
            </form>
            {error && <p className="error">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
