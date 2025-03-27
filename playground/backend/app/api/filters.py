import logging
from io import StringIO
from fastapi import APIRouter, HTTPException
from app.models.api_models import FilterRequest
from app.core.kernel import create_kernel
from app.filters.content_filters import input_filter_fn, output_filter_fn

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/filters", tags=["filters"])


@router.post("/process")
async def process_with_filters(request: FilterRequest):
    kernel, _ = create_kernel()
    try:
        # Set up log capture for this request
        logs = []
        log_capture = StringIO()
        log_handler = logging.StreamHandler(log_capture)
        log_handler.setFormatter(
            logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        )
        logger.addHandler(log_handler)

        # Add appropriate filters based on user selections
        filter_results = {
            "input_detected": [],
            "output_detected": [],
            "function_calls": [],
        }

        if request.filters.get("pii", True) or request.filters.get("profanity", True):
            # Add input and output filters
            kernel.add_filter("function_invocation", input_filter_fn)
            kernel.add_filter("function_invocation", output_filter_fn)

        # Create a demo function
        echo_function = kernel.add_function(
            prompt="{{$input}}", function_name="process_text", plugin_name="FiltersDemo"
        )

        # Process the input through our function
        logger.info(f"Processing text via kernel function with filters")
        result = await kernel.invoke(echo_function, input=request.text)

        # Get logs and clean up
        logger.removeHandler(log_handler)
        logs = log_capture.getvalue().splitlines()
        log_capture.close()

        # Parse the logs to extract input and output processing information
        input_processing = []
        output_processing = []

        for log in logs:
            if "Input Filter - Detected" in log:
                item = log.split("Input Filter - Detected")[1].strip()
                input_processing.append(item)
            elif "Output Filter - Detected" in log:
                item = log.split("Output Filter - Detected")[1].strip()
                output_processing.append(item)

        return {
            "input_processing": "Detected and redacted:\n" + "\n".join(input_processing)
            if input_processing
            else None,
            "output_processing": str(result),
            "logs": logs if request.filters.get("logging", True) else [],
        }

    except Exception as e:
        if "log_handler" in locals():
            logger.removeHandler(log_handler)
        logger.error(f"Error in process_with_filters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
