import logging
from io import StringIO
from fastapi import APIRouter, HTTPException
from app.models.api_models import FilterRequest
from app.core.kernel import create_kernel
from app.filters.content_filters import ContentFilter, input_filter_fn, output_filter_fn
from semantic_kernel.functions import kernel_function

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/filters", tags=["filters"])

# Run a test of our regex patterns to verify they work
logger.info("Initializing filters API and testing regex patterns...")
content_filter = ContentFilter()
test_results = content_filter.test_patterns()
logger.info(f"Pattern test results: {test_results}")


@router.post("/process")
async def process_with_filters(request: FilterRequest):
    try:
        kernel, _ = create_kernel()

        # Set up log capture for this request
        logs = ""
        log_capture = StringIO()
        log_handler = logging.StreamHandler(log_capture)
        log_handler.setFormatter(
            logging.Formatter("%(asctime)s - %(levelname)s - %(message)s")
        )
        # Set logging level to capture all messages
        log_handler.setLevel(logging.DEBUG)

        # Add handler to root logger to capture all logs
        root_logger = logging.getLogger()
        root_logger.addHandler(log_handler)

        try:
            # Directly log input for debugging
            logger.warning(
                f"PROCESSING INPUT: {request.text[:50]}{'...' if len(request.text) > 50 else ''}")

            # Process with the content filter
            content_filter = ContentFilter()

            # Directly test the input for sensitive information
            logger.warning(f"Testing input directly with ContentFilter")
            filtered_input, input_detections = content_filter.redact_sensitive_info(
                request.text)

            if input_detections:
                logger.warning(
                    f"⚠️ DETECTION ALERT: Found {len(input_detections)} sensitive items in input")
                for detection in input_detections:
                    logger.warning(f"🔍 Input Detection: {detection}")
                input_processing = f"Detected {len(input_detections)} instances of sensitive information in the input."
            else:
                logger.warning(
                    "✅ SECURITY CHECK: No sensitive information found in input")
                input_processing = "No sensitive information detected in the input."
                input_detections = []

            # Create a simple semantic function with a prompt template
            prompt_template = "{{$input}}"  # Simple echo prompt

            echo_fn = kernel.add_function(
                prompt=prompt_template,
                function_name="echo",
                plugin_name="TestPlugin",
            )

            # Process with kernel
            result = await kernel.invoke(echo_fn, input=request.text)

            # Get result content (in v0.9.1b1 FunctionResult is just the string content)
            result_content = str(result)

            # Process the output with the content filter
            filtered_output, output_detections = content_filter.redact_sensitive_info(
                result_content)

            if output_detections:
                logger.warning(
                    f"⚠️ DETECTION ALERT: Found {len(output_detections)} sensitive items in output")
                for detection in output_detections:
                    logger.warning(f"🔍 Output Detection: {detection}")
                output_processing = f"Detected {len(output_detections)} instances of sensitive information in the output."
            else:
                logger.warning(
                    "✅ SECURITY CHECK: No sensitive information found in output")
                output_processing = "No sensitive information detected in the output."
                output_detections = []

            # Ensure we always return input_detections and output_detections lists
            input_detections = input_detections if 'input_detections' in locals() else []
            output_detections = output_detections if 'output_detections' in locals() else []

            # Everything succeeded, now capture logs
            logs = log_capture.getvalue()

            return {
                "result": result_content,
                "debug": {
                    "input_processing": input_processing,
                    "output_processing": output_processing,
                    "logs": logs,
                    "log_count": len(logs.split('\n')) if logs else 0,
                    "input_detections": input_detections,
                    "output_detections": output_detections,
                },
            }

        except Exception as e:
            logger.error(f"Error in process_with_filters: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

        finally:
            # Always clean up the log handler
            if log_handler in root_logger.handlers:
                root_logger.removeHandler(log_handler)
            if log_capture and not log_capture.closed:
                log_capture.close()

    except Exception as e:
        logger.error(f"Error in process_with_filters: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
