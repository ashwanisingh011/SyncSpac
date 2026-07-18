import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Plan from '../models/Plan.js';
import logger from '../config/logger.js';
import Organization from '../models/Organization.js';
import OrganizationMember from '../models/OrganizationMember.js';
import axios from 'axios';
import { getOrgSubscriptionStatus, sendLimitExceededEmail } from '../utils/subscription.js';
import { sendPaymentConfirmationEmails } from '../utils/paymentEmails.js';
import crypto from 'crypto';


// Default plans to seed if collection is empty
const DEFAULT_PLANS = [
  {
    name: 'Free',
    code: 'FREE',
    description: 'For individuals and small teams getting started.',
    billingCycle: 'monthly' as const,
    price: 0,
    currency: 'INR',
    status: 'active' as const,
    badge: '',
    features: [
      { label: 'Up to 5 members', included: true },
      { label: '3 projects', included: true },
      { label: 'Basic issue tracking', included: true },
      { label: '2 GB storage', included: true },
      { label: 'Custom roles', included: false },
      { label: 'Advanced analytics', included: false },
      { label: 'Priority support', included: false },
    ],
    limits: {
      users: 5,
      projects: 3,
      storage: 2,
      apiCalls: 10000,
    },
  },
  {
    name: 'Pro',
    code: 'PRO',
    description: 'For growing teams that need more power and flexibility.',
    billingCycle: 'monthly' as const,
    price: 600, // INR
    currency: 'INR',
    status: 'active' as const,
    badge: 'Most popular',
    features: [
      { label: 'Unlimited members', included: true },
      { label: 'Unlimited projects', included: true },
      { label: 'Full issue tracking', included: true },
      { label: '50 GB storage', included: true },
      { label: 'Custom roles', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: false },
    ],
    limits: {
      users: -1,
      projects: -1,
      storage: 50,
      apiCalls: -1,
    },
  },
  {
    name: 'Business',
    code: 'BUSINESS',
    description: 'For organizations that need enterprise-grade features.',
    billingCycle: 'monthly' as const,
    price: 1200, // INR
    currency: 'INR',
    status: 'active' as const,
    badge: '',
    features: [
      { label: 'Unlimited members', included: true },
      { label: 'Unlimited projects', included: true },
      { label: 'Full issue tracking', included: true },
      { label: '500 GB storage', included: true },
      { label: 'Custom roles', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: true },
    ],
    limits: {
      users: -1,
      projects: -1,
      storage: 500,
      apiCalls: -1,
    },
  },
  {
    name: 'Go Unlimited',
    code: 'UNLIMITED',
    description: 'Yearly subscription to Go Unlimited plan',
    billingCycle: 'yearly' as const,
    price: 14672.44, // INR
    currency: 'INR',
    status: 'active' as const,
    badge: 'Special offer',
    features: [
      { label: 'Unlimited members', included: true },
      { label: 'Unlimited projects', included: true },
      { label: 'Full issue tracking', included: true },
      { label: '5 TB storage', included: true },
      { label: 'Custom roles', included: true },
      { label: 'Advanced analytics', included: true },
      { label: 'Priority support', included: true },
    ],
    limits: {
      users: -1,
      projects: -1,
      storage: 5000,
      apiCalls: -1,
    },
  },
];

/**
 * Ensures default plans are seeded if none exist in the database.
 */
const ensureDefaultPlansSeeded = async (): Promise<void> => {
  const count = await Plan.countDocuments();
  if (count === 0) {
    logger.info('No plans found in database. Seeding default plans...');
    await Plan.insertMany(DEFAULT_PLANS);
    logger.info('Seeded default plans successfully.');
  } else {
    // Ensure UNLIMITED plan is seeded even if database count is not 0
    const unlimitedExists = await Plan.findOne({ code: 'UNLIMITED' });
    if (!unlimitedExists) {
      const unlimitedPlan = DEFAULT_PLANS.find(p => p.code === 'UNLIMITED');
      if (unlimitedPlan) {
        await Plan.create(unlimitedPlan);
        logger.info('Seeded UNLIMITED plan successfully.');
      }
    }
  }
};

/**
 * @desc    Get all active plans (Public/Authenticated)
 * @route   GET /api/plans
 * @access  Public
 */
export const getActivePlans = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDefaultPlansSeeded();
    const plans = await Plan.find({ status: 'active' }).sort({ price: 1 });
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    console.error('Error in getActivePlans:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get all plans (Super Admin view)
 * @route   GET /api/admin/plans
 * @access  Private (Super Admin)
 */
export const getPlatformPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureDefaultPlansSeeded();
    const plans = await Plan.find({}).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    console.error('Error in getPlatformPlans:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Create a new custom subscription plan
 * @route   POST /api/admin/plans
 * @access  Private (Super Admin)
 */
export const createPlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      code,
      description,
      billingCycle,
      price,
      currency,
      status,
      badge,
      features,
      limits,
    } = req.body;

    if (!name || !code || !billingCycle || price === undefined) {
      res.status(400).json({
        success: false,
        message: 'Name, code, billing cycle, and price are required.',
      });
      return;
    }

    const uppercaseCode = code.trim().toUpperCase();

    // Check if code is unique
    const existingPlan = await Plan.findOne({ code: uppercaseCode });
    if (existingPlan) {
      res.status(400).json({
        success: false,
        message: `A plan with code "${uppercaseCode}" already exists.`,
      });
      return;
    }

    const newPlan = new Plan({
      name,
      code: uppercaseCode,
      description,
      billingCycle,
      price,
      currency: currency || 'INR',
      status: status || 'active',
      badge,
      features: features || [],
      limits: limits || {
        users: -1,
        projects: -1,
        storage: -1,
        apiCalls: -1,
      },
    });

    await newPlan.save();

    res.status(201).json({
      success: true,
      message: 'Plan created successfully',
      data: newPlan,
    });
  } catch (error: any) {
    console.error('Error in createPlan:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Update an existing plan
 * @route   PUT /api/admin/plans/:code
 * @access  Private (Super Admin)
 */
export const updatePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = String(req.params.code);
    const updateData = req.body;

    const uppercaseCode = code.toUpperCase();
    const plan = await Plan.findOne({ code: uppercaseCode });

    if (!plan) {
      res.status(404).json({
        success: false,
        message: `Plan with code "${uppercaseCode}" not found.`,
      });
      return;
    }

    // Update fields
    if (updateData.name !== undefined) plan.name = updateData.name;
    if (updateData.description !== undefined) plan.description = updateData.description;
    if (updateData.billingCycle !== undefined) plan.billingCycle = updateData.billingCycle;
    if (updateData.price !== undefined) plan.price = updateData.price;
    if (updateData.currency !== undefined) plan.currency = updateData.currency;
    if (updateData.status !== undefined) plan.status = updateData.status;
    if (updateData.badge !== undefined) plan.badge = updateData.badge;
    if (updateData.features !== undefined) plan.features = updateData.features;
    if (updateData.limits !== undefined) plan.limits = updateData.limits;

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Plan updated successfully',
      data: plan,
    });
  } catch (error: any) {
    console.error('Error in updatePlan:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Delete a plan (soft delete - sets status to inactive)
 * @route   DELETE /api/admin/plans/:code
 * @access  Private (Super Admin)
 */
export const deletePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = String(req.params.code);
    const uppercaseCode = code.toUpperCase();

    const plan = await Plan.findOne({ code: uppercaseCode });
    if (!plan) {
      res.status(404).json({
        success: false,
        message: `Plan with code "${uppercaseCode}" not found.`,
      });
      return;
    }

    if (plan.status === 'inactive') {
      await Plan.deleteOne({ _id: plan._id });
      res.status(200).json({
        success: true,
        message: `Plan "${uppercaseCode}" permanently deleted successfully.`,
        data: null,
      });
      return;
    }

    plan.status = 'inactive';
    await plan.save();

    res.status(200).json({
      success: true,
      message: `Plan "${uppercaseCode}" deactivated successfully.`,
      data: plan,
    });
  } catch (error: any) {
    console.error('Error in deletePlan:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Get dynamic billing info for an organization
 * @route   GET /api/organization/:orgId/billing
 * @access  Private (Authenticated)
 */
export const getWorkspaceBillingInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = String(req.params.orgId);

    let org = null;
    if (orgId === 'ws-1') {
      org = await Organization.findOne({ isDeleted: false });
    } else if (/^[0-9a-fA-F]{24}$/.test(orgId)) {
      org = await Organization.findById(orgId);
    }

    if (!org) {
      res.status(404).json({
        success: false,
        message: 'Organization not found.',
      });
      return;
    }

    await ensureDefaultPlansSeeded();

    const currentPlanCode = (org.plan || 'free').toUpperCase();
    const plan = await Plan.findOne({ code: currentPlanCode });

    const usedSeats = await OrganizationMember.countDocuments({
      organization: org._id,
      status: 'active',
    });

    const maxSeats = plan && plan.limits && plan.limits.users !== -1 ? plan.limits.users : 9999;

    // Dynamic current period end (e.g., 30 days from creation, or dynamically calculated)
    const orgDoc = org as any;
    const currentPeriodEnd = new Date(orgDoc.createdAt ?? Date.now());
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    const subStatus = await getOrgSubscriptionStatus(org._id);

    res.status(200).json({
      success: true,
      data: {
        plan: currentPlanCode.toLowerCase(),
        status: org.subscriptionStatus || 'active',
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        seats: maxSeats,
        usedSeats: usedSeats,
        cardLast4: org.cardLast4 || undefined,
        cardBrand: org.cardBrand || undefined,
        subscriptionStatus: subStatus,
      },
    });

  } catch (error: any) {
    console.error('Error in getWorkspaceBillingInfo:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Change subscription plan for an organization
 * @route   POST /api/organization/:orgId/billing/change-plan
 * @access  Private (Authenticated)
 */
export const changeWorkspacePlan = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = String(req.params.orgId);
    const { plan: targetPlanCode } = req.body;

    if (!targetPlanCode) {
      res.status(400).json({
        success: false,
        message: 'Plan code is required.',
      });
      return;
    }

    let org = null;
    if (orgId === 'ws-1') {
      org = await Organization.findOne({ isDeleted: false });
    } else if (/^[0-9a-fA-F]{24}$/.test(orgId)) {
      org = await Organization.findById(orgId);
    }

    if (!org) {
      res.status(404).json({
        success: false,
        message: 'Organization not found.',
      });
      return;
    }

    const uppercaseCode = targetPlanCode.trim().toUpperCase();
    const plan = await Plan.findOne({ code: uppercaseCode, status: 'active' });

    if (!plan) {
      res.status(400).json({
        success: false,
        message: `Plan "${uppercaseCode}" is not active or does not exist.`,
      });
      return;
    }

    org.plan = uppercaseCode.toLowerCase();
    org.subscriptionStatus = 'active';
    await org.save();

    // Check if new plan has exceeded limits and trigger notification
    const subStatus = await getOrgSubscriptionStatus(org._id);
    if (subStatus.anyExceeded) {
      if (subStatus.exceeded.users) {
        sendLimitExceededEmail(org._id, 'Users/Members', `${subStatus.usage.users}`, `${subStatus.limits.users}`);
      }
      if (subStatus.exceeded.projects) {
        sendLimitExceededEmail(org._id, 'Projects', `${subStatus.usage.projects}`, `${subStatus.limits.projects}`);
      }
      if (subStatus.exceeded.storage) {
        sendLimitExceededEmail(org._id, 'Storage', `${subStatus.usage.storageGB.toFixed(4)} GB`, `${subStatus.limits.storage} GB`);
      }
      if (subStatus.exceeded.customRoles) {
        sendLimitExceededEmail(org._id, 'Custom Roles', `${subStatus.usage.customRoles}`, '0');
      }
    }

    const usedSeats = await OrganizationMember.countDocuments({
      organization: org._id,
      status: 'active',
    });

    const maxSeats = plan.limits && plan.limits.users !== -1 ? plan.limits.users : 9999;
    const orgDoc2 = org as any;
    const currentPeriodEnd = new Date(orgDoc2.updatedAt ?? Date.now());
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

    res.status(200).json({
      success: true,
      message: `Plan updated to ${plan.name} successfully`,
      data: {
        plan: org.plan,
        status: org.subscriptionStatus,
        currentPeriodEnd: currentPeriodEnd.toISOString(),
        seats: maxSeats,
        usedSeats: usedSeats,
        cardLast4: undefined,
        cardBrand: undefined,
        subscriptionStatus: subStatus,
      },
    });

  } catch (error: any) {
    console.error('Error in changeWorkspacePlan:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * @desc    Process simulated payment and subscribe organization to a plan
 * @route   POST /api/organization/:orgId/billing/checkout
 * @access  Private (Authenticated)
 */
export const processWorkspaceCheckout = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = String(req.params.orgId);
    const {
      planCode,
      billingCycle,
      email,
      paymentMethod,
      cardholderName,
      razorpayPaymentId,
      razorpayOrderId,
      razorpaySignature,
    } = req.body;

    if (!planCode || !email) {
      res.status(400).json({
        success: false,
        message: 'Missing required checkout details.',
      });
      return;
    }

    if (paymentMethod === 'razorpay' && !razorpayPaymentId) {
      res.status(400).json({
        success: false,
        message: 'Missing Razorpay payment ID.',
      });
      return;
    }

    let org = null;
    if (orgId === 'ws-1') {
      org = await Organization.findOne({ isDeleted: false });
    } else if (/^[0-9a-fA-F]{24}$/.test(orgId)) {
      org = await Organization.findById(orgId);
    }

    if (!org) {
      res.status(404).json({
        success: false,
        message: 'Organization not found.',
      });
      return;
    }

    // Idempotency Check for Razorpay
    if (paymentMethod === 'razorpay' && razorpayPaymentId) {
      if (org.processedPayments && org.processedPayments.includes(razorpayPaymentId)) {
        res.status(200).json({
          success: true,
          message: 'Payment already processed and subscription is active.',
          data: {
            plan: org.plan,
            status: org.subscriptionStatus,
            cardLast4: org.cardLast4,
            cardBrand: org.cardBrand,
            billingCycle: org.billingCycle,
          }
        });
        return;
      }
    }

    // Simulated Stripe Card Validation (only for legacy card payment method)
    if (paymentMethod !== 'razorpay') {
      const { cardNumber } = req.body;
      if (!cardNumber) {
        res.status(400).json({
          success: false,
          message: 'Missing required card details.',
        });
        return;
      }
      const cleanCard = cardNumber.replace(/\s+/g, '');
      if (cleanCard.length < 15 || cleanCard.length > 19 || isNaN(Number(cleanCard))) {
        res.status(400).json({
          success: false,
          message: 'Payment Failed: Invalid card number.',
        });
        return;
      }

      // Decline Simulation: Card ending in 9999 is simulated to decline
      if (cleanCard.endsWith('9999')) {
        res.status(400).json({
          success: false,
          message: 'Payment Failed: Your card was declined. Please try another card.',
        });
        return;
      }

      org.cardLast4 = cleanCard.slice(-4);
      let brand = 'Visa';
      if (cleanCard.startsWith('5')) brand = 'Mastercard';
      else if (cleanCard.startsWith('3')) brand = 'American Express';
      else if (cleanCard.startsWith('6')) brand = 'Discover';
      org.cardBrand = brand;
    } else {
      // Razorpay Payment
      const isMockPayment = razorpayPaymentId.startsWith('pay_mock_');
      if (!isMockPayment && process.env.RAZORPAY_KEY_SECRET) {
        if (!razorpayOrderId || !razorpaySignature) {
          res.status(400).json({
            success: false,
            message: 'Missing Razorpay order ID or signature.',
          });
          return;
        }
        const expectedSignature = crypto
          .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');

        const expectedBuffer = Buffer.from(expectedSignature, 'hex');
        const signatureBuffer = Buffer.from(razorpaySignature, 'hex');
        if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
          res.status(400).json({
            success: false,
            message: 'Payment verification failed: Invalid signature.',
          });
          return;
        }
      }
      org.cardLast4 = razorpayPaymentId.slice(-4) || 'RZPY';
      org.cardBrand = 'Razorpay';
    }

    const uppercaseCode = planCode.trim().toUpperCase();
    const plan = await Plan.findOne({ code: uppercaseCode, status: 'active' });
    if (!plan) {
      res.status(400).json({
        success: false,
        message: `Plan "${planCode}" does not exist.`,
      });
      return;
    }

    // Atomic update to prevent race conditions during concurrent client/webhook checkout
    let finalCardLast4 = org.cardLast4 || '';
    let finalCardBrand = org.cardBrand || '';
    if (paymentMethod === 'razorpay' && razorpayPaymentId) {
      finalCardLast4 = razorpayPaymentId.slice(-4) || 'RZPY';
      finalCardBrand = 'Razorpay';
    }

    const updateQuery: any = {
      $set: {
        plan: planCode.toLowerCase(),
        subscriptionStatus: 'active',
        billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
        cardLast4: finalCardLast4,
        cardBrand: finalCardBrand,
      }
    };

    const condition: any = { _id: org._id };

    if (paymentMethod === 'razorpay' && razorpayPaymentId) {
      condition.processedPayments = { $ne: razorpayPaymentId };
      updateQuery.$push = { processedPayments: razorpayPaymentId };
    }

    const updatedOrg = await Organization.findOneAndUpdate(condition, updateQuery, { new: true });

    if (!updatedOrg) {
      const currentOrg = await Organization.findById(org._id);
      res.status(200).json({
        success: true,
        message: 'Payment already processed concurrently.',
        data: {
          plan: currentOrg?.plan || org.plan,
          status: currentOrg?.subscriptionStatus || org.subscriptionStatus,
          cardLast4: currentOrg?.cardLast4 || org.cardLast4,
          cardBrand: currentOrg?.cardBrand || org.cardBrand,
          billingCycle: currentOrg?.billingCycle || org.billingCycle,
        }
      });
      return;
    }

    const subStatus = await getOrgSubscriptionStatus(updatedOrg._id);
    if (subStatus.anyExceeded) {
      if (subStatus.exceeded.users) {
        sendLimitExceededEmail(updatedOrg._id, 'Users/Members', `${subStatus.usage.users}`, `${subStatus.limits.users}`);
      }
      if (subStatus.exceeded.projects) {
        sendLimitExceededEmail(updatedOrg._id, 'Projects', `${subStatus.usage.projects}`, `${subStatus.limits.projects}`);
      }
      if (subStatus.exceeded.storage) {
        sendLimitExceededEmail(updatedOrg._id, 'Storage', `${subStatus.usage.storageGB.toFixed(4)} GB`, `${subStatus.limits.storage} GB`);
      }
      if (subStatus.exceeded.customRoles) {
        sendLimitExceededEmail(updatedOrg._id, 'Custom Roles', `${subStatus.usage.customRoles}`, '0');
      }
    }

    // Send payment confirmation emails for Razorpay
    if (paymentMethod === 'razorpay' && razorpayPaymentId) {
      let amountInPaise = plan.price * 100;
      let currency = 'INR';
      const isMockPayment = razorpayPaymentId.startsWith('pay_mock_');
      if (!isMockPayment && process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID) {
        try {
          const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
          const response = await axios.get(`https://api.razorpay.com/v1/payments/${razorpayPaymentId}`, {
            headers: { Authorization: `Basic ${auth}` }
          });
          if (response.data && response.data.amount) {
            amountInPaise = response.data.amount;
            currency = response.data.currency || 'INR';
          }
        } catch (err: any) {
          console.error('[BillingController] Failed to fetch payment details from Razorpay, falling back to plan pricing:', err.message);
        }
      }
      
      await sendPaymentConfirmationEmails({
        paymentId: razorpayPaymentId,
        amountInPaise,
        currency,
        planCode,
        billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
        customerEmail: email,
        orgId: String(updatedOrg._id)
      });
    }

    res.status(200).json({
      success: true,
      message: 'Payment processed and subscription activated successfully.',
      data: {
        plan: updatedOrg.plan,
        status: updatedOrg.subscriptionStatus,
        cardLast4: updatedOrg.cardLast4,
        cardBrand: updatedOrg.cardBrand,
        billingCycle: updatedOrg.billingCycle,
        subscriptionStatus: subStatus,
      }
    });

  } catch (error: any) {
    console.error('Error in processWorkspaceCheckout:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const createWorkspaceBillingOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orgId = String(req.params.orgId);
    const { planCode, billingCycle, promoCode } = req.body;

    let org = await Organization.findById(orgId);
    if (!org && orgId === 'ws-1') {
      org = await Organization.findOne({ isDeleted: false });
    }

    if (!org) {
      res.status(404).json({ success: false, message: 'Organization not found.' });
      return;
    }

    if (!planCode) {
      res.status(400).json({ success: false, message: 'Plan code is required.' });
      return;
    }

    const uppercaseCode = planCode.trim().toUpperCase();
    const plan = await Plan.findOne({ code: uppercaseCode, status: 'active' });
    if (!plan) {
      res.status(400).json({ success: false, message: `Plan "${planCode}" is not active or does not exist.` });
      return;
    }

    // Resolve base price dynamically from Mongoose Plan document
    const priceINR = plan.price;

    // Secure server-side validation of discount code (Price Tampering vulnerability fix)
    let discountPercent = 0;
    if (promoCode && promoCode.trim().toUpperCase() === 'WELCOME20') {
      discountPercent = 20;
    }

    const discountAmount = priceINR * (discountPercent / 100);
    const finalAmountINR = priceINR - discountAmount;

    // Razorpay amount must be in paise (e.g. ₹100 is 10000 paise)
    const amountInPaise = Math.round(finalAmountINR * 100);

    const isMockMode = !process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock');

    if (isMockMode) {
      res.status(200).json({
        success: true,
        orderId: `order_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`,
        amount: amountInPaise,
      });
      return;
    }

    // Call Razorpay API to create an order
    const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
    
    // Resolve organization ID string cleanly for receipt name
    const orgStrId = String(org._id);
    const response = await axios.post(
      'https://api.razorpay.com/v1/orders',
      {
        amount: amountInPaise,
        currency: 'INR',
        receipt: `receipt_${orgStrId.substring(0, 10)}_${Date.now()}`,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
      }
    );

    res.status(200).json({
      success: true,
      orderId: response.data.id,
      amount: response.data.amount,
    });
  } catch (error: any) {
    logger.error(`Error in createWorkspaceBillingOrder: ${error.response?.data || error.message}`);
    res.status(500).json({ success: false, message: 'Failed to create Razorpay billing order.' });
  }
};

export const handleRazorpayWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      res.status(400).json({ success: false, message: 'Missing webhook signature or secret.' });
      return;
    }

    const crypto = await import('crypto');
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      res.status(400).json({ success: false, message: 'Raw body missing.' });
      return;
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)) {
      res.status(400).json({ success: false, message: 'Invalid webhook signature.' });
      return;
    }

    const event = req.body.event;
    const payload = req.body.payload;


    if (event === 'order.paid' || event === 'payment.captured') {
      const paymentEntity = payload?.payment?.entity;
      if (!paymentEntity) {
        console.error('Webhook Error: Invalid payload structure.', payload);
        res.status(400).json({ success: false, message: 'Invalid payload structure.' });
        return;
      }

      const paymentId = paymentEntity.id;
      const notes = paymentEntity.notes || {};
      const planCode = notes.planCode || 'PRO';
      const billingCycle = notes.billingCycle || 'monthly';
      const orgId = notes.orgId;

      if (!orgId) {
        console.error('Webhook Error: Missing orgId in payment notes.', paymentId);
        res.status(200).json({ success: true, message: 'Missing orgId in payment notes.' });
        return;
      }

      let org = null;
      if (orgId === 'ws-1') {
        org = await Organization.findOne({ isDeleted: false });
      } else if (/^[0-9a-fA-F]{24}$/.test(orgId)) {
        org = await Organization.findById(orgId);
      }

      if (!org) {
        console.error('Webhook Error: Organization not found.', orgId);
        res.status(200).json({ success: true, message: 'Organization not found.' });
        return;
      }

      if (org.processedPayments && org.processedPayments.includes(paymentId)) {
        res.status(200).json({ success: true, message: 'Payment already processed.' });
        return;
      }

      const uppercaseCode = planCode.trim().toUpperCase();
      const plan = await Plan.findOne({ code: uppercaseCode, status: 'active' });
      if (!plan) {
        console.error('Webhook Error: Plan not active or doesn\'t exist.', planCode);
        res.status(200).json({ success: true, message: 'Plan not found.' });
        return;
      }

      // Atomic update to guarantee idempotency and avoid race conditions
      const updatedOrg = await Organization.findOneAndUpdate(
        {
          _id: org._id,
          processedPayments: { $ne: paymentId }
        },
        {
          $set: {
            plan: planCode.toLowerCase(),
            subscriptionStatus: 'active',
            billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
            cardLast4: paymentId.slice(-4) || 'RZPY',
            cardBrand: 'Razorpay'
          },
          $push: { processedPayments: paymentId }
        },
        { new: true }
      );

      if (!updatedOrg) {
        res.status(200).json({ success: true, message: 'Payment already processed concurrently.' });
        return;
      }

      // Check limits on the upgraded organization and send emails if exceeded
      const subStatus = await getOrgSubscriptionStatus(updatedOrg._id);
      if (subStatus.anyExceeded) {
        if (subStatus.exceeded.users) {
          sendLimitExceededEmail(updatedOrg._id, 'Users/Members', `${subStatus.usage.users}`, `${subStatus.limits.users}`);
        }
        if (subStatus.exceeded.projects) {
          sendLimitExceededEmail(updatedOrg._id, 'Projects', `${subStatus.usage.projects}`, `${subStatus.limits.projects}`);
        }
        if (subStatus.exceeded.storage) {
          sendLimitExceededEmail(updatedOrg._id, 'Storage', `${subStatus.usage.storageGB.toFixed(4)} GB`, `${subStatus.limits.storage} GB`);
        }
        if (subStatus.exceeded.customRoles) {
          sendLimitExceededEmail(updatedOrg._id, 'Custom Roles', `${subStatus.usage.customRoles}`, '0');
        }
      }

      // Send payment confirmation emails
      await sendPaymentConfirmationEmails({
        paymentId,
        amountInPaise: paymentEntity.amount,
        currency: paymentEntity.currency || 'INR',
        planCode,
        billingCycle: billingCycle === 'yearly' ? 'yearly' : 'monthly',
        customerEmail: paymentEntity.email,
        orgId: String(updatedOrg._id)
      });

      console.log(`Webhook Success: Upgraded org ${orgId} to plan ${planCode} (Payment: ${paymentId})`);
    }


    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error in handleRazorpayWebhook:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed.' });
  }
};
