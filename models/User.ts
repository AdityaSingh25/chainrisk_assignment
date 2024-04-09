import mongoose, { Document, Schema } from "mongoose";

interface IBeforeAfterLiquidation {
  suppliedAmount: number;
  borrowedAmount: number;
  healthFactor: number;
}

// Extending Document to include the properties of the User data
interface IUserData extends Document {
  address: string;
  suppliedAmount: number;
  borrowedAmount: number;
  healthFactor: number;
  beforePriceDrop: IBeforeAfterLiquidation;
  afterLiquidation: IBeforeAfterLiquidation;
}

const BeforeAfterLiquidationSchema: Schema<IBeforeAfterLiquidation> =
  new Schema({
    suppliedAmount: { type: Number, required: true },
    borrowedAmount: { type: Number, required: true },
    healthFactor: { type: Number, required: true },
  });

const UserSchema: Schema<IUserData> = new Schema({
  address: { type: String, required: true },
  suppliedAmount: { type: Number, required: true },
  borrowedAmount: { type: Number, required: true },
  healthFactor: { type: Number, required: true },
  beforePriceDrop: { type: BeforeAfterLiquidationSchema, required: true },
  afterLiquidation: { type: BeforeAfterLiquidationSchema, required: true },
});

// Exporting the model so it can be used in other files
export const UserData = mongoose.model<IUserData>("UserData", UserSchema);
