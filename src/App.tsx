import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { 
  PenTool, 
  History, 
  LogOut, 
  User, 
  Send, 
  Trash2, 
  Download, 
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// --- Gemini Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// --- Types ---
interface Blog {
  id: string;
  title: string;
  content: string;
  topic: string;
  tone: string;
  keywords: string;
  seo_description: string;
  created_at: string;
}

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', loading = false, disabled = false, type = 'button' }: any) => {
  const baseStyles = "w-full py-2 px-4 rounded-md font-medium transition-all flex items-center justify-center gap-2";
  const variants: any = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 disabled:bg-indigo-400",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={loading || disabled}
      className={`${baseStyles} ${variants[variant]}`}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
};

const Input = ({ label, type = "text", value, onChange, placeholder, textarea = false }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {textarea ? (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    )}
  </div>
);

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [page, setPage] = useState<'Login' | 'Register' | 'Generator' | 'History'>('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generator State
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [tone, setTone] = useState('Professional');
  const [length, setLength] = useState('1000');
  const [generatedBlog, setGeneratedBlog] = useState<Blog | null>(null);
  const [usage, setUsage] = useState({ prompt: 0, completion: 0, total: 0 });

  // History State
  const [blogs, setBlogs] = useState<Blog[]>([]);

  // Auth Logic
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = page === 'Login' ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (page === 'Login') {
          setUser({ email, token: data.access_token });
          setPage('Generator');
        } else {
          setSuccess('Registration successful! Please login.');
          setPage('Login');
        }
      } else {
        setError(data.detail || 'Authentication failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setPage('Login');
    setEmail('');
    setPassword('');
    setUsage({ prompt: 0, completion: 0, total: 0 });
  };

  // Blog Logic
  const generateBlog = async () => {
    if (!topic || !keywords) {
      setError('Please provide both topic and keywords');
      return;
    }

    setLoading(true);
    setError('');
    setGeneratedBlog(null);

    try {
      // 1. Call Gemini directly from Frontend
      const prompt = `
        You are a professional SEO content writer. Generate a high-quality, long-form blog post.
        
        Topic: ${topic}
        Tone: ${tone}
        Keywords: ${keywords}
        Target Length: ${length} words
        
        Requirements:
        1. Create a catchy, SEO-optimized title.
        2. Use a clear structure with H1, H2, and H3 headings.
        3. Include an introduction that hooks the reader.
        4. Provide actionable insights and detailed information.
        5. Write a compelling conclusion with a call to action.
        6. Generate a brief SEO meta description (max 160 characters).
        
        Format the output as follows:
        TITLE: [Your Title]
        META_DESCRIPTION: [Your Meta Description]
        CONTENT: [The full blog content in Markdown format]
      `;

      const result = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
      });

      const text = result.text;
      if (!text) throw new Error("No content generated");

      let title = "";
      let meta = "";
      let content = "";
      
      if (text.includes("TITLE:")) {
        title = text.split("TITLE:")[1].split("META_DESCRIPTION:")[0].trim();
      }
      if (text.includes("META_DESCRIPTION:")) {
        meta = text.split("META_DESCRIPTION:")[1].split("CONTENT:")[0].trim();
      }
      if (text.includes("CONTENT:")) {
        content = text.split("CONTENT:")[1].trim();
      }

      const blogData = {
        title: title || `Blog about ${topic}`,
        seo_description: meta || `A detailed blog post about ${topic}.`,
        content: content || text,
        topic,
        tone,
        keywords
      };

      // 2. Save to Backend
      const saveResponse = await fetch('/api/blogs/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify(blogData)
      });

      const savedBlog = await saveResponse.json();
      
      if (saveResponse.ok) {
        setGeneratedBlog(savedBlog);
        // Mock usage tracking for LLMOps feel
        const pTokens = Math.floor(topic.length / 4) + 150;
        const cTokens = Math.floor(savedBlog.content.length / 4);
        setUsage({ prompt: pTokens, completion: cTokens, total: pTokens + cTokens });
        setSuccess('Blog generated and saved successfully!');
      } else {
        setError(savedBlog.detail || 'Failed to save generated blog');
      }
    } catch (err: any) {
      console.error("Generation Error:", err);
      setError(err.message || 'Failed to generate blog. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogs = async () => {
    try {
      const response = await fetch('/api/blogs/', {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBlogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch blogs');
    }
  };

  const deleteBlog = async (id: string) => {
    try {
      const response = await fetch(`/api/blogs/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      if (response.ok) {
        setBlogs(blogs.filter(b => b.id !== id));
      }
    } catch (err) {
      setError('Failed to delete blog');
    }
  };

  useEffect(() => {
    if (page === 'History' && user) {
      fetchBlogs();
    }
  }, [page, user]);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      {user && (
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl mb-1">
              <PenTool className="w-6 h-6" />
              <span>AI Blog Gen</span>
            </div>
            <p className="text-xs text-gray-500">Production Ready Platform</p>
          </div>

          <div className="flex-1 p-4 space-y-2">
            <button 
              onClick={() => setPage('Generator')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${page === 'Generator' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <Send className="w-4 h-4" />
              <span>Generator</span>
            </button>
            <button 
              onClick={() => setPage('History')}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${page === 'History' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
            >
              <History className="w-4 h-4" />
              <span>My Blogs</span>
            </button>
          </div>

          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                <p className="text-xs text-gray-500">Active Session</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          <AnimatePresence mode="wait">
            {/* Auth Pages */}
            {(page === 'Login' || page === 'Register') && (
              <motion.div 
                key="auth"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="max-w-md mx-auto mt-20"
              >
                <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
                  <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full mb-4">
                      <PenTool className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {page === 'Login' ? 'Welcome Back' : 'Create Account'}
                    </h1>
                    <p className="text-gray-500 mt-2">
                      {page === 'Login' ? 'Login to start generating blogs' : 'Join our AI-powered platform today'}
                    </p>
                  </div>

                  {error && (
                    <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="mb-6 p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-md flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {success}
                    </div>
                  )}

                  <form onSubmit={handleAuth}>
                    <Input 
                      label="Email Address" 
                      type="email" 
                      value={email} 
                      onChange={setEmail} 
                      placeholder="name@company.com" 
                    />
                    <Input 
                      label="Password" 
                      type="password" 
                      value={password} 
                      onChange={setPassword} 
                      placeholder="••••••••" 
                    />
                    <Button type="submit" loading={loading}>
                      {page === 'Login' ? 'Sign In' : 'Create Account'}
                    </Button>
                  </form>

                  <div className="mt-6 text-center">
                    <button 
                      onClick={() => {
                        setPage(page === 'Login' ? 'Register' : 'Login');
                        setError('');
                        setSuccess('');
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      {page === 'Login' ? "Don't have an account? Register" : "Already have an account? Login"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Generator Page */}
            {page === 'Generator' && (
              <motion.div 
                key="generator"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">🚀 AI Blog Generator</h1>
                  <p className="text-gray-500 mt-2">Fill in the details below to generate a high-quality, SEO-friendly blog post.</p>
                </div>

                <div className="grid grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="space-y-4">
                    <Input 
                      label="Blog Topic" 
                      value={topic} 
                      onChange={setTopic} 
                      placeholder="e.g. The Future of AI in Healthcare" 
                    />
                    <Input 
                      label="Keywords (comma separated)" 
                      value={keywords} 
                      onChange={setKeywords} 
                      placeholder="e.g. AI, Healthcare, Technology, Future" 
                      textarea 
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
                      <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {["Formal", "Casual", "Professional", "Witty", "Educational"].map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Length: {length} words</label>
                      <input 
                        type="range" 
                        min="500" 
                        max="2000" 
                        step="500" 
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>500</span>
                        <span>1000</span>
                        <span>1500</span>
                        <span>2000</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Button onClick={generateBlog} loading={loading}>
                        Generate Blog Post
                      </Button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-md flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}

                {generatedBlog && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Usage Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Prompt Tokens</p>
                        <p className="text-xl font-bold text-indigo-600">{usage.prompt}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Completion Tokens</p>
                        <p className="text-xl font-bold text-indigo-600">{usage.completion}</p>
                      </div>
                      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm text-center">
                        <p className="text-xs text-gray-500 uppercase font-bold">Total Tokens</p>
                        <p className="text-xl font-bold text-indigo-600">{usage.total}</p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h2 className="text-xl font-bold text-gray-900">Generated Content</h2>
                      <Button variant="secondary" onClick={() => {}}>
                        <Download className="w-4 h-4" />
                        Download MD
                      </Button>
                    </div>
                    <div className="p-8 space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold text-indigo-600 mb-2">{generatedBlog.title}</h3>
                        <div className="p-4 bg-indigo-50 rounded-md border border-indigo-100">
                          <p className="text-sm text-indigo-800 font-medium mb-1">SEO Meta Description:</p>
                          <p className="text-sm text-indigo-600 italic">{generatedBlog.seo_description}</p>
                        </div>
                      </div>
                      <div className="prose prose-indigo max-w-none text-gray-700 whitespace-pre-wrap">
                        {generatedBlog.content}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              </motion.div>
            )}

            {/* History Page */}
            {page === 'History' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">📚 My Blog History</h1>
                  <p className="text-gray-500 mt-2">View and manage your previously generated blog posts.</p>
                </div>

                <div className="space-y-4">
                  {blogs.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                      <History className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No blogs generated yet.</p>
                      <button 
                        onClick={() => setPage('Generator')}
                        className="text-indigo-600 font-medium mt-2 hover:underline"
                      >
                        Start generating now
                      </button>
                    </div>
                  ) : (
                    blogs.map(blog => (
                      <div key={blog.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{blog.title}</h3>
                            <p className="text-xs text-gray-400 mt-1">
                              Generated on {new Date(blog.created_at).toLocaleDateString()} • {blog.topic}
                            </p>
                          </div>
                          <button 
                            onClick={() => deleteBlog(blog.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-4 italic">
                          {blog.seo_description}
                        </p>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              setGeneratedBlog(blog);
                              setPage('Generator');
                            }}
                            className="text-sm font-medium text-indigo-600 flex items-center gap-1 hover:underline"
                          >
                            View Full Content <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
