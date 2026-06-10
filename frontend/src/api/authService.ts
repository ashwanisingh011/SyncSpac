import axios from 'axios'

const API = axios.create({baseURL: 'http://localhost:5001/api'});

export const login = async (credentials: any) => {
    const {data} = await API.post('/auth/login', credentials);
    localStorage.setItem('token', data.token);
    return data;
};
