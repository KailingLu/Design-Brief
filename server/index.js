const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

// 中间件
app.use(cors());
app.use(express.json());

// 连接MongoDB
mongoose.connect('mongodb+srv://admin:admin123@cluster0.2tww7dh.mongodb.net/exhibition-hall-brief?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

// 定义Schema和Model
const briefSchema = new mongoose.Schema({
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

const Brief = mongoose.model('Brief', briefSchema);

// API路由
app.get('/api/briefs', async (req, res) => {
  try {
    const briefs = await Brief.find();
    res.json(briefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/briefs', async (req, res) => {
  try {
    const newBrief = new Brief(req.body);
    const savedBrief = await newBrief.save();
    res.json(savedBrief);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});