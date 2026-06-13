import {register} from '../api/authService.ts';
import {useNavigate} from 'react-router-dom';
import { useState } from 'react';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
    });
    const navigate = useNavigate();

    const handleSubmit = async(e: React.FormEvent)=> {
        e.preventDefault();
        try {
            await register(formData);
            navigate('/Dashboard');
            alert('Registration successful');
        } catch (error) {
            alert('Registration failed. Try again.');
        }
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="p-8 max-w-md mx-auto">
                <input
                    type="text"
                    placeholder= 'Name'
                    className='w-full p-2 mb-4 border rounded'
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                <input
                    type="email"
                    placeholder= 'Email'
                    className='w-full p-2 mb-4 border rounded'
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                <input
                    type="password"
                    placeholder= 'Password'
                    className='w-full p-2 mb-4 border rounded'
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
                <button type="submit" className="bg-green-500 text-white p-2 rounded">
                    Register
                </button>
            </form>
        </>
    )
}

export default Register;