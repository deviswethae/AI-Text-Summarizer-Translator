import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Summarizer.css';

function Summarizer({ username }) {
  const navigate = useNavigate();
  const [textToSummarize, setTextToSummarize] = useState("");
  const [textToTranslate, setTextToTranslate] = useState("");
  const [summarizedText, setSummarizedText] = useState("");
  const [language, setLanguage] = useState("hi");
  const [loading, setLoading] = useState("Summarize");
  const [loadingT, setLoadingT] = useState("Translate");
  const [history, setHistory] = useState([]);
  const [activeSummary, setActiveSummary] = useState(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchHistory();
    } else {
      setIsLoadingHistory(false);
    }
  }, [username]);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/summaries', {
        headers: {
          'Authorization': token
        }
      });
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOnSubmitSummarize = async(e) => {
    e.preventDefault();
    setLoading("Loading..");
    try {
      const token = localStorage.getItem('token');
      let config = {
        method: "post",
        maxBodyLength: Infinity,
        url: "http://localhost:3000/summarize",
        headers: {
          'Content-Type': "application/json",
          'Authorization': token
        },
        data: JSON.stringify({ inputs: textToSummarize }), 
      }
      let response = await axios.request(config);
      setLoading("Summarize");
      setTextToTranslate(response.data.summarizedText);
      setSummarizedText(response.data.summarizedText);
      fetchHistory();
    } catch (error) {
      setLoading("Summarize");
      console.error('Error occurred:', error.message);
      console.error('Error response:', error.response);
    }
  }
  
  const handleOnSubmitTranlate = async(e) => {
    e.preventDefault();
    setLoadingT("Loading..");
    try {
      const token = localStorage.getItem('token');
      let config = {
        method: "post",
        url: "http://localhost:3000/translate",
        headers: {
          'Content-Type': "application/json",
          'Authorization': token
        },
        data: JSON.stringify({ text: summarizedText, source: "en", target: language }), 
      }
      let response = await axios.request(config);
      setLoadingT("Translate")
      setTextToTranslate(response.data.translatedText);
      fetchHistory();
    } catch (error) {
      setLoadingT("Translate")
      console.error('Error occurred:', error.message);
      console.error('Error response:', error.response);
    }
  }

  const handleOnChangeLanguage = (e) => {
    setLanguage(e.target.value)
  }

  const loadSummary = (summary) => {
    setActiveSummary(summary);
    setTextToSummarize(summary.originalText);
    setSummarizedText(summary.summarizedText);
    setTextToTranslate(summary.translatedText || summary.summarizedText);
    if (summary.language) {
      setLanguage(summary.language);
    }
  }

  const clearHistory = async () => {
    if (window.confirm("Are you sure you want to delete all history? This cannot be undone.")) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete('http://localhost:3000/summaries', {
          headers: { 'Authorization': token }
        });
        setHistory([]);
        setActiveSummary(null);
        setTextToSummarize("");
        setSummarizedText("");
        setTextToTranslate("");
      } catch (error) {
        console.error('Error clearing history:', error);
        alert("Failed to clear history. Please try again.");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const countWords = (text) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const countCharacters = (text) => {
    return text.length;
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/upload', formData, {
        headers: {
          'Authorization': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      setTextToSummarize(response.data.text);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  return (
    <div className="summarizer-container">
      {localStorage.getItem('token') && (
        <div className="history-sidebar">
          <div className="sidebar-header">
            <h2 className='history-title'>Your History</h2>
          </div>
          <button 
            className="clear-history-btn"
            onClick={clearHistory}
            disabled={isLoadingHistory || history.length === 0}
          >
            Clear All
          </button>
          <button 
              className="logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          <div className="history-list">
            {isLoadingHistory ? (
              <p className='no-history'>Loading history...</p>
            ) : history.length > 0 ? (
              history.map((item, index) => (
                <div 
                  key={index} 
                  className={`history-item ${activeSummary?._id === item._id ? 'active' : ''}`}
                  onClick={() => loadSummary(item)}
                >
                  <p className='history-text'>{item.originalText.substring(0, 50)}...</p>
                  <p className='history-date'>{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className='no-history'>No history yet</p>
            )}
          </div>
        </div>
      )}

      <div className="main-content">
        <div className="header">
          <h1 className='text-7xl md:text-5xl font-bold mb-7'>AI Text Summarizer And Text Translator App</h1>
        </div>
        
        <div className="text-areas">
          <div className="text-box">
            <textarea 
              id="text_to_summarize" 
              value={textToSummarize} 
              onChange={(e) => setTextToSummarize(e.target.value)} 
              placeholder="Paste in some text to summarize. (min/max - length 200/1000 character.)" 
              maxLength="10000"
            ></textarea>
            <div className="word-count">
              Words: {countWords(textToSummarize)} | Characters: {countCharacters(textToSummarize)}
            </div>
            <div className="file-upload">
              <input 
                type="file" 
                id="file-upload" 
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
              />
              <label htmlFor="file-upload" className="upload-btn">
                Choose File
              </label>
              {selectedFile && (
                <div>
                  <span>{selectedFile.name}</span>
                  <button onClick={handleFileUpload}>Upload</button>
                </div>
              )}
            </div>
            <button 
              onClick={handleOnSubmitSummarize} 
              disabled={!textToSummarize}
            >
              {loading}
            </button>
          </div>

          <div className="text-box">
            <textarea 
              id="summary" 
              value={textToTranslate} 
              onChange={(e) => setTextToTranslate(e.target.value)} 
              placeholder="Summarized text will appear here"
            ></textarea>
            
            <div className="word-count">
              Words: {countWords(textToTranslate)} | Characters: {countCharacters(textToTranslate)}
            </div>
            <div className="translate-controls">
              <select 
                name="language" 
                value={language} 
                onChange={handleOnChangeLanguage} 
                disabled={textToTranslate===""}
              >
                <option value="hi">Hindi</option>
                <option value="fr">French</option>
                <option value="ru">Russian</option>
                <option value="de">German</option>
                <option value="ta">Tamil</option>
                <option value="ar">Arabic</option>
                <option value="zh">Chinese</option>
                <option value="el">Greek</option>
              </select>
              
              <button 
                onClick={handleOnSubmitTranlate} 
                disabled={textToTranslate===""}
              >
                {loadingT}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Summarizer;