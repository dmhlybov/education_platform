from pydantic import BaseModel, EmailStr, Field


class LessonResponse(BaseModel):
    id: int
    title: str
    content_type: str
    content: str
    position: int

    class Config:
        from_attributes = True


class LessonCreateRequest(BaseModel):
    title: str
    content_type: str
    content: str
    position: int


class AnswerOptionResponse(BaseModel):
    id: int
    text: str

    class Config:
        from_attributes = True


class QuestionResponse(BaseModel):
    id: int
    prompt: str
    position: int
    options: list[AnswerOptionResponse]

    class Config:
        from_attributes = True


class QuizQuestionCreateRequest(BaseModel):
    prompt: str
    position: int
    options: list[str]
    correct_option_indices: list[int] = []


class QuizResponse(BaseModel):
    id: int
    title: str
    description: str
    questions: list[QuestionResponse]

    class Config:
        from_attributes = True


class QuizCreateRequest(BaseModel):
    title: str
    description: str
    questions: list[QuizQuestionCreateRequest] = []


class CourseSummaryResponse(BaseModel):
    id: int
    title: str
    description: str

    class Config:
        from_attributes = True


class ThemeResponse(BaseModel):
    id: int
    title: str
    description: str
    position: int
    lessons: list[LessonResponse] = []
    quizzes: list[QuizResponse] = []

    class Config:
        from_attributes = True


class ThemeCreateRequest(BaseModel):
    title: str
    description: str = ""
    position: int
    lessons: list[LessonCreateRequest]
    quiz: QuizCreateRequest


class CourseDetailResponse(CourseSummaryResponse):
    themes: list[ThemeResponse] = []
    lessons: list[LessonResponse]
    quizzes: list[QuizResponse]


class CourseCreateRequest(BaseModel):
    title: str
    description: str
    themes: list[ThemeCreateRequest] = []
    lessons: list[LessonCreateRequest] = []
    quiz: QuizCreateRequest | None = None


class QuizSubmissionAnswer(BaseModel):
    question_id: int
    selected_option_ids: list[int]


class QuizSubmissionRequest(BaseModel):
    answers: list[QuizSubmissionAnswer]


class QuizSubmissionResult(BaseModel):
    score: int
    total_questions: int
    correct_question_ids: list[int]


class AttemptHistoryItem(BaseModel):
    id: int
    quiz_id: int
    theme_id: int | None = None
    quiz_title: str
    user_email: EmailStr
    score: int
    total_questions: int
    created_at: str


class CourseResultsResponse(BaseModel):
    items: list[AttemptHistoryItem]


class StudentSummaryResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str


class AssignmentRequest(BaseModel):
    user_id: int


class UserCreateRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str
    is_admin: bool = False


class CourseUpdateRequest(CourseCreateRequest):
    pass
