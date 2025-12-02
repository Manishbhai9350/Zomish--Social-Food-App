import  { Router } from 'express';
import { AuthenticateFoodPartner, AuthenticateUser } from '../../middleware/auth/index.js';
import FoodController from '../../controllers/food/controller.js'
import { MulterStorage } from '../../utils/multer.js'


const FoodRouter =  Router()


FoodRouter.post('/food/create',AuthenticateFoodPartner,MulterStorage.single('video'),FoodController.food.create)
FoodRouter.patch('/food/like',AuthenticateUser,FoodController.food.like)
FoodRouter.get('/food/reels',AuthenticateUser,FoodController.food.getAll)




export { FoodRouter }


