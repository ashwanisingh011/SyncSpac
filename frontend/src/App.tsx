import { BrowserRouter, Routes, Route} from 'react-router-dom';
import ProjectPage from './components/ProjectPage.tsx';
import CreateProject from './components/CreateProject.tsx';
import Login from './components/Login.tsx';
import Register from './components/Register.tsx';
import Dashboard from './components/Dashboard.tsx';


function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path = '/' element={<Login />} />
        <Route path = '/register' element={<Register />} />
        <Route path = '/dashboard' element={<Dashboard />} />
        <Route path = '/project' element={<CreateProject />} />
        <Route path = "/project/:id" element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
