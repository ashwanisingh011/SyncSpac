import { BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import ProjectPage from './pages/ProjectPage.tsx';
import CreateProject from './components/CreateProject.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';


function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} /> 
        <Route path = '/login' element={<Login />} />
        <Route path = '/register' element={<Register />} />

        <Route path = '/dashboard' element={
          <ProtectedRoute>
            <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
          </ProtectedRoute>
          
        } />
        <Route path = '/project' element={
          <ProtectedRoute>
            <DashboardLayout>
            <CreateProject />
            </DashboardLayout>
          </ProtectedRoute>
          
        } />
        <Route path = "/project/:id" element={
          <ProtectedRoute>
            <DashboardLayout>
            <ProjectPage />
          </DashboardLayout>
          </ProtectedRoute>
          
        } />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
