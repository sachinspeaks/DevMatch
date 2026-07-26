import { SendEmailCommand } from "@aws-sdk/client-ses";
import { sesClient } from "./sesClient.js";

const createSendEmailCommand = (
  toAddress: string,
  fromAddress: string,
  body: string,
) => {
  return new SendEmailCommand({
    Destination: {
      CcAddresses: [],
      ToAddresses: [toAddress],
    },
    Message: {
      Body: {
        Text: {
          Charset: "UTF-8",
          Data: body,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "You got a Dev's Invite.",
      },
    },
    Source: fromAddress,
    ReplyToAddresses: [],
  });
};

const run = async (body: string, receiver: string) => {
  const sendEmailCommand = createSendEmailCommand(
    receiver,
    "admin@devmatch.geekysachin.com",
    body,
  );

  try {
    return await sesClient.send(sendEmailCommand);
  } catch (caught) {
    if (caught instanceof Error && caught.name === "MessageRejected") {
      /** @type { import('@aws-sdk/client-ses').MessageRejected} */
      const messageRejectedError = caught;
      return messageRejectedError;
    }
    throw caught;
  }
};

// snippet-end:[ses.JavaScript.email.sendEmailV3]
export { run };
