import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";


const subscriptionModel = new mongoose.Schema({
    subscriber:{
        types:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
     channel: {
        type: mongoose.Schema.Types.ObjectId, // one to whom 'subscriber' is subscribing
        ref: "User"
    }
})

export const subscription = mongoose.model("Subscription",subscriptionModel)