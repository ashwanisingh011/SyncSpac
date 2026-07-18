'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/useAuth';
import { useOrganization } from '@/context/useOrganization';
import { getActivePlans, checkoutPlan, createBillingOrder } from '@/api/workspace';
import { useToast } from '@/context/useToast';
import { ArrowLeft, ShoppingBag, CreditCard, Loader2, AlertCircle, ShieldCheck, Sparkles, User, Mail, Percent } from 'lucide-react';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { currentOrg, refreshOrganizations } = useOrganization();
  const { showToast } = useToast();

  const planCode = (params?.planCode as string || '').toLowerCase();

  // Payment states
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR');
  const [email, setEmail] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [isPromoInputVisible, setIsPromoInputVisible] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0); // Percentage, e.g. 20 for 20%
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [showMockModal, setShowMockModal] = useState(false);

  // Plan Details (Dynamic mapping)
  const [planDetails, setPlanDetails] = useState({
    name: 'Go Unlimited - Yearly',
    code: 'UNLIMITED',
    description: 'Yearly subscription to Go Unlimited plan',
    billingCycle: 'yearly' as 'monthly' | 'yearly',
    priceINR: 14672.44,
  });

  // Pre-fill user information
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
    }
    if (user?.name) {
      setCardholderName(user.name);
    } else if (user?.firstName) {
      setCardholderName(`${user.firstName} ${user.lastName || ''}`.trim());
    }
  }, [user]);

  // Load plans from API to resolve real pricing if Pro/Business is chosen
  useEffect(() => {
    let active = true;
    const fetchPlanInfo = async () => {
      try {
        const activePlans = await getActivePlans();
        if (!active) return;
        
        const matched = activePlans.find(p => p.id === planCode);
        if (matched) {
          setPlanDetails({
            name: matched.name,
            code: (matched.code || matched.id).toUpperCase(),
            description: matched.description || `${matched.name} Subscription`,
            billingCycle: matched.billingCycle || 'monthly',
            priceINR: matched.price,
          });
        } else if (planCode === 'unlimited') {
          setPlanDetails({
            name: 'Go Unlimited - Yearly',
            code: 'UNLIMITED',
            description: 'Yearly subscription to Go Unlimited plan',
            billingCycle: 'yearly',
            priceINR: 14672.44,
          });
        } else {
          // Fallback default
          setPlanDetails({
            name: planCode.toUpperCase() + ' Plan',
            code: planCode.toUpperCase(),
            description: `${planCode.toUpperCase()} Subscription`,
            billingCycle: 'monthly',
            priceINR: planCode === 'business' ? 1200 : 600,
          });
        }
      } catch (err) {
        console.error('Failed to load plan info for checkout:', err);
      }
    };

    fetchPlanInfo();
    return () => {
      active = false;
    };
  }, [planCode]);

  // Load Razorpay SDK Script dynamically
  useEffect(() => {
    if ((window as any).Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    let script = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]') as HTMLScriptElement;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const handleLoad = () => setRazorpayLoaded(true);
    const handleError = () => console.error('Failed to load Razorpay SDK');

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', handleError);

    return () => {
      script.removeEventListener('load', handleLoad);
      script.removeEventListener('error', handleError);
    };
  }, []);

  // Conversion rate configuration
  const usdExchangeRate = 98.4727; // 1 USD = 98.4727 INR (includes 4% fee)
  
  // Calculate pricing
  const basePriceINR = planDetails.priceINR;
  const currentBasePrice = currency === 'INR' 
    ? basePriceINR 
    : basePriceINR / usdExchangeRate;

  // Promo Discount Calculation
  const discountAmount = currentBasePrice * (appliedDiscount / 100);
  const subtotal = currentBasePrice - discountAmount;
  const total = subtotal;

  const discountAmountINR = basePriceINR * (appliedDiscount / 100);
  const totalINR = basePriceINR - discountAmountINR;

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (promoCode.trim().toUpperCase() === 'WELCOME20') {
      setAppliedDiscount(20);
      showToast('20% discount code WELCOME20 applied!', 'success');
      setPaymentError(null);
    } else {
      showToast('Invalid promo code. Try WELCOME20', 'error');
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);

    if (!email) {
      setPaymentError('Email address is required.');
      return;
    }

    if (!cardholderName.trim()) {
      setPaymentError('Billing name is required.');
      return;
    }

    // Check if the Razorpay Key is configured and valid.
    // If not, we trigger the custom sandbox simulated checkout modal.
    const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const isMockMode = !key || key.startsWith('rzp_test_mock') || !/^rzp_(test|live)_[a-zA-Z0-9]{14}$/.test(key);

    if (isMockMode) {
      setIsSubmitting(true);
      setTimeout(() => {
        setShowMockModal(true);
      }, 600);
      return;
    }

    if (!razorpayLoaded && !(window as any).Razorpay) {
      setPaymentError('Payment gateway is loading. Please wait a moment.');
      return;
    }

    setIsSubmitting(true);

    let orderId = '';
    let finalAmount = Math.round(totalINR * 100);

    try {
      const orgId = currentOrg?.id;
      if (!orgId) {
        const errMsg = 'No active organization selected for billing.';
        setPaymentError(errMsg);
        showToast(errMsg, 'error');
        setIsSubmitting(false);
        return;
      }
      const orderRes = await createBillingOrder(orgId, {
        planCode: planDetails.code,
        billingCycle: planDetails.billingCycle,
        promoCode: appliedDiscount > 0 ? 'WELCOME20' : undefined,
      });
      orderId = orderRes.orderId;
      finalAmount = orderRes.amount;
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Failed to initialize transaction order.';
      setPaymentError(errMsg);
      showToast(errMsg, 'error');
      setIsSubmitting(false);
      return;
    }

    const options = {
      key: key,
      amount: finalAmount,
      currency: 'INR',
      name: 'TaskBridge',
      description: `Subscribe to ${planDetails.name}`,
      order_id: orderId,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=60',
      handler: async function (response: any) {
        try {
          const orgId = currentOrg?.id || 'ws-1';
          await checkoutPlan(orgId, {
            planCode: planDetails.code,
            billingCycle: planDetails.billingCycle,
            email,
            paymentMethod: 'razorpay',
            cardholderName,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id || orderId,
            razorpaySignature: response.razorpay_signature,
          });

          await refreshOrganizations();
          showToast(`Subscribed to ${planDetails.name} successfully!`, 'success');
          router.push('/dashboard/billing');
        } catch (err: any) {
          const errMsg = err?.response?.data?.message || 'Verification failed. Please contact support.';
          setPaymentError(errMsg);
          showToast(errMsg, 'error');
          setIsSubmitting(false);
        }
      },
      prefill: {
        name: cardholderName,
        email: email,
      },
      notes: {
        planCode: planDetails.code,
        billingCycle: planDetails.billingCycle,
        orgId: currentOrg?.id || 'ws-1',
      },
      theme: {
        color: '#0070f3',
      },
      modal: {
        ondismiss: function () {
          setIsSubmitting(false);
        }
      }
    };

    try {
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Razorpay initialization error:', err);
      setPaymentError('Failed to initialize Razorpay checkout popup. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Mock Sandbox Actions
  const handleMockSuccess = async () => {
    try {
      const orgId = currentOrg?.id || 'ws-1';
      const mockPayId = `pay_mock_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
      
      await checkoutPlan(orgId, {
        planCode: planDetails.code,
        billingCycle: planDetails.billingCycle,
        email,
        paymentMethod: 'razorpay',
        cardholderName,
        razorpayPaymentId: mockPayId,
      });

      await refreshOrganizations();
      showToast(`Subscribed to ${planDetails.name} successfully! (Sandbox)`, 'success');
      setShowMockModal(false);
      setIsSubmitting(false);
      router.push('/dashboard/billing');
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Sandbox verification failed.';
      setPaymentError(errMsg);
      showToast(errMsg, 'error');
      setShowMockModal(false);
      setIsSubmitting(false);
    }
  };

  const handleMockFailure = () => {
    setShowMockModal(false);
    setIsSubmitting(false);
    setPaymentError('Payment Failed: The simulated transaction was declined.');
    showToast('Payment declined (Sandbox)', 'error');
  };

  // Helper formatter
  const formatCurrency = (val: number) => {
    if (currency === 'INR') {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(val);
    }
  };

  return (
    <div className="w-full flex-1 min-h-screen flex items-center justify-center bg-transparent p-4 md:p-8 relative font-sans overflow-y-auto">
      {/* Subtle background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/5 dark:bg-blue-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none"></div>

      {/* Main Checkout Modal Card */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-slate-200/50 dark:border-slate-800 min-h-[500px] shrink-0 z-10">
        
        {/* Left Panel: Checkout Summary */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between border-r border-slate-100 dark:border-slate-800 bg-[#f8fafc]/50 dark:bg-slate-900/10">
          <div className="space-y-6">
            {/* Back Navigation */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Billing
            </button>

            {/* Org details */}
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 rounded-lg dark:bg-slate-800">
                <ShoppingBag className="h-4 w-4 text-slate-600 dark:text-slate-350" />
              </div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-350">
                {currentOrg?.name || 'TaskBridge Workspace'}
              </span>
            </div>

            {/* Subscribe Details */}
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Upgrade Account
              </span>
              <h1 className="text-xl font-extrabold text-slate-800 dark:text-slate-250">{planDetails.name}</h1>
              <div className="mt-2 flex flex-col lg:flex-row lg:items-baseline gap-2">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(total)}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-450">
                  per {planDetails.billingCycle === 'yearly' ? 'year' : 'month'}
                </span>
              </div>
            </div>

            {/* Currency Toggle */}
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl w-fit dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setCurrency('INR')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currency === 'INR'
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                🇮🇳 INR
              </button>
              <button
                type="button"
                onClick={() => setCurrency('USD')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  currency === 'USD'
                    ? 'bg-white text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                🇺🇸 USD
              </button>
            </div>

            {/* conversion footnote */}
            {currency === 'INR' && (
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed max-w-sm">
                Charges will be processed in INR. Default exchange guarantees apply.
              </p>
            )}

            {currency === 'USD' && (
              <div className="space-y-1.5 max-w-sm text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
                <p>
                  1 USD = {usdExchangeRate} INR (includes 4% conversion fee). Charges will vary based on exchange rate.
                </p>
                <div className="flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100/50 text-[10px] text-blue-800 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-300">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    This rate includes a 4% fee to guarantee the exchange rate during checkout.
                  </span>
                </div>
              </div>
            )}

            <hr className="border-slate-100 dark:border-slate-800" />

            {/* Details Breakdown */}
            <div className="space-y-3">
              <div className="flex justify-between items-start text-xs">
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{planDetails.name}</p>
                  <p className="text-slate-400 mt-0.5 text-[11px] leading-normal">{planDetails.description}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Billed {planDetails.billingCycle}ly</p>
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatCurrency(currentBasePrice)}
                </span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between items-center text-xs text-green-600 font-medium">
                  <span>Discount (WELCOME20 -20%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 font-medium">Subtotal</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(subtotal)}</span>
              </div>

              {/* Promo code actions */}
              {!isPromoInputVisible && appliedDiscount === 0 && (
                <button
                  type="button"
                  onClick={() => setIsPromoInputVisible(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 mt-1"
                >
                  Add promotion code
                </button>
              )}

              {isPromoInputVisible && appliedDiscount === 0 && (
                <form onSubmit={handleApplyPromo} className="flex gap-2 max-w-xs pt-1">
                  <input
                    type="text"
                    placeholder="e.g. WELCOME20"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold dark:bg-slate-700 dark:hover:bg-slate-600"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Total due today */}
          <div className="flex justify-between items-center text-sm pt-5 mt-6 border-t border-slate-200 dark:border-slate-800">
            <span className="font-bold text-slate-800 dark:text-slate-350">Total due today</span>
            <span className="text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Right Panel: Payment Inputs */}
        <div className="w-full md:w-1/2 p-8 md:p-12 bg-white dark:bg-slate-950 flex flex-col justify-center">
          <div className="w-full space-y-6">
            
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-500" /> Upgrade Checkout
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">Confirm your billing details below to proceed to checkout.</p>
            </div>

            {/* Test/Sandbox mode banner */}
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 text-[11px] text-amber-800 space-y-2 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-300">
              <div className="flex items-center gap-2 font-bold text-[9px] text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Secure Test Mode
              </div>
              <p className="leading-relaxed text-slate-600 dark:text-slate-400">
                You can complete your checkout simulation using the local sandbox popup when key credentials are not defined.
              </p>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="space-y-5">
              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">Billing details</h3>
                
                <div className="space-y-3.5">
                  <div>
                    <label htmlFor="cardholderName" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Billing Name</label>
                    <input
                      type="text"
                      id="cardholderName"
                      placeholder="Full Name"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Redirect description alert */}
              <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                <CreditCard className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-semibold text-slate-700 dark:text-slate-350">Secure Checkout Page</p>
                  <p className="leading-relaxed text-[11px]">
                    UPI, Cards, Wallets, and NetBanking are accepted. Click below to continue your secure transaction using the official Razorpay popup.
                  </p>
                  {currency === 'USD' && (
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold pt-0.5">
                      * Payment processes in INR: ₹{new Intl.NumberFormat('en-IN').format(totalINR)}.
                    </p>
                  )}
                </div>
              </div>

              {/* Error Notification */}
              {paymentError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Continue to Payment'
                )}
              </button>
            </form>

            {/* Footer Disclaimer */}
            <div className="text-[10px] text-slate-450 dark:text-slate-500 leading-relaxed text-center space-y-2 pt-4 w-full border-t border-slate-100 dark:border-slate-800">
              <p>
                By proceeding, you authorize {currentOrg?.name || 'TaskBridge'} to manage your subscription billing.
              </p>
              <p className="flex justify-center items-center gap-1 font-semibold">
                Powered by <span className="font-extrabold text-[#002e6e] dark:text-[#2b72ce]">Razorpay</span>
                <span>•</span>
                <a href="#" className="hover:underline">Terms</a>
                <span>•</span>
                <a href="#" className="hover:underline">Privacy</a>
              </p>
            </div>

          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* SIMULATED RAZORPAY SANDBOX CHECKOUT POPUP MODAL                       */}
      {/* ===================================================================== */}
      {showMockModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800/80 animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative">
              <div className="absolute top-4 right-4 bg-white/20 px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider">
                Sandbox Mode
              </div>
              <h4 className="text-xs font-bold text-blue-200 uppercase tracking-widest">TaskBridge Payment</h4>
              <h3 className="text-xl font-extrabold mt-1 tracking-tight">{planDetails.name}</h3>
              
              <div className="mt-4 inline-block bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md">
                <span className="text-[10px] text-blue-250 font-bold block leading-none">AMOUNT DUE</span>
                <span className="text-lg font-black block mt-0.5">₹{new Intl.NumberFormat('en-IN').format(totalINR)}</span>
              </div>
            </div>

            {/* Sandbox details */}
            <div className="p-6 space-y-6 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                This is a simulated Razorpay Checkout overlay. Choose one of the choices below to test the transaction result.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleMockSuccess}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1.5 text-xs"
                >
                  <ShieldCheck className="w-4 h-4" /> Simulate Success Payment
                </button>
                
                <button
                  type="button"
                  onClick={handleMockFailure}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-1.5 text-xs"
                >
                  <AlertCircle className="w-4 h-4" /> Simulate Declined Payment
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowMockModal(false);
                  setIsSubmitting(false);
                }}
                className="w-full py-2 text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-slate-350 text-xs font-bold text-center transition-colors block mt-2"
              >
                Cancel Sandbox Simulation
              </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-t border-slate-100 dark:border-slate-850 text-center flex items-center justify-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              Secured Checkout Simulation via Razorpay
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
