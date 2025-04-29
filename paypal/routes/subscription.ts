import express, { Router, Request, Response } from 'express';
const router: Router = express.Router();
import subscriptionController from '../../paypal/controller/subscription';
import upload from '../../middleware/upload';
import UserAuth from '../../middleware/UserAuth';


// router.post("/add-product", (req: Request, res: Response) => {
//    subscriptionController.(req, res);
//  });
router.post("/get-product", (req: Request, res: Response) => {
   subscriptionController.GetProductSubscription(req, res);
 });
 export default router