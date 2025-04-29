import { Model, DataTypes } from 'sequelize';
import sequelize from '../../models/index';
import { Json } from 'sequelize/types/utils';

interface ProductAttributes {
  id?: number; // Use string type for UUID
  name?: string;
  description?: string;
  stripeProductId?: string;
  stripePriceId?: string;
  price?: number;
  features?:Json;
  isActive?:boolean



  
 

}

class Product extends Model<ProductAttributes> {
    id!: number; // Use string type for UUID
    name!: string;
    description!: string;
    stripeProductId!: string;
    stripePriceId!: string;
    price!: number;

    features!:Json;
    isActive!:boolean



   

}

Product.init(
  {
   
    id: {
        type: DataTypes.INTEGER, // Change this to UUID
        // defaultValue: DataTypes.UUIDV4, // Automatically generate UUID
        allowNull: false,
        primaryKey: true,
        autoIncrement:true
      },
   name : {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description:{
        type:DataTypes.STRING,
        allowNull:true
      },
        stripeProductId:{
            type:DataTypes.STRING,
            allowNull:true
        },
        stripePriceId:{
            type:DataTypes.STRING,
            allowNull:true
        },
        price:{
            type:DataTypes.FLOAT,
            allowNull:true
        },
        features:{
            type:DataTypes.JSON,
            allowNull:true
        },
        isActive:{
            type:DataTypes.BOOLEAN,
            allowNull:true
        }

  

  },
  {
    sequelize,
    modelName: 'Product',
  }
);

export default Product;
