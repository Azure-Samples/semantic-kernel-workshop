import logging
from fastapi import APIRouter, HTTPException
from app.models.api_models import FunctionInput, TranslationRequest, SummarizeRequest
from app.core.kernel import create_kernel

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(tags=["functions"])

@router.post("/functions/semantic")
async def invoke_semantic_function(data: FunctionInput):
    kernel, _ = create_kernel()
    try:
        # Create a semantic function
        function = kernel.add_function(
            prompt=data.prompt,
            function_name=data.function_name,
            plugin_name=data.plugin_name,
            max_tokens=500
        )
        
        # Prepare parameters
        parameters = data.parameters or {}
        
        # Invoke the function
        result = await kernel.invoke(
            function,
            input=data.input_text,
            **parameters
        )
        
        return {"result": str(result)}
    except Exception as e:
        logger.error(f"Error in invoke_semantic_function: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/translate")
async def translate_text(request: TranslationRequest):
    kernel, _ = create_kernel()
    try:
        # Define a translation function
        translate_prompt = """
        {{$input}}\n\nTranslate this into {{$target_language}}:"""
        
        translate_fn = kernel.add_function(
            prompt=translate_prompt,
            function_name="translator",
            plugin_name="Translator",
            max_tokens=500
        )
        
        # Invoke the translation function
        result = await kernel.invoke(
            translate_fn,
            input=request.text,
            target_language=request.target_language
        )
        
        return {"translated_text": str(result)}
    except Exception as e:
        logger.error(f"Error in translate_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    kernel, _ = create_kernel()
    try:
        # Define a summarization function
        summarize_prompt = """
        {{$input}}\n\nTL;DR in one sentence:"""
        
        summarize_fn = kernel.add_function(
            prompt=summarize_prompt,
            function_name="tldr",
            plugin_name="Summarizer",
            max_tokens=100
        )
        
        # Invoke the summarization function
        result = await kernel.invoke(
            summarize_fn,
            input=request.text
        )
        
        return {"summary": str(result)}
    except Exception as e:
        logger.error(f"Error in summarize_text: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
