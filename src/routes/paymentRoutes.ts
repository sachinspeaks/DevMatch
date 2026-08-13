import express, { type Request, type Response } from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import rpayInstance from "../utils/razorpay.js";
import { PaymentModel } from "../models/paymentModel.js";
import { memberShipAmount } from "../utils/constants.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";
import { UserModel } from "../models/userModel.js";
import { resolveSoa } from "node:dns";

const paymentRouter = express.Router();

type MembershipPlan = keyof typeof memberShipAmount;

const isMembershipPlan = (planType: unknown): planType is MembershipPlan =>
  typeof planType === "string" && planType in memberShipAmount;

paymentRouter.post(
  "/payment/create",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { planType } = req.body;
      if (!isMembershipPlan(planType)) {
        return res.status(400).json({ message: "Invalid membership plan." });
      }
      if (!req.user) throw new Error("User Not Found.");
      const { firstName, lastName, email } = req.user;
      var options = {
        amount: memberShipAmount[planType] * 100, //this is paisa i.e. the smallest denomination of a currency.
        currency: "INR",
        receipt: "order_rcptid_1",
        notes: {
          firstName,
          lastName,
          emailId: email,
          planType,
        },
      };
      const order = await rpayInstance.orders.create(options);

      //save it(order details) in db.
      const paymentData = await new PaymentModel({
        userId: req.user?._id,
        orderId: order.id,
        status: order.status,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        notes: order.notes,
      });

      //return back order details to frontend.
      const savedPayment = await paymentData.save();

      res.json({ order, savedPayment, apiKey: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
      res.status(500).json({ error });
    }
  },
);

paymentRouter.post("/payment/webhook", async (req, res) => {
  try {
    const webHookSignature = req.headers["X-Razorpay-Signature"] || "";
    if (Array.isArray(webHookSignature))
      throw new Error("Web Hook signature is not valid.");

    const webHookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
    const isWebHookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      webHookSignature,
      webHookSecret,
    );
    if (!isWebHookValid)
      return res.status(400).json({ message: "Invalid webhook signature." });

    const paymentDetails = req.body.payload.payment.entity;
    const payment = await PaymentModel.findOne({
      orderId: paymentDetails.order_id,
    });
    if (payment) {
      payment.status = paymentDetails.status;
      await payment.save();
    }
    if (!payment || !payment.userId)
      throw new Error("invalid payment saved in db.");

    const user = await UserModel.findOne({ _id: payment?.userId });
    if (!user) throw new Error("User not found in db.");

    user.isPremium = true;
    user.membershipType = payment.notes?.planType || "premium";

    console.log("user.firstName is now premium");
    await user.save();

    // if (req.body.event === "payment.captured") {
    //   //update the payment status in db.
    //   //update the user as premium
    // }
    // if (req.body.event === "") {
    // }
    //at last be sure to send success status code to razorpay.

    return res.status(200).json({ message: "Webhook received successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

export default paymentRouter;
