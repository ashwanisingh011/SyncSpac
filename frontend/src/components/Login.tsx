import React, {useState} from 'react';
import { login } from '../api/authService.ts';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async(e: React.FormEvent) => {
        e.preventDefault();
        try {
            await login({email, password});
            alert('Login successful');
            navigate('/dashboard');
        } catch (error) {
            alert('Login failed. Check your credentials.')
        }
    }

    return (
        <>
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input 
          type="email" placeholder="Email" className="w-full p-2 mb-4 border rounded"
          value={email} onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" placeholder="Password" className="w-full p-2 mb-4 border rounded"
          value={password} onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">Login</button>
      </form>
    </div>
        </>
    )
}

export default Login;