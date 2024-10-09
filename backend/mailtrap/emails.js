import { response } from "express";
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
} from "./emailsTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Verify Your Email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email Verification",
    });
    console.log("email send successfully!", response);
  } catch (error) {
    throw new Error(`Error sending verification email:${error}`);
  }
};

export const sendWelcomeEmail = async (email, name) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      template_uuid: "5c443d80-197e-4802-bc11-f29c0b88605f",
      template_variables: {
        name: name,
      },
    });
  } catch (error) {
    console.error(`Error sending welcome email`, error);

    throw new Error(`Error sending welcome email: ${error}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  const recipient = [{ email }];
  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Reset your Password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
    });
  } catch (error) {
    console.error("Error sending password reset email!", error);
    throw new Error(`error sending password reset email:${error}`);
  }
};

export const sendResetSuccessMail = async (email) => {
  const recipient = [{ email }];

  try {
    const response = await mailtrapClient.send({
      from: sender,
      to: recipient,
      subject: "Password reset successfully!",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password reset",
    });

    console.log("password reset email send successfully!");
  } catch (error) {
    console.log("Error sending password reset success mail", error);
    throw new Error(`Error sending in password reset success mail:${error}`);
  }
};
