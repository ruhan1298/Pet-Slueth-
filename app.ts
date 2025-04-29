import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import sequelize from './models/index'  // Import the sequelize instance from the models directory
import cors from 'cors'

import createError from 'http-errors';
import dotenv from 'dotenv';
dotenv.config();

// import UserRouter from './User/routes/auth';
// import AdminRouter from './Admin/routes/auth'
// import User from './User/models/user';

// import indexRouter from './routes/index';
// import usersRouter from './routes/users';
import authRouter from './Admin/routes/auth'
import userRouter from './User/routes/user'
import subscriptionRouter from './paypal/routes/subscription'
import SubscriptionRouter from   './Admin/routes/subscription';


const app = express();



// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/uploads", express.static("uploads"));
app.use(cors());

import index from './models/index'
import User from './User/models/user'
User.sync({alter:true})
import Product from './Admin/models/product';
// Product.sync({force:true})
import Pet from './User/models/pet';
Pet.sync({alter:true})
import Subscription from './User/models/subsciption';
Subscription.sync({alter:true})

import MasterData from './Admin/models/masterData';
// MasterData.sync({force:true
// })
// import Admin from './Admin/models/auth';
// Admin.sync({force:true})
// User.sync({force:true})
// import Category from './Admin/models/category';
// // Category.sync({alter:true})
// import SubCategory from './Admin/models/subcategory';
// // SubCategory.sync({alter:true})
// import Admin from './Admin/models/auth';
// import Interests from './/User/models/Interests';
// // Interests.sync({alter:true})Us
// import Post from './User/models/post';
// // Post.sync({force:true})
// // Admin.sync({alter:true})
// // Post.sync({alter:true})
// // Post.sync({alter:true})
// import Group from './User/models/GroupMember';
// // Group.sync({alter:true})
// User.sync({alter:true})
// // User.sync({force:true})
// import Report from './User/models/Report';
// // Report.sync({force:true})
// // Report.sync({alter:true})
// import Notification from './User/models/Notification';
// Notification.sync({alter:true})
// import customerService from './User/models/customerService';
// // customerService.sync({force:true})
// // app.use('/', indexRouter);
app.use('/api/v1/user', userRouter);
app.use('/api/v1/admin', authRouter);

app.use('/api/v1/subscription', subscriptionRouter);
app.use('/api/v1/admin/subscription', SubscriptionRouter);
sequelize.sync().then(() => {
  console.log('Database connected');
}).catch((error: Error) => {  // Explicitly type `error` as `Error`
  console.error('Failed to sync database:', error);
});


// Error handler


// Start the server directly in `app.ts`
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


export default app;
