import sendEmail from './sendEmail.js';
import {
  buildPaymentConfirmationEmail,
  buildMerchantPaymentNotificationEmail
} from './emailTemplate.js';
import User from '../models/User.js';
import Organization from '../models/Organization.js';
import Plan from '../models/Plan.js';

interface SendPaymentEmailOptions {
  paymentId: string;
  amountInPaise: number;
  currency: string;
  planCode: string;
  billingCycle: 'monthly' | 'yearly';
  customerEmail?: string;
  orgId: string;
}

export const sendPaymentConfirmationEmails = async (options: SendPaymentEmailOptions): Promise<void> => {
  try {
    const {
      paymentId,
      amountInPaise,
      currency,
      planCode,
      billingCycle,
      customerEmail,
      orgId
    } = options;

    const formattedAmount = (amountInPaise / 100).toFixed(2);
    const currencySymbol = currency === 'INR' ? '₹' : `${currency} `;
    const displayAmount = `${currencySymbol}${formattedAmount}`;

    // Fetch organization and its owner
    const org = await Organization.findById(orgId).populate('owner');
    if (!org) {
      console.error(`[PaymentEmail] Organization not found: ${orgId}`);
      return;
    }

    const ownerUser = org.owner as any;
    const finalCustomerEmail = customerEmail || ownerUser?.email;
    if (!finalCustomerEmail) {
      console.error(`[PaymentEmail] No customer email resolved for organization: ${org.name} (${orgId})`);
      return;
    }

    // Resolve plan name
    const uppercaseCode = planCode.trim().toUpperCase();
    const plan = await Plan.findOne({ code: uppercaseCode });
    const planName = plan ? plan.name : planCode;

    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // 1. Send receipt/confirmation to customer
    const customerReceipt = buildPaymentConfirmationEmail({
      planName,
      amount: displayAmount,
      billingCycle,
      paymentId,
      orgName: org.name,
      date: dateStr
    });

    await sendEmail({
      email: finalCustomerEmail,
      subject: `Payment Receipt: Subscription Activated for ${org.name}`,
      message: customerReceipt.message,
      html: customerReceipt.html
    });

    // 2. Send notification alert to merchant/admin
    const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@taskbridge.io';
    const adminNotification = buildMerchantPaymentNotificationEmail({
      orgName: org.name,
      customerEmail: finalCustomerEmail,
      planName,
      amount: displayAmount,
      billingCycle,
      paymentId,
      date: dateStr
    });

    await sendEmail({
      email: adminEmail,
      subject: `[TaskBridge Admin] New Payment Received: ${displayAmount} from ${org.name}`,
      message: adminNotification.message,
      html: adminNotification.html
    });

    console.log(`[PaymentEmail] Confirmation emails successfully sent to customer (${finalCustomerEmail}) and admin (${adminEmail}) for payment ${paymentId}`);
  } catch (error) {
    console.error('[PaymentEmail] Error in sendPaymentConfirmationEmails:', error);
  }
};
