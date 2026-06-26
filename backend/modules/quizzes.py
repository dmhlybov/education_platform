from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.core.app.deps import current_active_user_ctx
from backend.database import get_async_session
from backend.models.learn import (
    Attempt,
    AttemptAnswer,
    CourseAssignment,
    Question,
    Quiz,
)
from backend.schemas.auth import UserContext
from backend.schemas.learn import QuizSubmissionRequest, QuizSubmissionResult

router = APIRouter(prefix="/quizzes", tags=["Ответы"])


@router.post("/{quiz_id}/submit", response_model=QuizSubmissionResult)
async def submit_quiz(
    quiz_id: int,
    payload: QuizSubmissionRequest,
    user: UserContext = Depends(current_active_user_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(Quiz)
        .options(selectinload(Quiz.questions).selectinload(Question.options))
        .where(Quiz.id == quiz_id)
    )
    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    if not user.is_admin:
        assigned_id = await db.scalar(
            select(CourseAssignment.id).where(
                CourseAssignment.course_id == quiz.course_id,
                CourseAssignment.user_id == user.id,
            )
        )

        if assigned_id is None:
            raise HTTPException(
                status_code=403,
                detail="Course is not assigned to this student",
            )

    selected_map: dict[int, set[int]] = {
        item.question_id: set(item.selected_option_ids) for item in payload.answers
    }

    score = 0
    total_questions = len(quiz.questions)
    correct_question_ids: list[int] = []

    attempt = Attempt(
        user_id=user.id,
        quiz_id=quiz.id,
        score=0,
        total_questions=total_questions,
    )

    try:
        db.add(attempt)
        await db.flush()

        for question in quiz.questions:
            correct_option_ids = {opt.id for opt in question.options if opt.is_correct}
            selected_ids = selected_map.get(question.id, set())
            is_correct = bool(correct_option_ids) and (
                correct_option_ids == selected_ids
            )

            if is_correct:
                score += 1
                correct_question_ids.append(question.id)

            for selected_option_id in selected_ids if selected_ids else [None]:
                db.add(
                    AttemptAnswer(
                        attempt_id=attempt.id,
                        question_id=question.id,
                        selected_option_id=selected_option_id,
                        is_correct=is_correct,
                    )
                )

        attempt.score = score

        await db.commit()

    except Exception:
        await db.rollback()
        raise

    return QuizSubmissionResult(
        score=score,
        total_questions=total_questions,
        correct_question_ids=correct_question_ids,
    )
