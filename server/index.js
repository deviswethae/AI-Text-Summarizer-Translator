const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const summarizeText = require('./services/summarize');
const translateText = require('./services/translate');
const multer = require('multer');
const fs = require('fs');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/Summarizer', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', UserSchema);

// Summary Schema
const SummarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalText: { type: String, required: true },
  summarizedText: { type: String, required: true },
  translatedText: { type: String },
  language: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const Summary = mongoose.model('Summary', SummarySchema);

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const upload = multer({ dest: 'uploads/' });

// Add this after your other routes
app.post('/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded');
    }

    let text = '';
    const filePath = req.file.path;

    // Handle different file types
    if (req.file.mimetype === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      text = data.text;
    } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ path: filePath });
      text = result.value;
    } else if (req.file.mimetype === 'text/plain') {
      text = fs.readFileSync(filePath, 'utf8');
    } else {
      fs.unlinkSync(filePath); // Delete the file
      return res.status(400).send('Unsupported file type');
    }

    // Clean up the uploaded file
    fs.unlinkSync(filePath);

    res.json({ text });
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing file');
  }
});

// Routes
// Register
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    
    res.status(201).send('User created');
  } catch (error) {
    res.status(400).send(error.message);
  }
});

// Login
app.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).send('Invalid credentials');
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'your_jwt_secret');
    res.json({ token, username: user.username });
  } catch (error) {
    res.status(400).send(error.message);
  }
});

app.delete('/summaries', authenticateToken, async (req, res) => {
  try {
    await Summary.deleteMany({ userId: req.user.userId }); // Delete all entries for this user
    res.status(200).json({ message: "History cleared successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to clear history" });
  }
});


// Routes
// 1. API ENDPOINT to summarize the text
app.post('/summarize', authenticateToken, async(req, res) => {
  try {
      const summarizedText = await summarizeText(req.body.inputs);
      
      // Save to database
      const summary = new Summary({
          userId: req.user.userId,
          originalText: req.body.inputs,
          summarizedText: summarizedText
      });
      await summary.save();
      
      res.json({ summarizedText });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error summarizing text');
  }
})

// 2. API ENDPOINT to translate the summarized text to the selected language
app.post('/translate', authenticateToken, async(req, res) => {
  try {
      const { text, source, target } = req.body;
      const translatedText = await translateText(text, source, target);
      
      // Find and update the most recent summary for this user
      await Summary.findOneAndUpdate(
          { userId: req.user.userId, summarizedText: text },
          { $set: { translatedText, language: target } },
          { sort: { createdAt: -1 } }
      );
      
      res.json({ translatedText });
  } catch (error) {
      console.error(error);
      res.status(500).send('Error translating text');
  }
})

app.get('/summaries', authenticateToken, async (req, res) => {
  try {
      const summaries = await Summary.find({ userId: req.user.userId })
          .sort({ createdAt: -1 })
          .limit(20);
      res.json(summaries);
  } catch (error) {
      console.error(error);
      res.status(500).send('Error fetching summaries');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
