call .\backend\.venv\Scripts\activate.bat
uvicorn backend.main:app --port 8001 > uvicorn_error.txt 2>&1
echo Done >> uvicorn_error.txt
