import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProfilePage from '@/pages/ProfilePage';
import ProfileEditPage from '@/pages/ProfileEditPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import AdminCreateUserPage from '@/pages/AdminCreateUserPage';
import AdminEditUserPage from '@/pages/AdminEditUserPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import HomeRedirect from '@/pages/HomeRedirect';
import NotFoundPage from '@/pages/NotFoundPage';
import { AuthProvider } from '@/context/AuthContext';

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <ProfileEditPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/new"
            element={
              <ProtectedRoute requireAdmin>
                <AdminCreateUserPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users/:id/edit"
            element={
              <ProtectedRoute requireAdmin>
                <AdminEditUserPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  </AuthProvider>
);

export default App;

