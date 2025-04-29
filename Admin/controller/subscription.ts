import { Request, Response } from "express";
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_KEY ?? "");
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";

import Product from "../models/product";
import Subscription from "../../User/models/subsciption";
import User from "../../User/models/user";
// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'tryoutscout@gmail.com',
    pass: 'xapfekrrmvvghexe'  // Replace this with the App Password if 2FA is enabled
  }
});

// Function to send email with dynamic content
const sendEmailNotification = async (userEmail: string, customerName: string, currentPrice: number, newPrice: number, updateDate: string) => {
  const filePath = path.join(__dirname, '../../views/priceupdatetemplate.hbs');

  // Read the HTML template
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading HTML template:', err);
      return;
    }

    // Replace placeholders with dynamic content
    const htmlContent = data
      .replace('{{customerName}}', customerName)
      .replace('{{currentPrice}}', currentPrice.toFixed(2))
      .replace('{{newPrice}}', newPrice.toFixed(2))
      .replace('{{updateDate}}', updateDate);

    // Prepare the email
    const mailOptions = {
      from: 'tryoutscout@gmail.com',
      to: userEmail,
      subject: 'Subscription Price Update',
      html: htmlContent
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
  });
};
export default {
    AddProductSubscription: async (req: Request, res: Response) => {
        const { name, description, price, features } = req.body;

        try {
          // Step 1: Stripe me Product create karo
          const stripeProduct = await stripe.products.create({
            name,
            description,
            metadata: { features: JSON.stringify(features) }, // Optional extra info
          });
      
          // Step 2: Stripe me Price create karo
          const stripePrice = await stripe.prices.create({
            unit_amount: Math.round(price * 100), // USD ke liye price cents me hota hai
            currency: 'usd',
            product: stripeProduct.id,
            recurring: { interval: 'month' }, // Monthly subscription, agar simple product hai to hata dena
          });
      
          // Step 3: Apne database me product save karo (Sequelize se)
          const product = await Product.create({
            name,
            description,
            price,
            features,
            stripeProductId: stripeProduct.id,
            stripePriceId: stripePrice.id,
          });
      
          // Step 4: Response bhejo
          res.status(200).json({
            status:1,
            message: 'Product created successfully!',
            product,
          });
      
        } catch (error) {
          console.error('Stripe Error:', error);
          res.status(500).json({ 
            message: 'Product creation failed', 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
    },
    GetProductSubscription: async (req: Request, res: Response) => {
        try {
          const products = await Product.findAll();
          res.status(200).json({
            status: 1,
            message: 'Products fetched successfully!',
            products,
          });
        } catch (error) {
          console.error('Database Error:', error);
          res.status(500).json({ 
            message: 'Failed to fetch products', 
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
    },
    UpdateProductSubscription: async (req: Request, res: Response) => {
      const { id, name, description, price, features } = req.body;

      try {
        // Step 1: Find the product by its ID (from Product model)
        const product = await Product.findByPk(id);
        if (!product) {
          return res.status(404).json({ message: 'Product not found' });
        }
    
        // Step 2: Update the product details in Stripe
        await stripe.products.update(product.stripeProductId, {
          name,
          description,
        });
    
        let newStripePriceId = product.stripePriceId; // default: old price id
    
        // Step 3: If the price has changed, create a new price in Stripe
        if (price && price !== product.price) {
          const newPrice = await stripe.prices.create({
            unit_amount: Math.round(price * 100),
            currency: 'usd',
            product: product.stripeProductId,
            recurring: { interval: 'month' },
          });
    
          newStripePriceId = newPrice.id;
    
          // Step 4: Fetch active subscriptions based on the stripeProductId
          const activeSubscriptions = await Subscription.findAll({
            where: {
              productId: product.stripeProductId, // This should be the stripeProductId from the Product model
              status: 'active', // Only active subscriptions
            },
          });
    
          // Log active subscriptions to debug
          console.log('Active Subscriptions:', activeSubscriptions);
    
          // Step 5: Loop through the active subscriptions and send the notification
          for (const subscription of activeSubscriptions) {
            // Step 6: Find the user by userId (subscription.userId)
            const user = await User.findByPk(subscription.userId);
            if (user) {
              console.log('User found:', user);
    
              // Step 7: Send email notification to the user
              await sendEmailNotification(
                user.email,
                user.fullName,
                product.price,
                price,
                new Date().toISOString().split('T')[0] // Current date for updateDate
              );
            } else {
              console.log('User not found for subscription:', subscription.userId);
            }
          }
        }
    
        // Step 8: Update the product in the local database
        await product.update({
          name,
          description,
          price,
          features,
          stripePriceId: newStripePriceId,
        });
    
        res.status(200).json({ message: 'Product updated successfully', product });
      } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({
          message: 'Failed to update product',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }    
    },

   // Customer Subscription Price Update in next billing cycle
    UpdateCustomerSubscriptionPrice: async (req: Request, res: Response) => {
        const { subscriptionId, newPriceId } = req.body;
      
        try {
          // Step 1: Find Subscription from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
          if (!subscription) {
            return res.status(404).json({ message: 'Subscription not found' });
          }
      
          // Step 2: Get current Subscription item ID
          const subscriptionItemId = subscription.items.data[0].id;
      
          // Step 3: Update Subscription Item with New Price
          await stripe.subscriptionItems.update(subscriptionItemId, {
            price: newPriceId,
        
          });
      
          res.status(200).json({ message: 'Customer subscription price updated successfully' });
      
        } catch (error) {
          console.error('Error updating subscription price:', error);
          res.status(500).json({ message: 'Failed to update subscription price', error });
        }
      },

      
      
};