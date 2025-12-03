import mongoose, { model, Schema } from 'mongoose'


const Model = Schema({
    fullname:{
        type:String,
        required:true,
    },
    address:{
        type:String,
        required:true,
    },
    mobile:{
        type:Number,
        required:true,
        unique:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    followers:{
        type:Schema.Types.ObjectId,
        ref:'users'
    },
    rating:{
        average:{
            type:Number,
            default:0
        },
        total:{
            type:Number,
            default:0
        },
        length:{
            type:Number,
            default:0
        }
    },
    food:{
        type:Schema.Types.ObjectId,
        ref:'foods'
    }
})


const FoodPartnerModel =  model('foodpartner',Model)

export {FoodPartnerModel}