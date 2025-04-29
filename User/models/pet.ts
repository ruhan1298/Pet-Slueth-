// models/ShowRoomUser.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../../models/index';
// import AddCarsPost from '../models/AddCarsPost';

interface PetAttributes {
  id?: number;
  petName?: string;
  Gender?: string;
  dob?: Date;
    breed?: string;
    Vaccination?: boolean;
    Size?: string;
    Fleawormed?: boolean;
    Desexed?: boolean;
    Photos ?: Array<{ id: number; image: string }>;
    vaccinationCertificate?: string;
    MedicalData?: string;
    pdf?: Array<{ id: number; file: string }>; // <-- updated to array
    healthConcerns?: string;
    userId?: string;




  
 

}

class Pet extends Model<PetAttributes> {
    id!: number;
    petName!: string;
    Gender!: string;
    dob!: Date;
      breed!: string;
      Vaccination!: boolean;
      Size!: string;
      Fleawormed!: boolean;
      Desexed!: boolean;
      Photos !: Array<{ id: number; image: string }>;
      vaccinationCertificate!: string;
      MedicalData!: string;
      pdf!: Array<{ id: number; file: string }>; // <-- updated to array
      healthConcerns!: string;
      userId!: string;




   

}

Pet.init(
    {
        id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        // Example fields (you should add all fields properly later)
        petName: {
          type: DataTypes.STRING,
        },
        Gender: {
          type: DataTypes.STRING,
        },
        dob: {
          type: DataTypes.DATE,
        },
        breed: {
          type: DataTypes.STRING,
        },
        Vaccination: {
          type: DataTypes.BOOLEAN,
        },
        Size: {
          type: DataTypes.STRING,
        },
        Fleawormed: {
          type: DataTypes.BOOLEAN,
        },
        Desexed: {
          type: DataTypes.BOOLEAN,
        },
        Photos: {
          type: DataTypes.JSON, // For multiple photos
        },
        pdf: {
          type: DataTypes.JSON, // For multiple pdf files
        },
        vaccinationCertificate: {
          type: DataTypes.STRING,
        },
        MedicalData: {
          type: DataTypes.STRING,
        },
        healthConcerns: {
          type: DataTypes.STRING,
        },
        userId: {
          type: DataTypes.STRING,
          allowNull: true,
        },
  },
  {
    sequelize,
    modelName: 'Pet',
  }
);

export default Pet;
