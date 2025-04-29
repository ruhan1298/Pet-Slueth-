import express, { Router, Request, Response } from 'express';
const router: Router = express.Router();
import authController from '../controller/auth';
import upload from '../../middleware/upload';
import UserAuth from '../../middleware/UserAuth';


router.post("/Login", (req: Request, res: Response) => {
   authController.AdminLogin(req, res);
 });
 router.get("/get-admin",UserAuth, (req: Request, res: Response) => {
   authController.GetAdmin(req, res);
 });
 router.post("/update-admin",upload.single('image'),UserAuth, (req: Request, res: Response) => {
   authController.UpdateAdmin(req, res);
 });
 router.post("/change-pass",UserAuth, (req: Request, res: Response) => {
   authController.ChangePass(req, res);
 });
 router.post("/forget-password", (req: Request, res: Response) => {


   authController.ForgetPassword(req, res);
 });

 router.post("/otp-verify", (req: Request, res: Response) => {


   authController.OtpVerify(req, res);
 });
 router.post("/update-password", (req: Request, res: Response) => {


   authController.UpdatePassword(req, res);
 })
 router.post("/user-list",UserAuth, (req: Request, res: Response) => {
  authController.UserList(req, res);
});
router.post("/delete-user",UserAuth, (req: Request, res: Response) => {
  authController.DeleteUser(req, res);
});
router.post("/block-unblock",UserAuth, (req: Request, res: Response) => {
  authController.BlockUnblockUser(req, res);
});
router.post("/add-product", (req: Request, res: Response) => {
  authController.AddProductSubscription(req, res);
});
router.post("/get-product", (req: Request, res: Response) => {
  authController.getproductsubscription(req, res);
});
router.post("/check-out", (req: Request, res: Response) => {
  authController.checkoutsession(req, res);
});
router.post("/web-hook", (req: Request, res: Response) => {
  authController.webhook(req, res);
});
router.post("/pause-subscription", (req: Request, res: Response) => {
  authController.PausedSubscription(req, res);
});
router.post("/resume-subscription", (req: Request, res: Response) => {
  authController.ResumeSubscription(req, res);
});
router.post("/cancel-subscription", (req: Request, res: Response) => {
  authController.cancelSubscription(req, res);
});
 export default router