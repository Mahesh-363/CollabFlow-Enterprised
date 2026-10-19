"""
Standard API error handler for CollabFlow API v1.
Returns consistent JSON payload:
{
    "success": false,
    "error": {
        "code": "validation_error",
        "message": "Human readable summary",
        "details": {}
    }
}
"""

from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_code = getattr(exc, "default_code", "error")
        if response.status_code == 400:
            error_code = "validation_error"
        elif response.status_code == 401:
            error_code = "authentication_failed"
        elif response.status_code == 403:
            error_code = "permission_denied"
        elif response.status_code == 404:
            error_code = "not_found"
        elif response.status_code == 429:
            error_code = "rate_limit_exceeded"

        message = "An error occurred while processing your request."
        if isinstance(response.data, dict):
            if "detail" in response.data:
                message = str(response.data["detail"])
            elif "non_field_errors" in response.data:
                message = " ".join(str(e) for e in response.data["non_field_errors"])
            else:
                first_key = next(iter(response.data))
                message = f"{first_key}: {response.data[first_key]}"
        elif isinstance(response.data, list) and response.data:
            message = str(response.data[0])

        custom_data = {
            "success": False,
            "error": {
                "code": error_code,
                "message": message,
                "status_code": response.status_code,
                "details": (
                    response.data if isinstance(response.data, dict) else {"errors": response.data}
                ),
            },
        }
        response.data = custom_data

    return response
