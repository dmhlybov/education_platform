import uvicorn
from backend.core.app.app import create_app

app = create_app()

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8003,
        timeout_keep_alive=120,
        use_colors=True,
        reload=True,
    )
