import { BrowserRouter, Routes, Route} from 'react-router-dom';
import ProjectPage from './components/ProjectPage.tsx';
import CreateProject from './components/CreateProject.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import Dashboard from './components/Dashboard.tsx';
import { DashboardLayout } from './components/DashboardLayout.tsx';


function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path = '/' element={<Login />} />
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
