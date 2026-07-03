import mongoose from "mongoose";

const guestScheme = new mongoose.Schema({
    _id: {
        type: String
    },
    username:{
        type:String,
        required:true,
        unique:true
    },
    gender:{
        type:Number,
        required:true
    },
    avatar:{
        type:String,
        required:false
    },
    isOnline:{
        type:Boolean,
        default:true
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },   
},{timestamps:true});

export default mongoose.models.Guest || mongoose.model("Guest", guestScheme);
