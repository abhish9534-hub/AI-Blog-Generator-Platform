import streamlit as st
import requests
import os
import json
from datetime import datetime

# Configuration
API_URL = os.getenv("API_URL", "http://localhost:8000/api")

st.set_page_config(
    page_title="AI Blog Generator",
    page_icon="✍️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for a polished look
st.markdown("""
<style>
    .main {
        background-color: #f8f9fa;
    }
    .stButton>button {
        width: 100%;
        border-radius: 5px;
        height: 3em;
        background-color: #4F46E5;
        color: white;
    }
    .stButton>button:hover {
        background-color: #4338CA;
        color: white;
    }
    .blog-card {
        background-color: white;
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
    }
</style>
""", unsafe_allow_html=True)

# Session State Initialization
if 'token' not in st.session_state:
    st.session_state.token = None
if 'user_email' not in st.session_state:
    st.session_state.user_email = None
if 'page' not in st.session_state:
    st.session_state.page = 'Login'

# Helper Functions
def login(email, password):
    try:
        response = requests.post(
            f"{API_URL}/auth/login",
            data={"username": email, "password": password}
        )
        if response.status_code == 200:
            data = response.json()
            st.session_state.token = data['access_token']
            st.session_state.user_email = email
            st.session_state.page = 'Generator'
            st.rerun()
        else:
            st.error("Invalid email or password")
    except Exception as e:
        st.error(f"Connection error: {str(e)}")

def register(email, password):
    try:
        response = requests.post(
            f"{API_URL}/auth/register",
            json={"email": email, "password": password}
        )
        if response.status_code == 201:
            st.success("Registration successful! Please login.")
            st.session_state.page = 'Login'
            st.rerun()
        else:
            st.error(response.json().get('detail', "Registration failed"))
    except Exception as e:
        st.error(f"Connection error: {str(e)}")

def logout():
    st.session_state.token = None
    st.session_state.user_email = None
    st.session_state.page = 'Login'
    st.rerun()

# Sidebar Navigation
with st.sidebar:
    st.title("✍️ AI Blog Gen")
    if st.session_state.token:
        st.write(f"Logged in as: **{st.session_state.user_email}**")
        if st.button("Logout"):
            logout()
        st.divider()
        nav = st.radio("Navigation", ["Generator", "My Blogs"])
        st.session_state.page = nav
    else:
        st.info("Please login to generate blogs")

# Main Page Logic
if st.session_state.page == 'Login':
    st.title("Welcome Back")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        with st.form("login_form"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submit = st.form_submit_button("Login")
            if submit:
                login(email, password)
        if st.button("Don't have an account? Register"):
            st.session_state.page = 'Register'
            st.rerun()

elif st.session_state.page == 'Register':
    st.title("Create Account")
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        with st.form("register_form"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            confirm_password = st.text_input("Confirm Password", type="password")
            submit = st.form_submit_button("Register")
            if submit:
                if password != confirm_password:
                    st.error("Passwords do not match")
                else:
                    register(email, password)
        if st.button("Already have an account? Login"):
            st.session_state.page = 'Login'
            st.rerun()

elif st.session_state.page == 'Generator':
    st.title("🚀 AI Blog Generator")
    st.write("Fill in the details below to generate a high-quality, SEO-friendly blog post.")
    
    col1, col2 = st.columns([1, 1])
    with col1:
        topic = st.text_input("Blog Topic", placeholder="e.g. The Future of AI in Healthcare")
        keywords = st.text_area("Keywords (comma separated)", placeholder="e.g. AI, Healthcare, Technology, Future")
    
    with col2:
        tone = st.selectbox("Tone", ["Formal", "Casual", "Professional", "Witty", "Educational"])
        length = st.select_slider("Target Length (Words)", options=["500", "1000", "1500", "2000"], value="1000")
    
    if st.button("Generate Blog"):
        if not topic or not keywords:
            st.warning("Please provide both topic and keywords")
        else:
            with st.spinner("Gemini is crafting your blog... This may take a minute."):
                try:
                    headers = {"Authorization": f"Bearer {st.session_state.token}"}
                    response = requests.post(
                        f"{API_URL}/blogs/generate",
                        json={
                            "topic": topic,
                            "tone": tone,
                            "keywords": keywords,
                            "length": length
                        },
                        headers=headers
                    )
                    if response.status_code == 200:
                        blog = response.json()
                        st.success("Blog generated and saved!")
                        st.divider()
                        st.subheader(blog['title'])
                        st.info(f"**SEO Meta Description:** {blog['seo_description']}")
                        st.markdown(blog['content'])
                        
                        # Download button
                        st.download_button(
                            label="Download as Markdown",
                            data=blog['content'],
                            file_name=f"{topic.replace(' ', '_')}.md",
                            mime="text/markdown"
                        )
                    else:
                        st.error(f"Error: {response.json().get('detail', 'Failed to generate')}")
                except Exception as e:
                    st.error(f"Connection error: {str(e)}")

elif st.session_state.page == 'My Blogs':
    st.title("📚 My Blog History")
    
    try:
        headers = {"Authorization": f"Bearer {st.session_state.token}"}
        response = requests.get(f"{API_URL}/blogs/", headers=headers)
        
        if response.status_code == 200:
            blogs = response.json()
            if not blogs:
                st.info("You haven't generated any blogs yet. Go to the Generator page to start!")
            else:
                for blog in blogs:
                    with st.expander(f"📄 {blog['title']} - {datetime.fromisoformat(blog['created_at']).strftime('%Y-%m-%d')}"):
                        st.write(f"**Topic:** {blog['topic']} | **Tone:** {blog['tone']}")
                        st.write(f"**SEO Description:** {blog['seo_description']}")
                        st.divider()
                        st.markdown(blog['content'])
                        
                        col1, col2 = st.columns([1, 5])
                        with col1:
                            if st.button("Delete", key=f"del_{blog['id']}"):
                                del_resp = requests.delete(f"{API_URL}/blogs/{blog['id']}", headers=headers)
                                if del_resp.status_code == 200:
                                    st.success("Deleted!")
                                    st.rerun()
        else:
            st.error("Failed to fetch blogs")
    except Exception as e:
        st.error(f"Connection error: {str(e)}")
