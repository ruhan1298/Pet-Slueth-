import express, { Router, Request, Response } from 'express';
const router: Router = express.Router(); 
import subscriptionController from '../controller/subscription';
import userAuth from '../../middleware/UserAuth';


router.post("/add-product",userAuth, (req: Request, res: Response) => {
  subscriptionController.AddProductSubscription(req, res);
});
router.post("/get-product",userAuth, (req: Request, res: Response) => {
  subscriptionController.GetProductSubscription(req, res);
});
router.post("/update-product", userAuth,(req: Request, res: Response) => {
  subscriptionController.UpdateProductSubscription(req, res);
})


export default router