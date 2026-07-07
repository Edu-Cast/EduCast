import httpx

from config import API_BASE_URL


class ApiError(Exception):
    pass


def _extract_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        return response.text or f"Request failed with status {response.status_code}"

    if isinstance(payload, dict):
        if "error" in payload:
            return str(payload["error"])
        return "; ".join(f"{field}: {message}" for field, message in payload.items())

    return str(payload)


# Uploads run synchronously through ml-service transcription on the backend side,
# which can take minutes for longer recordings, so give reads much more room than
# a plain login call.
UPLOAD_TIMEOUT = httpx.Timeout(connect=10, read=600, write=120, pool=10)


async def login(email: str, password: str) -> dict:
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=15) as client:
        try:
            response = await client.post(
                "/api/auth/login",
                json={"email": email, "password": password},
            )
        except httpx.HTTPError as error:
            raise ApiError(f"Network error while logging in: {error}") from error

    if response.status_code != 200:
        raise ApiError(_extract_error_message(response))

    return response.json()


async def upload_podcast(
    token: str,
    filename: str,
    content_type: str,
    content: bytes,
    title: str,
    description: str,
    subject: str,
    education_level: str,
) -> dict:
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=UPLOAD_TIMEOUT) as client:
        try:
            response = await client.post(
                "/api/podcasts",
                headers={"Authorization": f"Bearer {token}"},
                data={
                    "title": title,
                    "description": description,
                    "subject": subject,
                    "educationLevel": education_level,
                },
                files={"file": (filename, content, content_type)},
            )
        except httpx.TimeoutException as error:
            raise ApiError(
                "The server took too long to process this audio (transcription can be slow for long files). "
                "Try again or use a shorter recording."
            ) from error
        except httpx.HTTPError as error:
            raise ApiError(f"Network error while uploading: {error}") from error

    if response.status_code != 200:
        raise ApiError(_extract_error_message(response))

    return response.json()
