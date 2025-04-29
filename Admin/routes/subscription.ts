import express, { Router, Request, Response } from 'express';
const router: Router = express.Router(); 
import subscriptionController from '../controller/subscription';
import UserAuth from '../../middleware/UserAuth';
import upload from '../../middleware/upload';


router.post("/add-product", (req: Request, res: Response) => {
  subscriptionController.AddProductSubscription(req, res);
});
router.post("/get-product", (req: Request, res: Response) => {
  subscriptionController.GetProductSubscription(req, res);
});
router.post("/update-product", (req: Request, res: Response) => {
  subscriptionController.UpdateProductSubscription(req, res);
})


export default router