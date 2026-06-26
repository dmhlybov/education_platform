from fastapi import APIRouter

router = APIRouter(tags=["Проверка работоспособности приложения"])


@router.get("/health")
async def health():
    return {"status": "ok"}
