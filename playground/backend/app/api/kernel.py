import logging
from fastapi import APIRouter, HTTPException
from app.models.api_models import KernelResetRequest
from app.core.kernel import create_kernel, reset_memory

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/kernel", tags=["kernel"])


@router.post("/reset")
async def reset_kernel(request: KernelResetRequest):
    try:
        # Create a fresh kernel instance
        _, _ = create_kernel()

        # Clear memory if requested
        if request.clear_memory:
            await reset_memory()
            # Update the memory initialization flag in the memory module
            try:
                from app.api.memory import memory_initialized
                import app.api.memory as memory_module

                memory_module.memory_initialized = True
                logger.info("Memory reset and reinitialized")
            except ImportError:
                logger.warning("Could not update memory_initialized flag")

        return {
            "status": "success",
            "message": "Kernel reset successfully",
            "memory_cleared": request.clear_memory,
        }
    except Exception as e:
        logger.error(f"Error in reset_kernel: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
