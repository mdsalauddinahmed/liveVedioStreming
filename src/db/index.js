import mongoose  from "mongoose";
import { Db_name } from "../constants.js";

const connectDB = async () =>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URL}/${Db_name}`)
        console.log(`\nMongoDb connected !! DB host: ${connectionInstance.connection.host}`)
    }catch(err){
        console.log(`Error in connecting to MongoDB: ${err.message}`);
        process.exit(1);
    }
}
export default connectDB;