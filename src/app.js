import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
// import cookieParser from "cookie-parser"
const app = express()


app.use(cors({
    origin:process.env.cors_origin,
    Credentials:true
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//import all routes
import userRouter from "./routes/user.routes.js"

//routes
app.use("/api/v1/user",userRouter)
export {app}