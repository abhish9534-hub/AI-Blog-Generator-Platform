import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// --- Mock Database ---
const users: any[] = [];
const blogs: any[] = [];

// --- API Routes ---

// Auth
app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ detail: "Email already registered" });
  }
  users.push({ email, password });
  res.status(201).json({ message: "Registered" });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ detail: "Invalid credentials" });
  }
  res.json({ access_token: `mock-token-${email}`, token_type: "bearer" });
});

// Blogs
app.post('/api/blogs/save', (req, res) => {
  const { title, content, topic, tone, keywords, seo_description } = req.body;
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: "Unauthorized" });
  }
  
  const email = authHeader.split('-').pop();

  const newBlog = {
    id: Math.random().toString(36).substr(2, 9),
    user_email: email,
    title,
    content,
    topic,
    tone,
    keywords,
    seo_description,
    created_at: new Date().toISOString()
  };

  blogs.push(newBlog);
  res.json(newBlog);
});

app.get('/api/blogs', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ detail: "Unauthorized" });
  
  const email = authHeader.split('-').pop();
  const userBlogs = blogs.filter(b => b.user_email === email);
  res.json(userBlogs);
});

app.delete('/api/blogs/:id', (req, res) => {
  const { id } = req.params;
  const index = blogs.findIndex(b => b.id === id);
  if (index !== -1) {
    blogs.splice(index, 1);
    res.json({ message: "Deleted" });
  } else {
    res.status(404).json({ detail: "Not found" });
  }
});

// --- Vite Middleware ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
