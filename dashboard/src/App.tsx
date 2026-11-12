import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import { installTapPop } from '@/lib/tap-pop'
import { AppLayout } from '@/components/layout/AppLayout'
import { RequirePermission } from '@/components/layout/RequirePermission'
import DashboardPage from '@/pages/DashboardPage'
import WorkforcePage from '@/pages/WorkforcePage'
import ReviewsPage from '@/pages/ReviewsPage'
import DocumentsPage from '@/pages/DocumentsPage'
import ExpertKnowledgePage from '@/pages/ExpertKnowledgePage'
import KnowledgeBasePage from '@/pages/KnowledgeBasePage'
import ArticleDetailPage from '@/pages/ArticleDetailPage'
import AiInterviewPage from '@/pages/AiInterviewPage'
import ContentStudioPage from '@/pages/ContentStudioPage'
import LearningAcademyPage from '@/pages/LearningAcademyPage'
import CourseDetailPage from '@/pages/CourseDetailPage'
import AssistantPage from '@/pages/AssistantPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import SettingsPage from '@/pages/SettingsPage'
import HelpPage from '@/pages/HelpPage'
import NotFoundPage from '@/pages/NotFoundPage'
import LandingPage from '@/pages/LandingPage'
import PresentationPage from '@/pages/PresentationPage'

export default function App() {
  useEffect(() => installTapPop(), [])

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/praesentation" element={<PresentationPage />} />
      <Route element={<AppLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="workforce" element={<RequirePermission permission="board.view"><WorkforcePage /></RequirePermission>} />
        <Route path="reviews" element={<RequirePermission permission="review.decide"><ReviewsPage /></RequirePermission>} />
        <Route path="documents" element={<RequirePermission permission="documents.manage"><DocumentsPage /></RequirePermission>} />
        <Route path="expert-knowledge" element={<RequirePermission permission="interview.conduct"><ExpertKnowledgePage /></RequirePermission>} />
        <Route path="knowledge-base" element={<RequirePermission permission="kb.view"><KnowledgeBasePage /></RequirePermission>} />
        <Route path="knowledge-base/:articleId" element={<RequirePermission permission="kb.view"><ArticleDetailPage /></RequirePermission>} />
        <Route path="ai-interview" element={<AiInterviewPage />} />
        <Route path="content-studio" element={<RequirePermission permission="content.create"><ContentStudioPage /></RequirePermission>} />
        <Route path="learning" element={<LearningAcademyPage />} />
        <Route path="learning/:moduleId" element={<CourseDetailPage />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="analytics" element={<RequirePermission permission="analytics.view"><AnalyticsPage /></RequirePermission>} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
