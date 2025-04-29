import { Request, Response } from 'express';
import dotenv from 'dotenv';
import paypal from 'paypal-rest-sdk';
dotenv.config();

// Set up PayPal environment
paypal.configure({
    mode: 'sandbox', // or 'live'
    client_id: process.env.PAYPAL_CLIENT_ID || 'YOUR_CLIENT_ID',
    client_secret: process.env.PAYPAL_CLIENT_SECRET
    || 'YOUR_SECRET'
});


export default {


  GetProductSubscription: async (req: Request, res: Response) => {
    // try {
    //     // Create a request to get products
    //     const request = new paypal.products.ProductsListRequest();
        
    //     // Optional query parameters
    //     const page = req.query.page || 1;
    //     const pageSize = req.query.pageSize || 20;
        
    //     // Set pagination
    //     request.page(page);
    //     request.pageSize(pageSize);
        
    //     // Execute the request
    //     const response = await client.execute(request);
        
    //     // Return the products
    //     res.json({
    //       status: 'success',
    //       products: response.result.products || [],
    //       total_items: response.result.total_items,
    //       total_pages: response.result.total_pages,
    //       page: response.result.page
    //     });
    //   } catch (err) {
    //     console.error('PayPal Error:', err);
    //     res.status(500).json({ 
    //       error: 'Failed to fetch products',
    //       details: err instanceof Error ? err.message : 'Unknown error'
    //     });
    //   }
    }
  
    
}
  