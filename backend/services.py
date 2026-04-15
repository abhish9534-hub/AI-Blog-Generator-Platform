import os
import logging
import google.generativeai as genai
from typing import Optional, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.error("GEMINI_API_KEY not found in environment variables")
            raise ValueError("GEMINI_API_KEY is required")
        
        genai.configure(api_key=api_key)
        # Using gemini-1.5-flash for speed and efficiency in blog generation
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def generate_blog(self, topic: str, tone: str, keywords: str, length: str) -> Dict[str, str]:
        prompt = f"""
        You are a professional SEO content writer. Generate a high-quality, long-form blog post.
        
        Topic: {topic}
        Tone: {tone}
        Keywords: {keywords}
        Target Length: {length} words
        
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
        """
        
        try:
            response = self.model.generate_content(prompt)
            text = response.text
            
            # Simple parsing of the structured response
            title = ""
            meta = ""
            content = ""
            
            if "TITLE:" in text:
                title = text.split("TITLE:")[1].split("META_DESCRIPTION:")[0].strip()
            if "META_DESCRIPTION:" in text:
                meta = text.split("META_DESCRIPTION:")[1].split("CONTENT:")[0].strip()
            if "CONTENT:" in text:
                content = text.split("CONTENT:")[1].strip()
            
            return {
                "title": title or f"Blog about {topic}",
                "seo_description": meta or f"A detailed blog post about {topic}.",
                "content": content or text
            }
            
        except Exception as e:
            logger.error(f"Error generating blog with Gemini: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to generate blog content")

# Singleton instance
gemini_service = GeminiService()
