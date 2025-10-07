import express from "express"
import cors from "cors"
// import cookieParser from "cookie-parser"

export const app = express()


app.use(cors({
    origin:process.env.cors_origin,
    Credentials:true
}))