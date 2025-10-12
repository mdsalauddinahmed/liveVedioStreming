import mongoose  from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,

    },  email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        }
    ,
        fullName:{
            type:String,
            required:true,
            trim:true,
            index:true
        },

        avatar:{
            type:String,
            required:true,
        },
        coverImage:{
            type:String
        },
        watchHistory:[
            {
                type:mongoose.Schema.Types.ObjectId
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String
        }
    
},{timestamps:true}

)
userSchema.pre("save", async function (next) {
    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
    console.log("Comparing passwords - Input:", password ? "PROVIDED" : "MISSING");
    console.log("Stored hash exists:", this.password ? "YES" : "NO");
    const result = await bcrypt.compare(password, this.password);
    console.log("Bcrypt compare result:", result);
    return result;
}


userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema)