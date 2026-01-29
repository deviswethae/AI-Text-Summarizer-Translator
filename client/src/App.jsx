import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Summarizer from './components/Summarizer';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  return (
    <Router>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/summarizer" /> : <Login setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/summarizer" /> : <Login setIsAuthenticated={setIsAuthenticated} setUsername={setUsername} />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/summarizer" /> : <Register />} />
        <Route path="/summarizer" element={isAuthenticated ? <Summarizer username={username} /> : <Summarizer />} />
      </Routes>
    </Router>
  );
}

export default App;