from backend.modules.health import router as router_health
from backend.modules.users import router as router_auth
from backend.modules.courses import router as router_courses
from backend.modules.quizzes import router as router_quizzes
from backend.modules.uploads import router as router_uploads


def setup_router(app):
    app.include_router(router_auth, prefix="/api")
    app.include_router(router_courses, prefix="/api")
    app.include_router(router_quizzes, prefix="/api")
    app.include_router(router_uploads, prefix="/api")
    app.include_router(router_health)

    return app
