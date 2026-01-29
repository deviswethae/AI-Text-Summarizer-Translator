import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import AIImage from '../components/images/AI.png';

const Login = ({ setIsAuthenticated, setUsername }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/', { email, password });
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      setUsername(response.data.username);
      navigate('/summarizer');
    } catch (err) {
      setError('Invalid credentials');
      console.error(err);
    }
  };

  return (
    <div className="home-main-container">
      {/* Left - Full size image */}
      <div className="left-container">
        <img src={AIImage} alt="AI" />
      </div>

      {/* Right - Login form */}
      <div className="right-container">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          AI Text Summarizer And Text Translator App
        </h1>
        

        <div className="auth-form">
          <h2><b>Login</b></h2>
          {error && <p className="error">{error}</p>}
          <form onSubmit={handleSubmit}>
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
            <button type="submit">Login</button>
          </form>
          <p className="text-gray-700 font-bold py-2 px-4">
            Don't have an account? <a href="/register">Register Here...</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
