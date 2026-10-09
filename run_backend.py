import uvicorn
import os
import sys

# Ensure backend folder is in Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(current_dir, "backend")
sys.path.insert(0, backend_path)

# Load local environment variables from backend/.env
from dotenv import load_dotenv
load_dotenv(os.path.join(backend_path, ".env"))

if __name__ == "__main__":
    print("=================================================================")
    print(" starting Flood & Emergency Incident Reporting Backend")
    print(" SQLite Database: backend/emergency.db")
    print(" API URL: http://127.0.0.1:8000")
    print(" API Documentation: http://127.0.0.1:8000/docs")
    print(" Default Operator: username: operator (Configure password via OPERATOR_PASSWORD)")
    print("=================================================================")
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
