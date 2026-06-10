import { BrowserRouter, Routes, Route} from 'react-router-dom';
import ProjectPage from './components/ProjectPage.tsx';
import Login from './components/Login.tsx';
import Dashboard from './components/Dashboard.tsx';


function App() {

  return (
    <>
    <BrowserRouter>
      <Routes>
        <Route path = '/login' element={<Login />} />
        <Route path = '/dashboard' element={<Dashboard />} />
        <Route path = "/project/:id" element={<ProjectPage />} />
      </Routes>
    </BrowserRouter>
    </>
  )
}

export default App
