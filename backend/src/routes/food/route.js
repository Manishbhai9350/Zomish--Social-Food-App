import  { Router } from 'express';
import { AuthenticateFoodPartner } from '../../middleware/auth/index.js';
import FoodController from '../../controllers/food/controller.js'
import { MulterStorage } from '../../utils/multer.js'


const FoodRouter =  Router()


FoodRouter.post('/food/create',AuthenticateFoodPartner,MulterStorage.single('video'),FoodController.food.create)
// FoodRouter.get('/food')


export { FoodRouter }


