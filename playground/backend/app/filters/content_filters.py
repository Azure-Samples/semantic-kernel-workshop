import re
import logging
from typing import List, Dict, Tuple, Callable, Awaitable, Any
from semantic_kernel.filters import FunctionInvocationContext
from semantic_kernel.functions import FunctionResult

# Configure logging
logger = logging.getLogger(__name__)

# Regular expressions for sensitive data patterns
PATTERNS = {
    # Credit card format: XXXX-XXXX-XXXX-XXXX
    'credit_card': r'\b(?:\d{4}[-\s]?){3}\d{4}\b',
    # Email addresses
    'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    # Phone numbers
    'phone': r'\b(?:\+\d{1,3}[-\s]?)?\(?\d{3}\)?[-\s]?\d{3}[-\s]?\d{4}\b',
    'ssn': r'\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b',  # Social Security Numbers (US)
}


class ContentFilter:
    def __init__(self, patterns=PATTERNS):
        self.patterns = patterns

    def redact_sensitive_info(self, text: str) -> tuple[str, list[str]]:
        """Redact sensitive information from text and return detected items."""
        if not text:
            return text, []

        result = text
        detected = []

        logger.debug(
            f"Checking text for sensitive info: {text[:50]}{'...' if len(text) > 50 else ''}")

        for pattern_name, pattern in self.patterns.items():
            matches = re.finditer(pattern, result)
            match_found = False

            for match in matches:
                match_found = True
                match_value = match.group()
                detected.append(f"{pattern_name}: {match_value}")
                result = result.replace(
                    match_value, f"[REDACTED {pattern_name.upper()}]")

            if match_found:
                logger.debug(f"Found {pattern_name} pattern match in text")

        if detected:
            logger.debug(
                f"Detected {len(detected)} instances of sensitive information")

        return result, detected

    # Add a test function to explicitly verify regex patterns work
    def test_patterns(self):
        """Test function to verify regex patterns work correctly."""
        logger.info("Testing regex patterns...")
        test_inputs = {
            "credit_card": "4111-1111-1111-1111",
            "email": "john.doe@example.com",
            "phone": "(555) 123-4567",
            "ssn": "123-45-6789"
        }

        for pattern_name, test_input in test_inputs.items():
            logger.info(
                f"Testing pattern '{pattern_name}' with input '{test_input}'")

            pattern = self.patterns[pattern_name]
            match = re.search(pattern, test_input)

            if match:
                logger.info(
                    f"✅ Pattern '{pattern_name}' matched input '{test_input}'")
            else:
                logger.error(
                    f"❌ Pattern '{pattern_name}' failed to match input '{test_input}'")

        # Also test a combined string
        combined = "Credit card: 4111-1111-1111-1111, email: john.doe@example.com"
        logger.info(f"Testing combined input: '{combined}'")
        result, detected = self.redact_sensitive_info(combined)
        logger.info(f"Combined detection result: {detected}")
        logger.info(f"Redacted text: {result}")

        return detected

# Input filter function for semantic kernel


async def input_filter_fn(
    context: FunctionInvocationContext,
    next: Callable[[FunctionInvocationContext], Awaitable[None]],
) -> None:
    """
    Filter function that detects and redacts sensitive information from function inputs.
    This demonstrates pre-processing in the Semantic Kernel pipeline.
    """
    content_filter = ContentFilter()

    # Check if there's an input parameter
    if "input" in context.arguments:
        original_input = context.arguments["input"]

        # Apply the filter
        filtered_input, detected = content_filter.redact_sensitive_info(
            original_input)

        if detected:
            # Make sure the log message is obvious
            logger.warning(
                f"SENSITIVE INFORMATION IN INPUT DETECTED: {', '.join(detected)}")
            # For compatibility with different log message formats
            logger.warning(
                f"Sensitive information detected in input: {', '.join(detected)}")
            logger.info(f"Input Filter - Detected: {', '.join(detected)}")

        # Replace the original input with the filtered version
        context.arguments["input"] = filtered_input

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
    await next(context)

    # Process the output if it exists
    if context.result:
        content_filter = ContentFilter()
        original_output = str(context.result)

        # Apply the filter
        filtered_output, detected = content_filter.redact_sensitive_info(
            original_output)

        if detected:
            # Make sure the log message is obvious
            logger.warning(
                f"SENSITIVE INFORMATION IN OUTPUT DETECTED: {', '.join(detected)}")
            # For compatibility with different log message formats
            logger.warning(
                f"Sensitive information detected in output: {', '.join(detected)}")
            logger.info(f"Output Filter - Detected: {', '.join(detected)}")

        # Create a new FunctionResult with the filtered output
        context.result = FunctionResult(
            function=context.function.metadata,
            value=filtered_output,
            metadata=context.result.metadata if hasattr(
                context.result, 'metadata') else {}
        )
