"""
This file is maintained for backward compatibility.
All functionality has been moved to the app/ directory.
"""

from app.main import app

# Re-export app for backward compatibility
# This ensures that any code importing from main.py continues to work

if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
