import mongoose, { model, Schema } from 'mongoose'


const Model = Schema({
    fullname:{
        type:String,
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
    }
})


const UserModel =  model('user',Model)

export {UserModel}