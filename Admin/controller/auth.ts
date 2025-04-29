import { Request, Response } from "express";
import Stripe from "stripe";
import path from "path";
import fs from "fs";
import hbs from "handlebars";
import Admin from "../models/auth";
import { Op } from "sequelize";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { runInNewContext } from "vm";
import MasterData from "../models/masterData";
import User from "../../User/models/user";

const templatePath = path.join(__dirname, '../../views/otptemplate.hbs');
const source = fs.readFileSync(templatePath, 'utf-8');
const template = hbs.compile(source);
const stripe = new Stripe(process.env.STRIPE_KEY || "");


export default {
AdminLogin: async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate user input
      if (!(email && password)) {
        return res
          .status(400)
          .json({ status: 0, message: "All input is required." });
      }

      // Find user by email
      const user = await Admin.findOne({ where: { email } });

      if (!user) {
        return res.status(400).json({ status: 0, message: "Invalid Email" });
      }

      // Compare the provided password with the stored hashed password
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password as unknown as string
      );

      if (!isPasswordValid) {
        return res.status(400).json({ status: 0, message: "Invalid Password" });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          mobilenumber: user.mobilenumber,},
        process.env.TOKEN_KEY as string, // Use your secret key stored in .env
      );

      // Respond with user data and the generated token
      return res.status(200).json({
        status: 1,
        message: "Login successful",
        data: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          mobilenumber: user.mobilenumber,
          image:user.image,
          token: token,
        },
      });
    } catch (error) {
      // Handle unexpected errors
      console.error(error);
      return res
        .status(500)
        .json({ status: 0, message: "Internal server error" });
    }
  },
  GetAdmin: async (req: Request, res: Response) => {
    const user_id = req.user?.id;
    console.log();
    

    const getAdmin = await Admin.findAll({
      where: {
        id: user_id,
      },
    });
    res.json({
      status: 1,
      message: "Admin profile get succesfully",
      data: getAdmin,
    });
  },
  UpdateAdmin: async (req: Request, res: Response) => {
    try {
      // Get user_id from the request
      const user_id = req.user?.id;
      if (!user_id) {
        return res
          .status(400)
          .json({ message: "User ID is missing or invalid" });
      }

      // Get the updated user data from the request body
      const { fullName, email, mobilenumber } = req.body;
      console.log(req.body, "BODY");
      const image = req.file?.path; // Normalize path

      // Validate required fields

      // Assuming you're using Mongoose to interact with your database
      // You can modify this to use Sequelize or your specific ORM
      let user = await Admin.findByPk(user_id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update the user's information
      user.fullName = fullName || user.fullName;
      user.email = email || user.email;
      user.mobilenumber = mobilenumber || user.mobilenumber;
      user.image = image || user.image;
      
      await user.save();

      // Return success response with the updated user data
      res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
  ChangePass: async (req: Request, res: Response) => {
    try {
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ status: 0, message: "Old and new passwords are required" });
      }

      if (oldPassword === newPassword) {
        return res
          .status(400)
          .json({
            status: 0,
            message: "New password cannot be the same as the old password",
          });
      }

      const user = await Admin.findByPk(req.user?.id);
      console.log(user, "USER GET");

      if (!user) {
        return res.status(404).json({ status: 0, message: "User not found" });
      }

      const isValidPassword = await bcrypt.compare(oldPassword, user.password); // Ensure 'user.password' is a string

      if (!isValidPassword) {
        return res
          .status(400)
          .json({ status: 0, message: "Invalid old password" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);

      user.password = hashedPassword; // Ensure 'hashedPassword' type matches 'user.password'
      await user.save();

      return res
        .status(200)
        .json({ status: 1, message: "Password changed successfully" });
    } catch (err: any) {
      console.error("Error:", err.message);
      return res
        .status(500)
        .json({ status: 0, message: "Failed to change password" });
    }
  },
  ForgetPassword: async (req: Request, res: Response) => {
    const email = req.body.email;

  try {
    // Step 1: Check if email exists in the database
    const user = await Admin.findOne({
      where: { email: email },
    });

    if (!user) {
      return res.status(400).json({ status: 0, message: 'Please enter a valid email' });
    }

    // Step 2: Generate OTP (Random token for password reset)
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP expiration in 10 minutes
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: resetExpires, // Correctly passing Date object
    });
    const emailData = {
      companyName: "Your Company Name",
      firstName: user.fullName,
      action: "reset your password",
      otp: resetToken,
      otpExpiry: "10 minutes",

  };

  const htmlContent = template(emailData);

    // Step 4: Send OTP via email
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your email service provider
      auth: {
        user: 'tryoutscout@gmail.com',
        pass: 'xapfekrrmvvghexe'
    }
    });

    const mailOptions = {
      from: 'tryoutscout@gmail.com',
      to: email,
      subject: 'Password Reset OTP',
      html: htmlContent,

    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ status: 0, message: 'Error sending OTP' });
      }
      return res.status(200).json({ status: 1, message: 'OTP sent successfully' });
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 0, message: 'Internal server error' });
  }

},
OtpVerify: async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  console.log(req.body, "BODY");
  if(!otp){
  return  res.json({status:0, message:"email and otp required"})
  }

  try {
    // Step 1: Check if the email exists
    const user = await Admin.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: 0,
        message: 'User not found',
      });
    }

    // Step 2: Check if the OTP is valid
    const currentTime = new Date();
    if (
      user.resetPasswordToken !== otp || // OTP mismatch
      !user.resetPasswordExpires || // Expiry not set
      user.resetPasswordExpires < currentTime // OTP expired
    ) {
      return res.status(400).json({
        status: 0,
        message: 'Invalid or expired OTP',
      });
    }

    // Step 3: OTP is valid, proceed further (e.g., reset password)
    return res.status(200).json({
      status: 1,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
  }
},
UpdatePassword: async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  try {
    const user = await Admin.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: 0,
        message: 'User not found',
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword; // Ensure 'hashedPassword' type matches 'user.password'
    await user.save();

    return res.status(200).json({ status: 1, message: "Password update successfully" });

  } catch (error) {

    console.error('Error verifying OTP:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
  }

},
AddMasterData: async (req: Request, res: Response) => {
  try {
    const {name,type} = req.body
    if (!name || !type) {
      return res.status(400).json({ message: "Name and type are required." });
    }
    const addData = MasterData.create({
      name,
      type
    })
    res.json({status:1,message:"Master Data add successfully"})
  } catch (error) {
    
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
  }
},
GetMasterData: async (req: Request, res: Response) => {
  try {
    const { page = 1, pageSize = 10, search = "" } = req.body;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const whereCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { type: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const totalCount = await MasterData.count({ where: whereCondition });

    const GetMasterData = await MasterData.findAll({
      attributes: ['id', 'name', 'type'],
      where: whereCondition,
      limit,
      offset,
    });

    return res.status(200).json({
      status: 1,
      message: "Master data retrieved successfully",
      data: GetMasterData,
      pagination: {
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
        currentPage: Number(page),
        pageSize: Number(pageSize),
      },
    });

  } catch (error) {
    console.error("Error in GetMasterData:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
  }
},
UpdateMasterData: async (req: Request, res: Response) => {
  try {
    const{
      id, 
      name,
      type
    } = req.body
    const master  = await MasterData.findByPk(id);
    if (!master) {
      return res.status(404).json({ message:"master data not found" });

     }
     master.name = name || master.name;
     master.type = type || master.type;
    //  customers.image = image || customers.image;
      await master.save();
      res.status(200).json({ status:1,message: "master data update successfully",data:master
       });
      
  } catch (error) {
      console.error(error);
      res.status(500).json({ message:"Internal Server Error"});

      
  }


  },

DeleteMasterData:async (req:Request,res:Response)=>{
  try {
    const id = req.body.id
    const GetMasterData = await MasterData.findByPk(id)
    if(!GetMasterData){
      res.json({status:0,message:"Master data not found"})
    }
  await GetMasterData?.destroy()
  res.json({status:1,message:"Master data delete successfully"})
  } catch (error) {
    
  }
},
UserList:async (req:Request,res:Response)=>{
  try {
    const { page = 1, pageSize = 10, search = "" } = req.body;
    const offset = (Number(page) - 1) * Number(pageSize);
    const limit = Number(pageSize);

    const whereCondition = search
      ? {
          [Op.or]: [
            { fullName: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          { mobilenumber: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};
    const totalCount = await User.count({ where: whereCondition });

    const GetUserList = await User.findAll({
      attributes: ['id', 'fullName', 'email','mobilenumber'],
      where: whereCondition,
      limit,
      offset,
    });

    return res.status(200).json({
      status: 1,
      message: "User List retrieved successfully",
      data: GetUserList,
      pagination: {
        totalPages: Math.ceil(totalCount / pageSize),
        totalCount,
        currentPage: Number(page),
        pageSize: Number(pageSize),
      },
    });
    
  } catch (error) {
    console.error("Error in GetMasterData:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  }
},
DeleteUser: async (req: Request, res: Response) => {
  const { id, deleteType } = req.body;

  if (!id) {
    return res.json({ status: 0, message: "id is required" });
  }

  if (deleteType === "soft") {
    // Soft Delete: isDeleted ko true karna hai
    await User.update({ isDeleted: true }, { where: { id } });
    return res.json({ status: 1, message: "uer soft deleted successfully" });
  } else if (deleteType === "hard") {
       // Delete related records in Resumes firstc
    
        

         
    

    // Hard Delete: Data remove karna hai
    await User.destroy({ where: { id } });
    return res.json({ status: 1, message: "user hard deleted successfully" });
  } else {
    return res.json({ status: 0, message: "Invalid deleteType. Use 'soft' or 'hard'." });
  }
},

BlockUnblockUser: async (req: Request, res: Response) => {
  try {
    const { id, action } = req.body;
    console.log("Request body:", req.body);

    // Validate required fields
    if (!id || !action) {
      return res.status(400).json({ status: 0, message: "id and action are required" });
    }

    // Find user by ID
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ status: 0, message: "User not found" });
    }

    // Update isBlock based on action
    if (action === "block") {
      user.isBlock = true;
    } else if (action === "unblock") {
      user.isBlock = false;
    } else {
      return res.status(400).json({ status: 0, message: "Invalid action. Use 'block' or 'unblock'." });
    }

    // Save changes
    await user.save();

    return res.status(200).json({ status: 1, message: `User ${action}ed successfully` });

  } catch (error) {
    console.error("Error in BlockUnblockUser:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
  }
},
AddProductSubscription: async (req: Request, res: Response) => {
  try {
       // Step 1: Product banao
       const product = await stripe.products.create({
        name: 'Premium Plan',
        description: 'Monthly premium subscription',
      });
  
      // Step 2: Price banao (recurring ke liye)
      const price = await stripe.prices.create({
        unit_amount: 1000, // amount in cents ($10)
        currency: 'usd',
        recurring: { interval: 'month' },
        product: product.id,
      });
  
      res.json({
        message: 'Product and price created successfully',
        productId: product.id,
        priceId: price.id,
      });
  } catch (error) {
    console.error("Error in AddProductSubscription:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  }

},
getproductsubscription: async (req: Request, res: Response) => {
  try {
    // Step 1: Get all products
    const products = await stripe.products.list({ limit: 100 });

    // Step 2: For each product, get its prices
    const productData = await Promise.all(
      products.data.map(async (product) => {
        const prices = await stripe.prices.list({
          product: product.id,
          limit: 10,
        });

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          prices: prices.data.map((price) => ({
            id: price.id,
            currency: price.currency,
            unit_amount: price.unit_amount,
            recurring: price.recurring,
          })),
        };
      })
    );

    res.json({status:1,message:"subscription list get successfully",data:productData});
  } catch (err) {
    console.error('Stripe Error:', err);
    res.status(500).json({ error: err });
  }
},

updateProductSubscription: async (req: Request, res: Response) => {
  try {
    
    
  } catch (error) {
    console.error("Error in updateProductSubscription:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  
  }

},
checkoutsession: async (req: Request, res: Response) => {
  try {
    const { priceId } = req.body;
    console.log(priceId, "PRICE ID");

    // Step 1: Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'], // add more if needed
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `http://${req.headers.host}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://${req.headers.host}/cancel`,
    });

    // Step 2: Redirect to the Checkout Session URL
    res.json({status:1,message:"checkout session created successfully",url: session.url});
    

  } catch (error) {
    console.error("Error in checkoutsession:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  }
},
webhook: async (req: Request, res: Response) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

    let event: Stripe.Event;

    try {
      if (!sig) {
        throw new Error('Stripe signature is missing');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Error constructing webhook event:', err);
      return res.status(400).send(`Webhook Error: ${err}`);

    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        console.log('Checkout session completed:', session);
        break;
      // Handle other event types as needed
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
    
  } catch (error) {
    console.error("Error in webhook:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  }
},
PausedSubscription: async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;
    console.log(subscriptionId, "SUBSCRIPTION ID");

    // Step 1: Pause the subscription
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: { behavior: 'mark_uncollectible' },
    });

    res.json({status:1,message:"subscription paused successfully",data:subscription});
    
  } catch (error) {
    console.error("Error in PausedSubscription:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  }
},
ResumeSubscription: async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;
    console.log(subscriptionId, "SUBSCRIPTION ID");

    // Step 1: Resume the subscription
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });

    res.json({status:1,message:"subscription resumed successfully",data:subscription});
    
  } catch (error) {
    console.error("Error in ResumeSubscription:", error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  }

},
cancelSubscription: async (req: Request, res: Response) => {
  try {
    const { subscriptionId} = req.body;
    console.log(subscriptionId, "SUBSCRIPTION ID")
  
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  console.log(subscription, "SUBSCRIPTION CANCELLED")
  res.json({status:1,message:"subscription cancelled successfully",data:subscription});
  



  } catch (error) {
    console.error('Error in cancelSubscription:', error);
    res.status(500).json({ status: 0, message: 'Internal Server Error' });
  }
},


 }
