import express, { Router, Request, Response } from 'express';
const router: Router = express.Router();
import UserController from '../../User/controller/user';
import upload from '../../middleware/upload';
import UserAuth from '../../middleware/UserAuth';




router.get('/', (req: Request, res: Response) => {
  res.render('priceupdatetemplate', { title: 'Home' });
});

router.post("/register", (req: Request, res: Response) => {
    UserController.UserRegister(req, res);
  });
  
  // Route for customer login

  router.post("/login", (req: Request, res: Response) => {
    UserController.UserLogin(req, res);
  });
  router.post("/update-profile", upload.single('image'),UserAuth,(req: Request, res: Response) => {
  
      UserController.UserUpdate(req, res);
    });
    router.post("/change-password",UserAuth, (req: Request, res: Response) => {
  
      UserController.ChangePass(req, res);
    });
    
  
  
    router.post("/Social-Login", (req: Request, res: Response) => {
  
      UserController.SocialLogin(req, res);
    });
    
    router.post("/forget-password", (req: Request, res: Response) => {
  
  
      UserController.ForgetPassword(req, res);
    });
    router.post("/otp-verify", (req: Request, res: Response) => {
  
  
      UserController.OtpVerify(req, res);
    });
    router.post("/update-password", (req: Request, res: Response) => {
  
  
      UserController.UpdatePassword(req, res);
    })

    router.post("/Add-card", UserAuth,(req: Request, res: Response) => {
      UserController.AddCard(req, res);
    })
    router.post("/get-card", UserAuth,(req: Request, res: Response) => {
      UserController.GetCard(req, res);
    })

    router.post("/delete-card", UserAuth,(req: Request, res: Response) => {
      UserController.DeleteCard(req, res);
    })
    router.post("/add-pet",upload.fields([{name:'photos'}, {name:'pdf'},{name:'vaccinationCertificate'}]), UserAuth,(req: Request, res: Response) => {
      UserController.AddPet(req, res);
    })







    router.post("/payment-attech",UserAuth, (req: Request, res: Response) => {
      UserController.AttechedPaymentMethod(req, res);
    });
    router.post("/create-subscription",UserAuth, (req: Request, res: Response) => {
      UserController.createSubscription(req, res);
    });
    router.post("/get-product",UserAuth, (req: Request, res: Response) => {
      UserController.GetProductSubscription(req, res);
    });
    router.post("/pause-subscrition",UserAuth, (req: Request, res: Response) => {
      UserController.PauseSubscription(req, res);
    });
    router.post("/resume-subscrition",UserAuth, (req: Request, res: Response) => {
      UserController.ResumeSubscription(req, res);
    });



    export default router