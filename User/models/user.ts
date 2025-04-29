// models/ShowRoomUser.ts
import { Model, DataTypes } from 'sequelize';
import sequelize  from '../../models/index';
import { Json } from 'sequelize/types/utils';
interface UserAttributes {
  id?: string; // Use string type for UUID
  fullName?: string;
  image?: string;
  email?:string;
  mobilenumber?:string
  password?:string
  isCompletedProfile?:boolean
  isDeleted?:boolean
//   role?:string


//   permissions?: string[]; // Store allowed actions
  resetPasswordToken?:string
  resetPasswordExpires?:Date
//   language?:string
// interests?:any
    socialId?:string
    socialType?:string
    isBlock?:boolean
    stripeCustomerId?:string


  
 

}

class User extends Model<UserAttributes> {
    id!: string; // Use string type for UUID
    fullName!: string;
    image!: string;
    email!:string;
    // mobilenumber!:string;
    password!:string;

    mobilenumber!:string
    // role!:string;
    // permissions!: string[]; // Store allowed actions
    resetPasswordToken!:string
    resetPasswordExpires!:Date
    socialId!:string
    socialType!:string
    isDeleted!:boolean
     isBlock!:boolean

  stripeCustomerId!:string
    // language!:string
// interests!:any

}

User.init(
  {
   
    id: {
        type: DataTypes.UUID, // Change this to UUID
        defaultValue: DataTypes.UUIDV4, // Automatically generate UUID
        allowNull: false,
        primaryKey: true,
      },
    image: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fullName:{
        type:DataTypes.STRING,
        allowNull:true
      },
 
      password:{
        type:DataTypes.STRING,
        allowNull:true 
      },
      email:{
        type:DataTypes.STRING
      },

      resetPasswordExpires:{
        type:DataTypes.DATE,
        allowNull:true

      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },


      

  // interests:{
  //   type: DataTypes.JSON,// Use JSONB for PostgreSQL or JSON for MySQL
  //   allowNull: true,
  // },
  socialId:{
    type:DataTypes.STRING,
    allowNull:true
  },
  socialType:{    
    type:DataTypes.STRING,
    allowNull:true
  },
  isCompletedProfile:{
    type:DataTypes.BOOLEAN,
    allowNull:true,
    defaultValue:false

},
mobilenumber:{
    type:DataTypes.STRING,
    allowNull:true
},
isDeleted:{
    type:DataTypes.BOOLEAN,
    allowNull:true,
    defaultValue:false
},
isBlock:{
    type:DataTypes.BOOLEAN,
    allowNull:true,
    defaultValue:false
},
stripeCustomerId:{
    type:DataTypes.STRING,
    allowNull:true
},

  },

  {
    sequelize,
    modelName: 'User',
  }
);


export default User;
