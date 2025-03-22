import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import memory, functions, weather, agents, filters, kernel, process

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Semantic Kernel Demo API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(memory.router)
app.include_router(functions.router)
app.include_router(weather.router)
app.include_router(agents.router)
app.include_router(filters.router)
app.include_router(kernel.router)
app.include_router(process.router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Semantic Kernel Demo API is running"}

# Note: Memory initialization is now done on-demand when accessing memory endpoints

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
