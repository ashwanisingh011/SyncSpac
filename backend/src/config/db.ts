import mongoose from 'mongoose';


const connectDB = async () => {
    try{
        const connectionInstace = await mongoose.connect(`${process.env.MONGO_URI as string}`)
        console.log(`MongoDB connected: ${connectionInstace.connection.host}`)
    } catch (error){
        console.error("MongoDB connection is not working", error)
        process.exit(1)
    }
}

export default connectDB;