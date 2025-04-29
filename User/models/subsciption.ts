import { Model, DataTypes } from 'sequelize';
import sequelize from '../../models/index';
import { Json } from 'sequelize/types/utils';

interface SubscriptionAttributes {
    id?: number;
    userId?: string;
    customerId?: string;
    subscriptionId?: string;
    productId?: string;
    status?: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'paused';
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    nextBillingDate?: Date;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date;



  
 

}

class Subscription extends Model<SubscriptionAttributes> {
    id!: number;
    userId!: string;
    customerId!: string;
    subscriptionId!: string;
    productId!: string;
    status!: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'paused';
    currentPeriodStart!: Date;
    currentPeriodEnd!: Date;
    nextBillingDate!: Date;
    cancelAtPeriodEnd!: boolean;
    canceledAt!: Date;
   

}

Subscription.init(
    {
      id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      customerId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subscriptionId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      productId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'canceled', 'past_due', 'incomplete','paused'),
        allowNull: false,
        defaultValue: 'active',
      },
      currentPeriodStart: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      nextBillingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancelAtPeriodEnd: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      canceledAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },  

  },
  {
    sequelize,
    modelName: 'Subscription',
  }
);

export default Subscription;
