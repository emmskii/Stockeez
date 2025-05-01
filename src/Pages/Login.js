// src/Pages/Login.jsx
import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import '../css/login.css';
import bgImage from '../assets/bg.jpg';
import stockeezIcon from '../assets/stockeez-icon.png';
import { useNavigate } from 'react-router-dom';


const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isCreateAccountActive, setIsCreateAccountActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
  // Form fields for account creation
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in:', userCredential.user);
      setSuccess('Logged in successfully!');
      navigate('/dashboard');
      
      // You would typically redirect to another page here
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleCreateAccount = () => {
    setIsCreateAccountActive(!isCreateAccountActive);
    // Reset form fields and errors when toggling
    setError(null);
    setSuccess(null);
  };

  const validateForm = () => {
    if (!fullName || !phoneNumber || !createEmail || !createPassword || !confirmPassword || !role) {
      setError('All fields are required');
      return false;
    }
    
    if (createPassword !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (createPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    
    return true;
  };

  const handleRequestAccount = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create the authentication account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        createEmail, 
        createPassword
      );
      
      // Store additional user information in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName,
        phoneNumber,
        email: createEmail,
        role,
        createdAt: new Date().toISOString()
      });
      
      console.log('Account created successfully!');
      setSuccess('Account created successfully! You can now sign in.');
      
      // Reset form fields
      setFullName('');
      setPhoneNumber('');
      setCreateEmail('');
      setCreatePassword('');
      setConfirmPassword('');
      setRole('');
      
      // Return to login screen after a short delay
      setTimeout(() => {
        setIsCreateAccountActive(false);
      }, 2000);
      
    } catch (error) {
      console.error('Account creation error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="login-card-container">
        {/* Original Left Section (Orange gradient with Stockeez) */}
        <div className={`left-section ${isCreateAccountActive ? 'slide-right' : ''}`}>
          <div className="stockeez-header-container">
            <img src={stockeezIcon} alt="Stockeez Icon" className="stockeez-icon" />
            <h1 className="stockeez-header">
              <span style={{ color: 'white' }}>Stockeez</span>
            </h1>
          </div>
          <p className="inventory-text">Inventory Management System</p> 
          {!isCreateAccountActive ? (
            <button 
              className="create-account-button" 
              onClick={toggleCreateAccount}
              disabled={loading}
            >
              Create an Account
            </button>
          ) : (
            <button 
              className="create-account-button submit-account-button" 
              onClick={handleRequestAccount}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Proceed'}
            </button>
          )}
        </div>

        {/* Right Section (Login form) */}
        <div className={`right-section ${isCreateAccountActive ? 'hidden' : ''}`}>
          <form onSubmit={handleLogin} className="login-form">
            <h2 className="login-title">Sign In</h2>
            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}
            <input
              type="email"
              placeholder="Email"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              disabled={loading}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              disabled={loading}
            />
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            
            <div className="login-options">
              <label className="remember-me">
                <input type="checkbox" disabled={loading} />
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot Password?</a>
            </div>
          </form>
        </div>

        {/* New Left Section (Request Account Form) */}
        <div className={`new-left-section ${isCreateAccountActive ? 'active' : ''}`}>
          <div className="back-button-wrapper">
            <button className="back-button" onClick={toggleCreateAccount} disabled={loading}>
              <span className="back-icon">←</span>
            </button>
            <span className="request-account-text">Create an account</span>
          </div>
          {error && <div className="login-error">{error}</div>}
          {success && <div className="login-success">{success}</div>}
          <form className="create-account-form" id="accountRequestForm" onSubmit={handleRequestAccount}>
            <input 
              type="text" 
              placeholder="Full Name" 
              className="account-input" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
              disabled={loading}
            />
            <input 
              type="tel" 
              placeholder="Phone Number" 
              className="account-input" 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required 
              disabled={loading}
            />
            <input 
              type="email" 
              placeholder="Email" 
              className="account-input" 
              value={createEmail}
              onChange={(e) => setCreateEmail(e.target.value)}
              required 
              disabled={loading}
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="account-input" 
              value={createPassword}
              onChange={(e) => setCreatePassword(e.target.value)}
              required 
              disabled={loading}
            />
            <input 
              type="password" 
              placeholder="Confirm Password" 
              className="account-input" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required 
              disabled={loading}
            />
            <div className="select-wrapper">
              <select 
                className="account-input role-select" 
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                disabled={loading}
              >
                <option value="" disabled>Select Role</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {/* The submit button is in the left section now */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;