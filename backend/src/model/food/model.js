import mongoose, { model, Schema } from 'mongoose'


const Model = Schema({
    title:{
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
        ref:'foodpartners',
        type:mongoose.Schema.Types.ObjectId,
        required:true,
    },
    likes:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'users'
    }]
}, {
    timestamps: true
})


const FoodModel =  model('food',Model)

export {FoodModel}