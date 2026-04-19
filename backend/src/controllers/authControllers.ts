import User from "../models/User.js";
import type {Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const registerUser = (async (req: Request, res: Response): Promise<void>=>{
try {
        const{name, email, password} = req.body;
    
        const existedUser = await User.findOne({email})
        if(existedUser){
            res.status(400).json({message: "User already exists"})
            return 
        }
    
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)
    
       const user = await User.create({
        name,
        email,
        password: hashedPassword, 
       })
    
        res.status(201).json({  
            message: "User registered successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avator: user.avatar
            }
    })
} catch (error) {
    console.error("Error in registerUser: ", error)
    res.status(500).json({message: "Server error"})
}
    
})
