// Main App component - Created by Harish S & Team
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardPage from './pages/DashboardPage';
import AdminDashboard from './pages/AdminDashboard';
import ReportsPage from './pages/ReportsPage';
import EmployeeDetailsPage from './pages/EmployeeDetailsPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Main App component
function App() {
  const { user } = useAuth();

  // Component to render appropriate dashboard based on user role
  const DashboardComponent = () => {
    if (user?.role === 'admin') {
      return <AdminDashboard />;
    }
    return <DashboardPage />;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardComponent />
          </ProtectedRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardComponent />
          </ProtectedRoute>
        } />

        <Route path="/dashboard/details/:id" element={
          <ProtectedRoute>
            <EmployeeDetailsPage />
          </ProtectedRoute>
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        } />
        
        {/* Redirect unknown routes to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </div>
  );
}

export default App;
