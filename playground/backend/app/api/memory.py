import logging
from fastapi import APIRouter, HTTPException
from app.models.api_models import MemoryItem, SearchQuery
from app.core.kernel import create_kernel, FINANCE_COLLECTION, PERSONAL_COLLECTION, WEATHER_COLLECTION, initialize_memory

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/memory", tags=["memory"])

# Flag to track if memory has been initialized
memory_initialized = False

@router.post("/add")
async def add_to_memory(item: MemoryItem):
    _, memory_instance = create_kernel()
    try:
        await memory_instance.save_information(
            collection=item.collection,
            id=item.id,
            text=item.text
        )
        return {
            "status": "success", 
            "message": f"Added item {item.id} to collection {item.collection}",
            "synthesized_response": "",
            "critique": ""
        }
    except Exception as e:
        logger.error(f"Error in add_to_memory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_memory(query: SearchQuery):
    # Ensure memory is initialized before searching
    global memory_initialized
    if not memory_initialized:
        await initialize_memory()
        memory_initialized = True
        
    _, memory_instance = create_kernel()
    try:
        results = await memory_instance.search(
            collection=query.collection,
            query=query.query,
            limit=query.limit
        )
        
        # Format the results to match what the frontend expects
        formatted_results = [{"id": r.id, "text": r.text, "relevance": r.relevance} for r in results]
        
        # Return the results with empty synthesized_response and critique fields
        # to match the format the frontend expects
        return {
            "results": formatted_results,
            "synthesized_response": "",
            "critique": ""
        }
    except Exception as e:
        logger.error(f"Error in search_memory: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/collections")
async def get_collections():
    try:
        # Initialize memory if not already done
        global memory_initialized
        if not memory_initialized:
            await initialize_memory()
            memory_initialized = True
            logger.info("Memory initialized on first access to collections")
        
        # Return the predefined collections
        return {
            "collections": [FINANCE_COLLECTION, PERSONAL_COLLECTION, WEATHER_COLLECTION],
            "status": "success"
        }
    except Exception as e:
        logger.error(f"Error in get_collections: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
