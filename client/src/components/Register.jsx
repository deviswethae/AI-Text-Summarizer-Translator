import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import AIImage from '../components/images/AI.png'; // adjust path based on your project structure

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/register', { username, email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data || 'Registration failed');
      console.error(err);
    }
  };

  return (
    <div className="home-main-container">
      {/* Left - Full image */}
      <div className="left-container">
        <img src={AIImage} alt="AI" />
      </div>

      {/* Right - Register Form */}
      <div className="right-container">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          AI Text Summarizer And Text Translator App
        </h1>
        

        <div className="auth-form">
          <h2>Register</h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
              style={{ color: "#000", backgroundColor: "#fff" }}
            />
            <button type="submit">Register</button>
          </form>
          <p className="text-gray-700 font-bold py-2 px-4">
            Already have an account? <a href="/">Login Here...</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
