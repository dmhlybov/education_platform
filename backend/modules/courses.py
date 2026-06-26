from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.core.app.deps import current_active_user_ctx, current_superuser_ctx
from backend.database import get_async_session
from backend.models.auth import User
from backend.models.learn import (
    AnswerOption,
    Attempt,
    Course,
    CourseAssignment,
    Lesson,
    Question,
    Quiz,
    Theme,
)
from backend.schemas.auth import UserContext
from backend.schemas.learn import (
    AssignmentRequest,
    AttemptHistoryItem,
    CourseCreateRequest,
    CourseDetailResponse,
    CourseResultsResponse,
    CourseSummaryResponse,
    CourseUpdateRequest,
    QuizResponse,
)

router = APIRouter(prefix="/courses", tags=["Курсы"])


def normalize_course_themes(payload: CourseCreateRequest):
    if payload.themes:
        return payload.themes
    if payload.quiz is None:
        return []
    return [
        {
            "title": payload.title,
            "description": payload.description,
            "position": 1,
            "lessons": payload.lessons,
            "quiz": payload.quiz,
        }
    ]


@router.get("", response_model=list[CourseSummaryResponse])
async def list_courses(
    user: UserContext = Depends(current_active_user_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    stmt = select(Course)

    if not user.is_admin:
        stmt = (
            stmt.join(CourseAssignment, CourseAssignment.course_id == Course.id)
            .where(CourseAssignment.user_id == user.id)
            .distinct()
        )

    stmt = stmt.order_by(Course.id.asc())

    result = await db.scalars(stmt)
    return result.all()


@router.post("", response_model=CourseSummaryResponse)
async def create_course(
    payload: CourseCreateRequest,
    user: UserContext = Depends(current_superuser_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    course = Course(
        title=payload.title,
        description=payload.description,
        created_by_user_id=user.id,
    )

    try:
        db.add(course)
        await db.flush()

        normalized_themes = normalize_course_themes(payload)

        for index, theme_payload in enumerate(normalized_themes, start=1):
            is_dict = isinstance(theme_payload, dict)

            theme = Theme(
                course_id=course.id,
                title=theme_payload["title"] if is_dict else theme_payload.title,
                description=(
                    theme_payload["description"]
                    if is_dict
                    else theme_payload.description
                ),
                position=(
                    theme_payload["position"]
                    if is_dict
                    else theme_payload.position or index
                ),
            )

            db.add(theme)
            await db.flush()

            lessons = theme_payload["lessons"] if is_dict else theme_payload.lessons
            quiz_payload = theme_payload["quiz"] if is_dict else theme_payload.quiz

            for lesson in lessons:
                db.add(
                    Lesson(
                        course_id=course.id,
                        theme_id=theme.id,
                        title=lesson.title,
                        content_type=lesson.content_type,
                        content=lesson.content,
                        position=lesson.position,
                    )
                )

            quiz = Quiz(
                course_id=course.id,
                theme_id=theme.id,
                title=quiz_payload.title,
                description=quiz_payload.description,
            )

            db.add(quiz)
            await db.flush()

            for question_payload in quiz_payload.questions:
                question = Question(
                    quiz_id=quiz.id,
                    prompt=question_payload.prompt,
                    position=question_payload.position,
                )

                db.add(question)
                await db.flush()

                for option_index, option_text in enumerate(question_payload.options):
                    db.add(
                        AnswerOption(
                            question_id=question.id,
                            text=option_text,
                            is_correct=(
                                option_index in question_payload.correct_option_indices
                            ),
                        )
                    )

        await db.commit()
        await db.refresh(course)

        return course

    except Exception:
        await db.rollback()
        raise


@router.put("/{course_id}", response_model=CourseSummaryResponse)
async def update_course(
    course_id: int,
    payload: CourseUpdateRequest,
    user: UserContext = Depends(current_superuser_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    try:
        course = await db.scalar(select(Course).where(Course.id == course_id))

        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

        course.title = payload.title
        course.description = payload.description

        quiz_ids_subquery = select(Quiz.id).where(Quiz.course_id == course.id)

        question_ids_subquery = select(Question.id).where(
            Question.quiz_id.in_(quiz_ids_subquery)
        )

        await db.execute(
            delete(Lesson)
            .where(Lesson.course_id == course.id)
            .execution_options(synchronize_session=False)
        )

        await db.execute(
            delete(AnswerOption)
            .where(AnswerOption.question_id.in_(question_ids_subquery))
            .execution_options(synchronize_session=False)
        )

        await db.execute(
            delete(Question)
            .where(Question.quiz_id.in_(quiz_ids_subquery))
            .execution_options(synchronize_session=False)
        )

        await db.execute(
            delete(Quiz)
            .where(Quiz.course_id == course.id)
            .execution_options(synchronize_session=False)
        )

        await db.execute(
            delete(Theme)
            .where(Theme.course_id == course.id)
            .execution_options(synchronize_session=False)
        )

        await db.flush()

        normalized_themes = normalize_course_themes(payload)

        for index, theme_payload in enumerate(normalized_themes, start=1):
            is_dict = isinstance(theme_payload, dict)

            theme = Theme(
                course_id=course.id,
                title=theme_payload["title"] if is_dict else theme_payload.title,
                description=(
                    theme_payload["description"]
                    if is_dict
                    else theme_payload.description
                ),
                position=(
                    theme_payload["position"]
                    if is_dict
                    else theme_payload.position or index
                ),
            )

            db.add(theme)
            await db.flush()

            lessons = theme_payload["lessons"] if is_dict else theme_payload.lessons
            quiz_payload = theme_payload["quiz"] if is_dict else theme_payload.quiz

            for lesson in lessons:
                db.add(
                    Lesson(
                        course_id=course.id,
                        theme_id=theme.id,
                        title=lesson.title,
                        content_type=lesson.content_type,
                        content=lesson.content,
                        position=lesson.position,
                    )
                )

            quiz = Quiz(
                course_id=course.id,
                theme_id=theme.id,
                title=quiz_payload.title,
                description=quiz_payload.description,
            )

            db.add(quiz)
            await db.flush()

            for question_payload in quiz_payload.questions:
                question = Question(
                    quiz_id=quiz.id,
                    prompt=question_payload.prompt,
                    position=question_payload.position,
                )

                db.add(question)
                await db.flush()

                for option_index, option_text in enumerate(question_payload.options):
                    db.add(
                        AnswerOption(
                            question_id=question.id,
                            text=option_text,
                            is_correct=(
                                option_index in question_payload.correct_option_indices
                            ),
                        )
                    )

        await db.commit()
        await db.refresh(course)

        return course

    except HTTPException:
        await db.rollback()
        raise

    except Exception:
        await db.rollback()
        raise


@router.post("/{course_id}/assign", response_model=dict)
async def assign_course(
    course_id: int,
    payload: AssignmentRequest,
    user: UserContext = Depends(current_superuser_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    student = await db.scalar(
        select(User).where(
            User.id == payload.user_id,
            User.is_admin.is_(False),
        )
    )

    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    assignment = await db.scalar(
        select(CourseAssignment).where(
            CourseAssignment.course_id == course_id,
            CourseAssignment.user_id == payload.user_id,
        )
    )

    if assignment:
        return {"status": "already_assigned"}

    try:
        db.add(
            CourseAssignment(
                course_id=course_id,
                user_id=payload.user_id,
            )
        )

        await db.commit()

        return {"status": "assigned"}

    except Exception:
        await db.rollback()
        raise


@router.delete("/{course_id}", status_code=204)
async def delete_course(
    course_id: int,
    user: UserContext = Depends(current_superuser_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    await db.delete(course)
    await db.commit()


@router.get("/{course_id}", response_model=CourseDetailResponse)
async def get_course(
    course_id: int,
    user: UserContext = Depends(current_active_user_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.themes).selectinload(Theme.lessons),
            selectinload(Course.themes)
            .selectinload(Theme.quizzes)
            .selectinload(Quiz.questions)
            .selectinload(Question.options),
            selectinload(Course.lessons),
            selectinload(Course.quizzes)
            .selectinload(Quiz.questions)
            .selectinload(Question.options),
        )
        .where(Course.id == course_id)
    )

    course = result.scalar_one_or_none()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if not user.is_admin:
        assigned_id = await db.scalar(
            select(CourseAssignment.id).where(
                CourseAssignment.course_id == course_id,
                CourseAssignment.user_id == user.id,
            )
        )

        if assigned_id is None:
            raise HTTPException(
                status_code=403,
                detail="Course is not assigned to this student",
            )

    return course


@router.get("/{course_id}/quizzes/{quiz_id}", response_model=QuizResponse)
async def get_quiz(
    course_id: int,
    quiz_id: int,
    user: UserContext = Depends(current_active_user_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    if not user.is_admin:
        assigned_id = await db.scalar(
            select(CourseAssignment.id).where(
                CourseAssignment.course_id == course_id,
                CourseAssignment.user_id == user.id,
            )
        )

        if assigned_id is None:
            raise HTTPException(
                status_code=403,
                detail="Course is not assigned to this student",
            )

    result = await db.execute(
        select(Quiz)
        .options(selectinload(Quiz.questions).selectinload(Question.options))
        .where(
            Quiz.course_id == course_id,
            Quiz.id == quiz_id,
        )
    )

    quiz = result.scalar_one_or_none()

    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    return quiz


@router.get("/{course_id}/results", response_model=CourseResultsResponse)
async def get_course_results(
    course_id: int,
    user: UserContext = Depends(current_active_user_ctx),
    db: AsyncSession = Depends(get_async_session),
):
    course = await db.scalar(select(Course).where(Course.id == course_id))

    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    stmt = (
        select(Attempt, Quiz, User)
        .join(Quiz, Attempt.quiz_id == Quiz.id)
        .join(User, Attempt.user_id == User.id)
        .where(Quiz.course_id == course_id)
        .order_by(Attempt.created_at.desc())
    )

    if not user.is_admin:
        assigned_id = await db.scalar(
            select(CourseAssignment.id).where(
                CourseAssignment.course_id == course_id,
                CourseAssignment.user_id == user.id,
            )
        )

        if assigned_id is None:
            raise HTTPException(
                status_code=403,
                detail="Course is not assigned to this student",
            )

        stmt = stmt.where(User.id == user.id)

    result = await db.execute(stmt)

    items = [
        AttemptHistoryItem(
            id=attempt.id,
            quiz_id=quiz.id,
            theme_id=quiz.theme_id,
            quiz_title=quiz.title,
            user_email=result_user.email,
            score=attempt.score,
            total_questions=attempt.total_questions,
            created_at=attempt.created_at.isoformat(),
        )
        for attempt, quiz, result_user in result.all()
    ]

    return CourseResultsResponse(items=items)
