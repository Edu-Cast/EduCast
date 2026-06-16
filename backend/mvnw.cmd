@echo off
if exist .mvn\wrapper\maven-wrapper.cmd (
  call .mvn\wrapper\maven-wrapper.cmd %*
  exit /b %errorlevel%
)

where mvn >nul 2>nul
if %errorlevel%==0 (
  mvn %*
  exit /b %errorlevel%
)

echo Maven not found. Install Maven or add full Maven Wrapper scripts.
exit /b 1
