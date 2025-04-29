import { Request, Response } from "express";
import User from "../models/user";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import path from "path";
import hbs from "handlebars";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_KEY ?? "");

import fs from "fs";
import nodemailer from "nodemailer";
import Subscription from "../models/subsciption";
import Pet from "../models/pet";
const templatePath = path.join(__dirname, '../../views/otptemplate.hbs');
const source = fs.readFileSync(templatePath, 'utf-8');
const template = hbs.compile(source);
let imageCounter = 1; // A simple counter (in-memory)



export default {
  
  



UserRegister: async (req: Request, res: Response) => {
    try {
      const {  password, email,fullName,mobilenumber } = req.body;
      // Validate input
      if (!email || !password) {
        return res.json({ status: 0, message: "All input is required." });
      }

      // Check if user already exists
      const oldUser = await User.findOne({ where: { email } });
      if (oldUser) {
        return res.json({ status: 0, message: "Email already exists." });
      }

      // Encrypt password
      const encryptedPassword = await bcrypt.hash(password, 10);


      const stripeCustomer = await stripe.customers.create({
        name: `${fullName}`,
        email: email,
    });
     await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email, // Use the email provided by the user
      capabilities: {
          transfers: { requested: true },
          card_payments: { requested: true }
      }
  });
      // Create new user
      const newUser = await User.create({
    
        password: encryptedPassword,
        email,
        fullName,
        mobilenumber,

        stripeCustomerId: stripeCustomer.id,

    
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          user_id: newUser.id,
          email: newUser.email,
        },
        process.env.TOKEN_KEY as string,
        // { expiresIn: "2h" } // Token expiration time
      );

      // Prepare response data
      const data = {
        id: newUser.id,
        email: newUser.email,
        image:newUser.image,
        fullName:newUser.fullName,
        mobilenumber:newUser.mobilenumber,
        token,
      };

      return res.json({ status: 1, message: "User registered successfully", data });
    } catch (error) {
      console.error("Error in customerRegister:", error);
      return res.status(500).json({ status: 0, message: "Internal Server Error" });
    }
  },

  UserLogin: async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        console.log(req.body, "BODY");
        
      

        // Validate user input
        if (!(email && password)) {
            return res.status(400).json({ status: 0, message: "All input is required." });
        }

        // Find user by email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(400).json({ status: 0, message: "Invalid Email" });
        }
 
        await user.save(); // Save the updated user object

        const isPasswordValid = await bcrypt.compare(password, user.password as unknown as string);

        if (!isPasswordValid) {
            return res.status(400).json({ status: 0, message: "Invalid Password" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                fullName: user.fullName,
                mobilenumber:user.mobilenumber,
                email: user.email,
            },
            process.env.TOKEN_KEY as string, // Use your secret key stored in .env
            // { expiresIn: '1h' } // Token expiration time (optional)
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
                token: token,
                
                image:user.image,


            },
        });
    } catch (error) {
        // Handle unexpected errors
        console.error(error);
        return res.status(500).json({ status: 0, message: "Internal server error" });
    }
},
UserUpdate: async (req: Request, res: Response) => {
    try {
        // Get user_id from the request
        const user_id = req.user?.id;
        if (!user_id) {
            return res.status(400).json({ message: 'User ID is missing or invalid' });
        }

        // Get the updated user data from the request body
        const { fullName, email,mobilenumber } = req.body;

console.log(req.body,"boDY");
const image = req.file?.path; // Normalize path

        // Validate required fields
        
        // Assuming you're using Mongoose to interact with your database
        // You can modify this to use Sequelize or your specific ORM
        let user = await User.findByPk(user_id);

  

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

            // Update the user's information
      user.fullName =  fullName ?? user.fullName;
      user.email = email ?? user.email;
      user.mobilenumber = mobilenumber ?? user.mobilenumber;
      user.image= image ?? user.image


      await user.save();

        // Return success response with the updated user data
        res.json({ status:1,message: 'User updated successfully', user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
},
ChangePass: async (req: Request, res: Response) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ status: 0, message: 'Old and new passwords are required' });
        }

        if (oldPassword === newPassword) {
            return res.status(400).json({ status: 0, message: "New password cannot be the same as the old password" });
        }

        const user = await User.findByPk(req.user?.id);
        console.log(user,"USER GET");
        

        if (!user) {
            return res.status(404).json({ status: 0, message: 'User not found' });
        }

        const isValidPassword = await bcrypt.compare(oldPassword, user.password); // Ensure 'user.password' is a string

        if (!isValidPassword) {
            return res.status(400).json({ status: 0, message: 'Invalid old password' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        user.password = hashedPassword; // Ensure 'hashedPassword' type matches 'user.password'
        await user.save();

        return res.status(200).json({ status: 1, message: "Password changed successfully" });
    } catch (err: any) {
        console.error("Error:", err.message);
        return res.status(500).json({ status: 0, message: "Failed to change password" });
    }
},
SocialLogin: async (req: Request, res: Response) => {
    const {  email, socialType,socialId,fullName} = req.body;
console.log(req.body,"BODY");

    try {
        // Check if user exists in the database based on email
        let user = await User.findOne({ where: { email } });

        if (user) {
            // Update user with social login details if user already exists
            user.socialId = socialId;
            user.socialType = socialType;
         
            user.fullName = fullName ?? user.fullName;

            // Save the updated user details
            await user.save();

            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email },
                process.env.TOKEN_KEY as string, // Use your secret key stored in .env
            );

            // Send response back to client
            return res.json({
                status: 1,
                message: 'Login successful',
                data: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    // mobilenumber: user.mobilenumber,
                    token: token,
                },
            });
        } else {
            // If user doesn't exist, create a new user
            const newUser = await User.create({
                email,
                fullName,
                socialId,
                socialType,
                // deviceToken,
                // deviceType,
            });

            // Generate JWT token for the new user
            const token = jwt.sign(
                { userId: newUser.id, email: newUser.email },
                process.env.TOKEN_KEY as string, // Use your secret key stored in .env
            );

            // Send response back to client for the newly registered user
            return res.json({
                status: 1,
                message: 'Registration successful',
                data: {
                    id: newUser.id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    // mobilenumber: newUser.mobilenumber,
                    token: token,
                },
            });
        }
    } catch (error) {
        console.error('Error during social login:', error);

        // Send error response
        return res.status(500).json({
            status: 0,
            message: 'Internal Server Error',
        });
    }
},
UserForgetPassword: async (req: Request, res: Response) => {
    const email = req.body.email;

  try {
    // Step 1: Check if email exists in the database
    const user = await User.findOne({
      where: { email: email },
    });

    if (!user) {
      return res.status(400).json({ status: 0, message:'User not found' });
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
    transporter.sendMail(mailOptions, (error: Error | null, info: nodemailer.SentMessageInfo) => {
      if (error) {
        return res.status(500).json({ status: 0, message: 'Failed to send OTP email' });
      }
      return res.status(200).json({ status: 1, message: 'OTP sent to email successfully' });
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: 0, message:'Internal Server Error' });
  }

},
UserOtpVerify: async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  console.log(req.body, "BODY");
  if(!otp){
  return  res.json({status:0, message:"email and otp required"})
  }

  try {
    // Step 1: Check if the email exists
    const user = await User.findOne({ where: { email } });

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
UserUpdatePassword: async (req: Request, res: Response) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ where: { email } });

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
    console.error('Error updating password:', error);
    return res.status(500).json({
      status: 0,
      message: 'Internal Server Error',
    });
    
  }
 

},
// ______________________________       STRIPE USING PAYMENT INTENT       ___________________________


GetProductSubscription: async (req: Request, res: Response) => {
  try {
    const products = await stripe.products.list({ limit: 10 });
    const prices = await stripe.prices.list({ limit: 10 });

    const productList = products.data.map((product) => {
      const productPrices = prices.data
        .filter((price) => price.product === product.id)
        .map((price) => ({
          id: price.id,
          price: price.unit_amount ? price.unit_amount / 100 : 0, // Cents to Dollars
          interval: price.recurring?.interval ?? 'month'
        }));

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        features: product.metadata.features ? JSON.parse(product.metadata.features) : [],
        prices: productPrices,
      };
    });

    res.status(200).json({
      status: 1,
      message: 'Products fetched successfully!',
      products: productList,
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ status: 0, message: 'Internal Server Error' });
  }
},

AttechedPaymentMethod: async (req: Request, res: Response) => {
  try {
    const { paymentMethodId } = req.body;
    const userId = req.user?.id; // Assuming you have user authentication middleware

    if (!paymentMethodId) {
      return res.status(400).json({ status: 0, message: 'Payment method ID is required' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ status: 0, message: 'User not found' });
    }

    const customerId = user.stripeCustomerId;
    if (!customerId) {
      return res.status(400).json({ status: 0, message: 'Customer ID not found' });
    }

    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });

    // Set the default payment method for the customer
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.json({ status: 1, message: 'Payment method attached successfully' });
    
  } catch (error) {
    console.error('Error in createSubscription:', error);
    res.status(500).json({ status: 0, message: 'Internal Server Error' });
    
  }
},
createSubscription: async (req: Request, res: Response) => {
  try {
    const { priceId, paymentMethodId } = req.body;
    const userId = req.user?.id;

    if (!priceId || !paymentMethodId) {
      return res.status(400).json({ status: 0, message: 'Price ID and Payment Method ID are required' });
    }

    const user = await User.findByPk(userId);
    if (!user?.stripeCustomerId) {
      return res.status(404).json({ status: 0, message: 'User or Stripe customer not found' });
    }

    const customerId = user.stripeCustomerId;

    // Attach payment method and set as default
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      default_payment_method: paymentMethodId,
    });

    if (!subscription.latest_invoice) {
      return res.status(400).json({ status: 0, message: 'No latest invoice found for this subscription' });
    }

    const invoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);

    const commonSubscriptionData = {
      userId,
      customerId,
      subscriptionId: subscription.id,
      productId: priceId,
      status: subscription.status as "active" | "canceled" | "incomplete" | "past_due" | undefined,
      currentPeriodStart: subscription.start_date ? new Date(subscription.start_date * 1000) : undefined,
      currentPeriodEnd: subscription.ended_at ? new Date(subscription.ended_at * 1000) : undefined,
      nextBillingDate: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000) : undefined,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : undefined,
    };

    if (invoice.status === 'paid') {
      await Subscription.create(commonSubscriptionData);

      return res.json({
        status: 1,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        subscription,
        message: 'Subscription created and payment processed successfully',
      });
    }

    const paymentIntentId = (invoice as any)?.payment_intent;
    if (!paymentIntentId) {
      return res.status(400).json({ status: 0, message: 'No payment intent associated with this invoice' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    await Subscription.create({
      ...commonSubscriptionData,
      status: 'incomplete', // Because payment not done yet
    });

    return res.json({
      status: 1,
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subscriptionStatus: subscription.status,
    });

  } catch (error) {
    console.error('Error in createSubscription:', error);
    return res.status(500).json({
      status: 0,
      message: 'Subscription creation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
},

PauseSubscription: async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ status: 0, message: 'Subscription ID is required' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ status: 0, message: 'Subscription not found' });
    }

    // Pause the subscription
    const pausedSubscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: { behavior: 'mark_uncollectible' },
    });

    // Update your local database if needed
    await Subscription.update(
      { status: 'paused' }, // Update the status to 'paused'
      { where: { subscriptionId } }
    );

    return res.json({
      status: 1,
      message: 'Subscription paused successfully',
      subscription: pausedSubscription,
    });
    

  } catch (error) {
    console.error('Error in pauseSubscription:', error);
    return res.status(500).json({
      status: 0,
      message: 'Failed to pause subscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
  }
},
ResumeSubscription: async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({ status: 0, message: 'Subscription ID is required' });
    }

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    if (!subscription) {
      return res.status(404).json({ status: 0, message: 'Subscription not found' });
    }

    // Resume the subscription
    const resumedSubscription = await stripe.subscriptions.update(subscriptionId, {
      pause_collection: null,
    });

    // Update your local database if needed
    await Subscription.update(
      { status: 'active' }, // Update the status to 'active'
      { where: { subscriptionId } }
    );

    return res.json({
      status: 1,
      message: 'Subscription resumed successfully',
      subscription: resumedSubscription,
    });
    

  } catch (error) {
    console.error('Error in resumeSubscription:', error);
    return res.status(500).json({
      status: 0,
      message: 'Failed to resume subscription',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
}

},
AddCard: async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User not properly authenticated" });
    }

    // Fetch stripeCustomerId from the database
    const users = await User.findOne({ where: { id: userId } });

    if (!users) {
      return res.status(404).json({ message: "Users not found" });
    }

    const stripeCustomerId = users.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(400).json({ message: "Stripe customer ID not found" });
    }

    const { token } = req.body;

    // Attach the card to the Stripe customer
    const stripeResponse = await stripe.customers.createSource(stripeCustomerId, { source: token });

    if (!stripeResponse) {
      return res.status(400).json({ message: "Failed to create source with Stripe" });
    }

    return res.status(200).json({
      status: 1,
      message: "Card added successfully",
      data: stripeResponse,
    });

  } catch (error) {
    console.error("Error in AddCard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
},

GetCard: async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ message: "User not properly authenticated" });
    }

    // Fetch stripeCustomerId from the database
    const users = await User.findOne({ where: { id: userId } });

    if (!users) {
      return res.status(404).json({ message: "user not found" });
    }

    const stripeCustomerId = users.stripeCustomerId;

    if (!stripeCustomerId) {
      return res.status(400).json({ message: "Stripe customer ID not found" });
    }

    // Retrieve cards from the Stripe customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: stripeCustomerId,
      type: "card", // Specify the type of payment method to filter by
    });

    if (!paymentMethods?.data || paymentMethods.data.length === 0) {
      return res.status(404).json({ message: "No cards found for the customer" });
    }

    // Return the list of cards
    return res.status(200).json({
      status: 1,
      message: "Cards retrieved successfully",
      data: paymentMethods.data,
    });

  } catch (error) {
    console.error("Error in GetCard:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
},
DeleteCard: async (req: Request, res: Response) => {
  try {
    const { cardId } = req.body;
    const userId = req.user?.id; // Assuming you have user authentication middleware

    if (!cardId) {
      return res.status(400).json({ status: 0, message: 'Card ID is required' });
    }

    const user = await User.findByPk(userId);
    if (!user?.stripeCustomerId) {
      return res.status(404).json({ status: 0, message: 'User or Stripe customer not found' });
    }

    // Detach the card from the customer
    await stripe.paymentMethods.detach(cardId);

    return res.json({
      status: 1,
      message: 'Card deleted successfully',
    });
  } catch (error) {
    console.error('Error in deleteCard:', error);
    return res.status(500).json({
      status: 0,
      message: 'Failed to delete card',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
},

AddPet: async (req: Request, res: Response) => {
  const userId = req.user?.id; // Use authenticated user ID

  try {
    const {
      petName,
      Gender,
      dob,
      breed,
      Vaccination,
      Size,
      Fleawormed,
      Desexed,
      MedicalData,
      healthConcerns
    } = req.body;

    // Basic validation
    if (!petName || !Gender || !dob) {
      return res.status(400).json({ message: 'Pet Name, Gender, and DOB are required.' });
    }
    if (!userId) {
      return res.status(400).json({ message: 'User not properly authenticated' });
    }

    const photos: { id: number; image: string }[] = [];
    const pdfs: { id: number; file: string }[] = [];
    let vaccinationCertificate: string | undefined = undefined; // For storing single vaccination certificate path
    
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

        // Check if the file is an image (either by MIME type or extension)
        if (file.mimetype.startsWith('image/') || ['jpg', 'jpeg', 'png'].includes(fileExtension ?? '')) {
          photos.push({
            id: imageCounter++,
            image: file.path,
          });
        }
        // Check if the file is a PDF (either by MIME type or extension)
        else if (file.mimetype === 'application/pdf' || fileExtension === 'pdf') {
          pdfs.push({
            id: imageCounter++,
            file: file.path,
          });

          // Check if this is the vaccination certificate (single PDF)
          if (file.fieldname === 'vaccinationCertificate') {
            vaccinationCertificate = file.path; // Store the path of the vaccination certificate
          }
        }
      });
    }

    console.log(photos, "PHOTOS");
    console.log(pdfs, "PDFS");
    console.log(vaccinationCertificate, "VACCINATION CERTIFICATE");

    // Create Pet
    const newPet = await Pet.create({
      petName,
      Gender,
      dob,
      breed,
      Vaccination,
      Size,
      Fleawormed,
      Desexed,
      pdf: pdfs,
      Photos: photos,
      MedicalData,
      healthConcerns,
      userId,
      vaccinationCertificate    // Store the vaccination certificate path (if any)
    });

    return res.status(201).json({ message: 'Pet added successfully', pet: newPet });
  } catch (error) {
    console.error('Error adding pet:', error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
},

getPet: async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Assuming you have user authentication middleware

    if (!userId) {
      return res.status(400).json({ message: 'User not properly authenticated' });
    }

    // Fetch pets for the user
    const pets = await Pet.findAll({ where: { userId } });

    if (!pets || pets.length === 0) {
      return res.status(404).json({ message: 'No pets found for this user' });
    }

    return res.status(200).json({ message: 'Pets retrieved successfully', pets });
    

  } catch (error) {
    console.error('Error fetching pet:', error);
    return res.status(500).json({ message: 'Something went wrong', error });
    
  }
},
petDelete: async (req: Request, res: Response) => {
  try {
    const petId = req.body.id; // Assuming you're passing the pet ID in the URL

    if (!petId) {
      return res.status(400).json({ message: 'Pet ID is required' });
    }

    // Find and delete the pet
    const pet = await Pet.findByPk(petId);

    if (!pet) {
      return res.status(404).json({ message: 'Pet not found' });
    }

    await pet.destroy();

    return res.status(200).json({ message: 'Pet deleted successfully' });
  } catch (error) {
    console.error('Error deleting pet:', error);
    return res.status(500).json({ message: 'Something went wrong', error });
  }
},
UpdatePet: async (req: Request, res: Response) => {
  // try {
    
    
  // } catch (error) {
  //   console.error('Error updating pet:', error);
  //   return res.status(500).json({ message: 'Something went wrong', error });Q
    
  // }
}



}




