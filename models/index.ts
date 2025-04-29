// src/models/index.ts
import { Sequelize } from 'sequelize-typescript';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  database: process.env.DB_NAME!,
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  host: process.env.DB_HOST!,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  dialect: 'mysql',
  logging: false,
});



// Setup associations AFTER model definitions
// Category -> SubCategory


// If you have subcategories table


// export {
//   sequelize,
//   Category,
//   SubCategory,
//   User,
//   Interests,
//   Post,
//   Group,
//   Report,
// };
export default sequelize;
