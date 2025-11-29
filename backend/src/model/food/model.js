import mongoose, { model, Schema } from 'mongoose'


const Model = Schema({
    name:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    video:{
        type:String,
        required:true
    },
    partner:{
        ref:'foodpartner',
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
})


const FoodModel = new model('food',Model)

export {FoodModel}