import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { AdminGuard } from '@/routes/guards/AdminGuard';

// Public pages
import { Landing } from '@/pages/public/Landing';
import { Signin } from '@/pages/auth/Signin';
import { Signup } from '@/pages/auth/Signup';
import { Privacy } from '@/pages/public/Privacy';
import { Terms } from '@/pages/public/Terms';
import { Security } from '@/pages/public/Security';
import { Contact } from '@/pages/public/Contact';

// Profile
import { ProfileEdit } from '@/pages/profile/ProfileEdit';
import { UserProfile } from '@/pages/profile/UserProfile';

// Account
import { MediaManagement } from '@/pages/account/MediaManagement';
import { ProfileVerification } from '@/pages/account/ProfileVerification';
import { SecuritySettings } from '@/pages/account/SecuritySettings';
import { SafetyCenter } from '@/pages/account/SafetyCenter';
import { Notifications } from '@/pages/account/Notifications';
import { Store } from '@/pages/account/Store';

// Social
import { Search } from '@/pages/social/Search';
import { Matches } from '@/pages/social/Matches';
import { LikedMe } from '@/pages/social/LikedMe';
import { Visitors } from '@/pages/social/Visitors';

// Messaging
import { Chat } from '@/pages/messaging/Chat';
import { Conversations } from '@/pages/messaging/Conversations';

// Admin
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminAudit } from '@/pages/admin/AdminAudit';
import { AdminAiMetrics } from '@/pages/admin/AdminAiMetrics';
import { Moderation } from '@/pages/admin/Moderation';

function Protected({ children }) {
  return <MainLayout>{children}</MainLayout>;
}

function Admin({ children }) {
  return (
    <AdminGuard>
      <MainLayout>{children}</MainLayout>
    </AdminGuard>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/security" element={<Security />} />
      <Route path="/contact" element={<Contact />} />

      {/* Protected */}
      <Route path="/settings/security" element={<Protected><SecuritySettings /></Protected>} />
      <Route path="/profile/verify" element={<Protected><ProfileVerification /></Protected>} />
      <Route path="/safety" element={<Protected><SafetyCenter /></Protected>} />
      <Route path="/profile/edit" element={<Protected><ProfileEdit /></Protected>} />
      <Route path="/profile/media" element={<Protected><MediaManagement /></Protected>} />
      <Route path="/search" element={<Protected><Search /></Protected>} />
      <Route path="/user/:id" element={<Protected><UserProfile /></Protected>} />
      <Route path="/chat/:id" element={<Protected><Chat /></Protected>} />
      <Route path="/matches" element={<Protected><Matches /></Protected>} />
      <Route path="/likedme" element={<Protected><LikedMe /></Protected>} />
      <Route path="/visitors" element={<Protected><Visitors /></Protected>} />
      <Route path="/conversations" element={<Protected><Conversations /></Protected>} />
      <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
      <Route path="/store" element={<Protected><Store /></Protected>} />

      {/* Admin */}
      <Route path="/admin/dashboard" element={<Admin><AdminDashboard /></Admin>} />
      <Route path="/admin/moderation" element={<Admin><Moderation /></Admin>} />
      <Route path="/admin/audit" element={<Admin><AdminAudit /></Admin>} />
      <Route path="/admin/ai-metrics" element={<Admin><AdminAiMetrics /></Admin>} />
    </Routes>
  );
}
