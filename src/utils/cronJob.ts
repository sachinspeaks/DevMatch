import cron from "node-cron";
import { ConnectionRequestModel, Status } from "../models/connectionRequest.js";
import { endOfDay, startOfDay, subDays } from "date-fns";
import type { IUser } from "../models/userModel.js";
import { run } from "../utils/sendEmail.js";

// ┌───────────── second (optional, 0-59)
// │ ┌─────────── minute (0-59)
// │ │ ┌───────── hour (0-23)
// │ │ │ ┌─────── day of month (1-31)
// │ │ │ │ ┌───── month (1-12)
// │ │ │ │ │ ┌─── day of week (0-7, 0 and 7 are Sunday)
// │ │ │ │ │ │
// * * * * * *

cron.schedule("0 8 * * *", async () => {
  try {
    const yesterday = subDays(new Date(), 0);
    const yesterdayStart = startOfDay(yesterday);
    const yesterdayEnd = endOfDay(yesterday);
    const pendingRequestsOfYesterday = await ConnectionRequestModel.find({
      status: Status.Interested,
      createdAt: {
        $gte: yesterdayStart,
        $lte: yesterdayEnd,
      },
    }).populate<{ fromUserId: IUser; toUserId: IUser }>("fromUserId toUserId");
    const emails = [
      ...new Set(pendingRequestsOfYesterday.map((req) => req.toUserId.email)),
    ];
    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      const body = `You have new connection requests pending for ${email}. `;
      try {
        await run(body, email);
        sent++;
      } catch (error) {
        failed++;
        console.log(`sending email to ${email} failed `, error);
      }
    }
    console.log(`sent mail success to ${sent} people, ${failed} failed. `);
  } catch (error) {
    console.log("sending emails failed ", error);
  }
});
