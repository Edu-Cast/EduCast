# EduCast API Documentation

## Base URL
```
http://10.93.27.50/api
```
For local development: `http://localhost:8080/api`
 
---

## Authentication

The API uses **JWT (JSON Web Token)** authentication. After a successful login, the server returns a token that must be included in every protected request via the header:

```
Authorization: Bearer <token>
```

The token is valid for **24 hours**. After expiration, the user must log in again.

Public endpoints (no token required) are marked with 🔓. All others require a valid JWT token.
 
---

## Auth Endpoints

### 🔓 Initiate Registration
Creates a user and sends a verification code to the provided email.

```
POST /auth/register/init
```

**Request body:**
```json
{
  "login": "ivan123",
  "email": "ivan@example.com",
  "password": "Password123"
}
```


**Field validation:**  

| Field | Requirements |  
|-------|-------------|
| `login` | 4–30 characters, only latin letters, digits, and `_` |
| `email` | Valid email format |
| `password` | Min 8 characters, at least 1 uppercase letter, 1 lowercase letter, 1 digit |

**Success response `200 OK`:**
```json
{
  "email": "ivan@example.com",
  "login": "ivan123",
  "verified": false
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Validation error (invalid email, weak password, etc.) |
| `400` | Email is already in use |
| `400` | Login is already in use |
 
---

### 🔓 Verify Email
Confirms registration using the code sent to the email. After this step the user can log in.

```
POST /auth/register/verify
```

**Request body:**
```json
{
  "email": "ivan@example.com",
  "verificationCode": 123456
}
```

**Success response `200 OK`:**
```json
{
  "email": "ivan@example.com",
  "login": "ivan123",
  "verified": true
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | User not found |
| `400` | Wrong verification code |
| `409` | Verification code expired — request a new one |
 
---

### 🔓 Resend Verification Code
Sends a new verification code. Can be called at most once every **30 seconds**.

```
POST /auth/register/resend
```

**Request body:**
```json
{
  "email": "ivan@example.com"
}
```

**Success response `200 OK`:**
```json
{
  "email": "ivan@example.com",
  "login": "ivan123",
  "verified": false
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | User not found |
| `400` | Email is already verified |
| `400` | Please wait N seconds before requesting a new code |
 
---

### 🔓 Login
Returns a JWT token for accessing protected endpoints.

```
POST /auth/login
```

**Request body:**
```json
{
  "email": "ivan@example.com",
  "password": "Password123"
}
```

**Success response `200 OK`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "ivan@example.com",
  "login": "ivan123"
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Invalid email or password |
| `400` | Email is not verified |
 
---

## Podcast Endpoints

### 🔓 Get All Podcasts
Returns a list of all uploaded podcasts. Accessible without authentication.

```
GET /podcasts
```

**Success response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Introduction to Calculus",
    "description": "A beginner-friendly overview of calculus fundamentals.",
    "subject": "MATHEMATICS",
    "educationLevel": "UNIVERSITY",
    "durationSeconds": 1842,
    "fileSizeBytes": 29360128,
    "authorLogin": "ivan123",
    "createdAt": "2026-06-14T10:23:00Z",
    "score": 12
  }
]
```
 
---

### Upload Podcast
Uploads a new podcast. Requires authentication. Request must be `multipart/form-data`.

```
POST /podcasts
```

**Form fields:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Audio file (mp3, ogg, wav, m4a, aac) |
| `title` | String | Podcast title (max 150 characters) |
| `description` | String | Podcast description (max 1000 characters) |
| `subject` | String | One of the subject enum values (see below) |
| `educationLevel` | String | `SCHOOL` or `UNIVERSITY` |

**Available subject values:**
`BIOLOGY`, `CHEMISTRY`, `PHYSICS`, `MATHEMATICS`, `GEOGRAPHY`, `HISTORY`, `LITERATURE`, `COMPUTER_SCIENCE`, `MATHEMATICAL ANALYSIS` `ECONOMICS`, `PHILOSOPHY`, `PSYCHOLOGY`, `LAW`, `BUSINESS`, `LANGUAGES`, `ART`, `MUSIC`, `PHYSICAL_EDUCATION`, `SOCIOLOGY`, `OTHER`

**Success response `200 OK`:**
```json
{
  "id": 1,
  "title": "Introduction to Calculus",
  "description": "A beginner-friendly overview of calculus fundamentals.",
  "subject": "MATHEMATICS",
  "educationLevel": "UNIVERSITY",
  "durationSeconds": 1842,
  "fileSizeBytes": 29360128,
  "authorLogin": "ivan123",
  "createdAt": "2026-06-14T10:23:00Z",
  "score": 0
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Invalid file type (only mp3, ogg, wav, m4a, aac allowed) |
| `400` | File is empty |
 
---

### 🔓 Get Podcast
Returns detailed information about a podcast by its ID.

```
GET /podcasts/{id}
```

**Success response `200 OK`:**
```json
{
  "id": 1,
  "title": "Introduction to Calculus",
  "description": "A beginner-friendly overview of calculus fundamentals.",
  "subject": "MATHEMATICS",
  "educationLevel": "UNIVERSITY",
  "durationSeconds": 1842,
  "fileSizeBytes": 29360128,
  "authorLogin": "ivan123",
  "createdAt": "2026-06-14T10:23:00Z",
  "score": 12,
  "audioUrl": "/api/podcasts/1/audio"
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Podcast not found |

---

### 🔓 Get Podcast Audio
Returns the audio file of a podcast.

```
GET /podcasts/{id}/audio
```

**Success response `200 OK`:**

Returns the podcast audio file with the appropriate `Content-Type`.

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Podcast not found |

---


### Delete Podcast
Deletes a podcast. Only the **author** of the podcast can delete it.

```
DELETE /podcasts/{id}
```

**Success response `200 OK`** — empty body.

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Podcast not found or you don't have permission to delete it |
 
---

## Voting Endpoints

### Vote on a Podcast
Submit a like (+1) or dislike (-1) for a podcast. Calling with the same value again **cancels** the vote. Calling with the opposite value **switches** the vote.

```
POST /podcasts/{id}/vote
```

**Request body:**
```json
{
  "vote": 1
}
```

| Value | Action |
|-------|--------|
| `1` | Like (increases score by 1) |
| `-1` | Dislike (decreases score by 1) |

**Success response `200 OK`:**
```json
{
  "score": 13
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Podcast not found |
| `400` | Invalid vote value (must be 1 or -1) |
 
---

## Saved Podcasts Endpoints

### Toggle Save
Saves a podcast to the current user's collection, or removes it if already saved. Works as a toggle.

```
POST /podcasts/{id}/save
```

**Success response `200 OK`:**
```json
{
  "message": "Podcast saved"
}
```
or
```json
{
  "message": "Podcast removed from saved"
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Podcast not found |
 
---

### Get Saved Podcasts
Returns the list of podcasts saved by the current user.

```
GET /podcasts/saved
```

**Success response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Introduction to Calculus",
    "description": "A beginner-friendly overview of calculus fundamentals.",
    "subject": "MATHEMATICS",
    "educationLevel": "UNIVERSITY",
    "durationSeconds": 1842,
    "fileSizeBytes": 29360128,
    "authorLogin": "ivan123",
    "createdAt": "2026-06-14T10:23:00Z",
    "score": 12
  }
]
```

### 🔓 Get Popular Podcasts
Returns podcasts with the highest score.

```
GET /podcasts/popular
```

**Success response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Introduction to Calculus",
    "description": "A beginner-friendly overview of calculus fundamentals.",
    "subject": "MATHEMATICS",
    "educationLevel": "UNIVERSITY",
    "durationSeconds": 1842,
    "fileSizeBytes": 29360128,
    "authorLogin": "ivan123",
    "createdAt": "2026-06-14T10:23:00Z",
    "score": 120
  }
]
```

---

### Get My Podcasts
Returns the list of podcasts uploaded by the current user.

```
GET /podcasts/my
```

**Success response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Introduction to Calculus",
    "description": "A beginner-friendly overview of calculus fundamentals.",
    "subject": "MATHEMATICS",
    "educationLevel": "UNIVERSITY",
    "durationSeconds": 1842,
    "fileSizeBytes": 29360128,
    "authorLogin": "ivan123",
    "createdAt": "2026-06-14T10:23:00Z",
    "score": 12
  }
]
```

---

### 🔓 Get Popular Podcasts by Subject
Returns podcasts with the highest score for the specified subject.

```
GET /podcasts/popular/{subject}
```

**Path parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `subject` | String | Subject enum value |

**Success response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Introduction to Calculus",
    "description": "A beginner-friendly overview of calculus fundamentals.",
    "subject": "MATHEMATICS",
    "educationLevel": "UNIVERSITY",
    "durationSeconds": 1842,
    "fileSizeBytes": 29360128,
    "authorLogin": "ivan123",
    "createdAt": "2026-06-14T10:23:00Z",
    "score": 120
  }
]
```


### 🔓 Search Podcasts
Searches podcasts by title, subject, and education level. All query parameters are optional and can be combined.

```
GET /podcasts/search
```

**Query parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | String | No | Search query |
| `subject` | String | No | Subject enum value |
| `educationLevel` | String | No | `SCHOOL` or `UNIVERSITY` |

**Success response `200 OK`:**
```json
[
  {
    "id": 1,
    "title": "Introduction to Calculus",
    "description": "A beginner-friendly overview of calculus fundamentals.",
    "subject": "MATHEMATICS",
    "educationLevel": "UNIVERSITY",
    "durationSeconds": 1842,
    "fileSizeBytes": 29360128,
    "authorLogin": "ivan123",
    "createdAt": "2026-06-14T10:23:00Z",
    "score": 12
  }
]
```


---

## Comment Endpoints

### Add Comment
Adds a comment to a podcast.

```
POST /podcasts/{id}/comments
```

**Request body:**
```json
{
  "text": "Really helpful explanation!"
}
```

**Field validation:**

| Field | Requirements |
|-------|-------------|
| `text` | Non-empty, max 1000 characters |

**Success response `200 OK`:**
```json
{
  "id": 5,
  "text": "Really helpful explanation!",
  "authorLogin": "ivan123",
  "createdAt": "2026-06-14T11:00:00Z"
}
```

**Possible errors:**
| Code | Description |
|------|-------------|
| `400` | Podcast not found |
| `400` | Comment text is empty or too long |
 
---

### 🔓 Get Comments
Returns all comments for a podcast, ordered by newest first. Accessible without authentication.

```
GET /podcasts/{id}/comments
```

**Success response `200 OK`:**
```json
[
  {
    "id": 5,
    "text": "Really helpful explanation!",
    "authorLogin": "ivan123",
    "createdAt": "2026-06-14T11:00:00Z"
  }
]
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Podcast not found |
 
---

### Delete Comment
Deletes a comment. Can be performed by the **comment author** or the **podcast owner**.

```
DELETE /podcasts/comments/{commentId}
```

**Success response `200 OK`** — empty body.

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Comment not found |
| `400` | You don't have permission to delete this comment |
 
---

## General Error Format

All errors follow a consistent format:

```json
{
  "error": "Error description"
}
```

For validation errors (multiple invalid fields):

```json
{
  "email": "Incorrect email format",
  "password": "Password should contain from 8 to 100 symbols"
}
```
 
---

## Registration & Login Flow

```
1. POST /auth/register/init   → submit registration data, receive code via email
2. POST /auth/register/verify → submit the code from the email
3. POST /auth/login           → receive JWT token
4. All subsequent requests    → Authorization: Bearer <token>
```

## ML Service Endpoints

Base URL:
```
http://10.93.27.50:8000
```
For local development: `http://localhost:8000`

These endpoints are called internally by the backend when a podcast is uploaded (`POST /process-audio`) and are not protected by JWT — they sit on a separate internal service, not behind `/api`.

---

### 🔓 Process Audio
Transcribes an audio file, extracts keyword tags, and validates whether the content is educational.

```
POST /process-audio
```

**Request:** `multipart/form-data`

| Field | Type | Description |
|-------|------|-------------|
| `file` | File | Audio file (mp3, wav, m4a, ogg, mp4, webm, flac) |

**Success response `200 OK`:**
```json
{
  "language": "ru",
  "duration_sec": 92.4,
  "transcription": "Today we'll cover bubble sort...",
  "is_educational": true,
  "validation_reason": "Keyword fallback: matched 3 marker(s)",
  "tags": ["algorithm", "bubble sort"]
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `400` | Unsupported format: `{ext}` (only mp3, wav, m4a, ogg, mp4, webm, flac allowed) |

---

### 🔓 Validate Text
Debug endpoint — runs only the educational-content validation step on a raw text string, without transcribing any audio. Useful for testing the classifier in isolation.

```
POST /validate-text
```

**Request body:**
```json
{
  "text": "today we'll cover bubble sort and its complexity"
}
```

**Success response `200 OK`:**
```json
{
  "is_educational": true,
  "validation_reason": "Keyword fallback: matched 1 marker(s)",
  "subject": ""
}
```

**Possible errors:**

| Code | Description |
|------|-------------|
| `422` | Missing or malformed `text` field (FastAPI's default validation error format, not the usual `{"error": ...}`) |
