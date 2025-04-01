"""
This file is maintained for backward compatibility.
All functionality has been moved to the app/ directory.
"""

from app.main import app

# Re-export app for backward compatibility
# This ensures that any code importing from main.py continues to work

if __name__ == "__main__":
    import uvicorn
    import os

    # Read host and port from environment variables, with defaults
    host = os.environ.get("BACKEND_HOST", "0.0.0.0")
    port = int(os.environ.get("BACKEND_PORT", 8000))

    uvicorn.run("app.main:app", host=host, port=port, reload=True)
