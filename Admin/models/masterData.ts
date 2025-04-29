import { Model, DataTypes } from 'sequelize';
import sequelize from '../../models/index';

interface MasterAttributes {
  id?: number; // Use string type for UUID
  name?: string;
  type?: string;


  
 

}

class MasterData extends Model<MasterAttributes> {
    id!: number; // Use string type for UUID
    name!: string;
    type!: string;


   

}

MasterData.init(
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
      type:{
        type:DataTypes.STRING,
        allowNull:true
      },

  

  },
  {
    sequelize,
    modelName: 'masterData',
  }
);

export default MasterData;
