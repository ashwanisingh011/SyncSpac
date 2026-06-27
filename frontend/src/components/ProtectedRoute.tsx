import React from 'react';
import { Navigate } from 'react-router-dom'
import {useSelector} from 'react-redux';
import {type RootState} from '../store';

interface ProtectedRouteProps{
    children: React.ReactElement
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({children})=> {
    const {isAuthenticated} = useSelector((state: RootState) =>  state.auth);

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}