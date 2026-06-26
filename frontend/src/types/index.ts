export type User = {
  id: number;
  email: string;
  first_name: string;
  second_name: string;
  is_admin: boolean;
  is_active: boolean;
  is_verified: boolean;
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type Student = {
  id: number;
  email: string;
  first_name: string;
  second_name: string;
  is_active?: boolean;
  is_admin?: boolean;
  bitrix_user_id?: string | null;
};

export type CourseSummary = {
  id: number;
  title: string;
  description: string;
};

export type Lesson = {
  id?: number;
  title: string;
  content_type: string;
  content: string;
  position: number;
};

export type AnswerOption = {
  id?: number;
  text: string;
};

export type Question = {
  id?: number;
  prompt: string;
  position: number;
  options: AnswerOption[];
};

export type Quiz = {
  id?: number;
  title: string;
  description: string;
  questions: Question[];
};

export type Theme = {
  id?: number;
  title: string;
  description: string;
  position: number;
  lessons: Lesson[];
  quizzes: Quiz[];
};

export type CourseDetail = CourseSummary & {
  themes?: Theme[];
  lessons: Lesson[];
  quizzes: Quiz[];
};

export type QuizResult = {
  score: number;
  total_questions: number;
  correct_question_ids: number[];
};

export type AttemptHistoryItem = {
  id: number;
  quiz_id: number;
  theme_id?: number | null;
  quiz_title: string;
  user_email: string;
  score: number;
  total_questions: number;
  created_at: string;
};

export type CourseResults = {
  items: AttemptHistoryItem[];
};

export type CreateCoursePayload = {
  title: string;
  description: string;
  themes?: {
    title: string;
    description: string;
    position: number;
    lessons: { title: string; content_type: string; content: string; position: number }[];
    quiz: {
      title: string;
      description: string;
      questions: { prompt: string; position: number; options: string[]; correct_option_indices: number[] }[];
    };
  }[];
  lessons?: { title: string; content_type: string; content: string; position: number }[];
  quiz?: {
    title: string;
    description: string;
    questions: { prompt: string; position: number; options: string[]; correct_option_indices: number[] }[];
  };
};

export type CreateUserPayload = {
  email: string;
  password: string;
  first_name: string;
  second_name: string;
  is_admin?: boolean;
  bitrix_user_id?: string | null;
};
