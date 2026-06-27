import { BrowserRouter, Routes, Route} from 'react-router-dom';
import ProjectPage from './pages/ProjectPage.tsx';
import CreateProject from './components/CreateProject.tsx';
import Login from './pages/Login.tsx';
import Register from './pages/Register.tsx';
import Dashboard from './pages/Dashboard.tsx';
import { DashboardLayout } from './layouts/DashboardLayout.tsx';


function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path = '/login' element={<Login />} />
        <Route path = '/register' element={<Register />} />

        <Route path = '/dashboard' element={
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        } />
        <Route path = '/project' element={
          <DashboardLayout>
            <CreateProject />
          </DashboardLayout>
        } />
        <Route path = "/project/:id" element={
          <DashboardLayout>
            <ProjectPage />
          </DashboardLayout>
        } />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
