# EduCast Python API tests

These tests are black-box API tests for a running EduCast backend.

## Local run

Start the application:

```powershell
docker compose up --build -d
```

Install dependencies:

```powershell
py -m pip install -r tests\requirements.txt
```

Run tests:

```powershell
py -m pytest tests
```

## VM run

Point tests at the VM URL:

```powershell
$env:EDUCAST_BASE_URL="http://10.93.27.50"
py -m pytest tests
```

## Notes

The suite covers public endpoints, validation behavior, duplicate user checks,
registration verification failure branches, resend failure branches, login
failure branches, and authentication requirements for protected podcast,
comment, vote, and save endpoints.

Successful verification and successful login require access to the generated
verification code from email or the database. They are not hard-coded because
the public API intentionally does not expose that code.
