import re
import logging
import time
from typing import List, Dict, Tuple, Callable, Awaitable
from semantic_kernel.filters import FunctionInvocationContext

# Configure logging
logger = logging.getLogger(__name__)


class ContentFilter:
    def __init__(self):
        self.patterns = {
            "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
            "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "phone": r"\b(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b",
            "ssn": r"\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b",
        }

    def redact_sensitive_info(self, text: str) -> Tuple[str, List[str]]:
        """Redact sensitive information from text."""
        result = text
        detected = []

        for pattern_name, pattern in self.patterns.items():
            matches = re.finditer(pattern, result)
            for match in matches:
                detected.append(f"{pattern_name}: {match.group()}")
                result = result.replace(
                    match.group(), f"[REDACTED {pattern_name.upper()}]"
                )

        return result, detected


class ProfanityFilter:
    def __init__(self):
        # Simple demo list - in production, use a comprehensive profanity detection library
        self.profanity_list = ["badword1", "badword2", "offensive"]

    def filter_content(self, text: str) -> Tuple[str, List[str]]:
        """Filter out profanity from text."""
        result = text
        detected = []

        for word in self.profanity_list:
            if word in text.lower():
                detected.append(f"profanity: {word}")
                result = re.sub(word, "[REDACTED]", result, flags=re.IGNORECASE)

        return result, detected


# Input filter function for semantic kernel
async def input_filter_fn(
    context: FunctionInvocationContext,
    next: Callable[[FunctionInvocationContext], Awaitable[None]],
) -> None:
    """
    Filter function that detects and redacts sensitive information from function inputs.
    This demonstrates pre-processing in the Semantic Kernel pipeline.
    """
    logger.info(
        f"Input Filter - Processing input for {context.function.plugin_name}.{context.function.name}"
    )

    # Check if there's an input parameter
    if "input" in context.arguments:
        original_input = context.arguments["input"]

        # Apply content filter to input
        content_filter = ContentFilter()
        filtered_input, detected = content_filter.redact_sensitive_info(
            str(original_input)
        )

        if detected:
            logger.info(
                f"Input Filter - Detected sensitive information: {', '.join(detected)}"
            )

        # Apply profanity filter
        profanity_filter = ProfanityFilter()
        filtered_input, profanity_detected = profanity_filter.filter_content(
            filtered_input
        )

        if profanity_detected:
            logger.info(
                f"Input Filter - Detected profanity: {', '.join(profanity_detected)}"
            )
            detected.extend(profanity_detected)

        # Replace the original input with the filtered version
        context.arguments["input"] = filtered_input

        # Metadata handling is version-dependent
        # Let's try to be compatible with both SK versions
        try:
            # Try to store detection info for later use
            if hasattr(context, "metadata"):
                context.metadata["detected_items"] = detected
            else:
                # If metadata attribute doesn't exist, we'll just log the detections
                logger.info(f"Metadata not available, detections logged only")
        except Exception as e:
            logger.warning(f"Could not store metadata: {str(e)}")

    # Continue to the next filter or function
    await next(context)


# Output filter function for semantic kernel
async def output_filter_fn(
    context: FunctionInvocationContext,
    next: Callable[[FunctionInvocationContext], Awaitable[None]],
) -> None:
    """
    Filter function that processes function outputs.
    This demonstrates post-processing in the Semantic Kernel pipeline.
    """
    # First, continue to the next filter or execute the function
    start_time = time.time()
    await next(context)
    execution_time = time.time() - start_time

    logger.info(
        f"Output Filter - Function {context.function.plugin_name}.{context.function.name} executed in {execution_time:.4f}s"
    )

    # Process the output if it exists
    if context.result:
        logger.info(
            f"Output Filter - Processing result for {context.function.plugin_name}.{context.function.name}"
        )

        # Check for sensitive information in the output
        content_filter = ContentFilter()
        filtered_output, detected = content_filter.redact_sensitive_info(
            str(context.result)
        )

        if detected:
            logger.info(
                f"Output Filter - Detected sensitive information in output: {', '.join(detected)}"
            )

            try:
                # Try to store metadata if the attribute exists
                if hasattr(context, "metadata"):
                    context.metadata["original_output"] = str(context.result)
                    context.metadata["output_detected_items"] = detected
            except Exception as e:
                logger.warning(f"Could not store metadata: {str(e)}")

            # Replace with filtered output
            try:
                from semantic_kernel.functions import FunctionResult

                context.result = FunctionResult(
                    function=context.function.metadata, value=filtered_output
                )
            except Exception as e:
                # If FunctionResult fails, log it but continue
                logger.warning(f"Couldn't create FunctionResult: {str(e)}")
                # Try a direct string replacement as fallback
                context.result = filtered_output
