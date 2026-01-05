import React, { useState } from 'react';
import { ArrowLeft, ShieldCheck, Package, CreditCard, Sparkles, Heart, Copy, Check, MessageCircle, Tag, XCircle, CheckCircle, Upload, X, FileImage, Loader2 } from 'lucide-react';
import type { CartItem } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useShippingLocations } from '../hooks/useShippingLocations';
import { supabase } from '../lib/supabase';
import { useImageUpload } from '../hooks/useImageUpload';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { paymentMethods } = usePaymentMethods();
  const { locations: shippingLocations, getShippingFee } = useShippingLocations();
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');

  // Customer Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Shipping Details
  const [address, setAddress] = useState('');
  const [barangay, setBarangay] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [shippingLocation, setShippingLocation] = useState<'LUZON' | 'VISAYAS' | 'MINDANAO' | 'MAXIM' | ''>('');

  // Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [contactMethod, setContactMethod] = useState<'messenger' | ''>('messenger');
  const [notes, setNotes] = useState('');

  const [orderMessage, setOrderMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [contactOpened, setContactOpened] = useState(false);

  // Payment Proof
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const { uploadImage, uploading: isUploadingProof } = useImageUpload('payment-proofs'); // Use the new bucket

  // Promo Code State
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [promoSuccess, setPromoSuccess] = useState('');

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  React.useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  // Calculate shipping fee based on location (uses dynamic fees from database)
  const shippingFee = shippingLocation ? getShippingFee(shippingLocation) : 0;

  // Calculate final total (Subtotal + Shipping - Discount)
  const finalTotal = Math.max(0, totalPrice + shippingFee - discountAmount);

  // Handle Promo Code Application
  const handleApplyPromoCode = async () => {
    setPromoError('');
    setPromoSuccess('');
    setAppliedPromo(null);
    setDiscountAmount(0);

    const code = promoCode.trim().toUpperCase();
    if (!code) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsApplyingPromo(true);

    try {
      const { data: promo, error } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('code', code)
        .eq('active', true)
        .single();

      if (error || !promo) {
        setPromoError('Invalid or inactive promo code');
        setIsApplyingPromo(false);
        return;
      }

      // Check date validity
      const now = new Date();
      if (promo.start_date && new Date(promo.start_date) > now) {
        setPromoError('Promo code is not yet valid');
        setIsApplyingPromo(false);
        return;
      }
      if (promo.end_date && new Date(promo.end_date) < now) {
        setPromoError('Promo code has expired');
        setIsApplyingPromo(false);
        return;
      }

      // Check usage limits
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) {
        setPromoError('Promo code usage limit reached');
        setIsApplyingPromo(false);
        return;
      }

      // Check minimum purchase
      if (totalPrice < promo.min_purchase_amount) {
        setPromoError(`Minimum purchase of ₱${promo.min_purchase_amount} required`);
        setIsApplyingPromo(false);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (promo.discount_type === 'percentage') {
        discount = (totalPrice * promo.discount_value) / 100;
        if (promo.max_discount_amount) {
          discount = Math.min(discount, promo.max_discount_amount);
        }
      } else {
        discount = promo.discount_value;
      }

      // Ensure discount doesn't exceed total (excluding shipping usually, ensuring not negative)
      // Here we allow discount to cover shipping too? Usually not, but finalTotal math handles it.
      // Ideally discount applies to subtotal.
      discount = Math.min(discount, totalPrice);

      setDiscountAmount(discount);
      setAppliedPromo(promo);
      setPromoSuccess(`Promo code applied! You saved ₱${discount.toLocaleString()}`);
    } catch (err) {
      console.error('Error applying promo:', err);
      setPromoError('Failed to apply promo code');
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const isDetailsValid =
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    address.trim() !== '' &&
    barangay.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    zipCode.trim() !== '' &&
    shippingLocation !== '';

  const handleProceedToPayment = () => {
    if (isDetailsValid) {
      setStep('payment');
    }
  };


  const handlePlaceOrder = async () => {
    if (!contactMethod) {
      alert('Please select your preferred contact method (Messenger).');
      return;
    }

    if (!shippingLocation) {
      alert('Please select your shipping location.');
      return;
    }

    if (!paymentProof) {
      alert('Please upload a screenshot of your payment proof to proceed.');
      return;
    }

    const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);

    try {
      // 1. Upload Payment Proof First
      let paymentProofUrl = null;
      if (paymentProof) {
        try {
          paymentProofUrl = await uploadImage(paymentProof);
        } catch (uploadError: any) {
          console.error('Failed to upload payment proof:', uploadError);
          alert(`Failed to upload payment proof: ${uploadError.message}`);
          return;
        }
      }

      // Prepare order items for database
      const orderItems = cartItems.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        variation_id: item.variation?.id || null,
        variation_name: item.variation?.name || null,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
        purity_percentage: item.product.purity_percentage
      }));

      // Save order to database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: fullName,
          customer_email: email,
          customer_phone: phone,
          shipping_address: address,
          shipping_barangay: barangay,
          shipping_city: city,
          shipping_state: state,
          shipping_zip_code: zipCode,
          order_items: orderItems,
          total_price: Math.max(0, totalPrice - discountAmount), // Store subtotal minus discount (not including shipping)
          shipping_fee: shippingFee,
          shipping_location: shippingLocation,
          payment_method_id: paymentMethod?.id || null,
          payment_method_name: paymentMethod?.name || null,
          payment_proof_url: paymentProofUrl,
          contact_method: contactMethod || null,
          notes: notes.trim() || null,
          order_status: 'new',
          payment_status: 'pending',
          promo_code_id: appliedPromo?.id || null,
          promo_code: appliedPromo?.code || null,
          discount_applied: discountAmount
        }])
        .select()
        .single();

      if (orderError) {
        console.error('❌ Error saving order:', orderError);

        // Provide helpful error message if table doesn't exist
        let errorMessage = orderError.message;
        if (orderError.message?.includes('Could not find the table') ||
          orderError.message?.includes('relation "public.orders" does not exist') ||
          orderError.message?.includes('schema cache')) {
          errorMessage = `The orders table doesn't exist in the database. Please run the migration: supabase/migrations/20250117000000_ensure_orders_table.sql in your Supabase SQL Editor.`;
        }

        alert(`Failed to save order: ${errorMessage}\n\nPlease contact support if this issue persists.`);
        return;
      }

      // Update promo code usage count
      if (appliedPromo) {
        const { error: promoUpdateError } = await supabase
          .from('promo_codes')
          .update({ usage_count: appliedPromo.usage_count + 1 })
          .eq('id', appliedPromo.id);

        if (promoUpdateError) {
          console.error('Failed to update promo usage count:', promoUpdateError);
        }
      }

      console.log('✅ Order saved to database:', orderData);

      // Get current date and time
      const now = new Date();
      const dateTimeStamp = now.toLocaleString('en-PH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });

      const orderDetails = `
✨SlimDose Peptides - NEW ORDER

📅 ORDER DATE & TIME
${dateTimeStamp}

👤 CUSTOMER INFORMATION
Name: ${fullName}
Email: ${email}
Phone: ${phone}

📦 SHIPPING ADDRESS
${address}
${barangay}
${city}, ${state} ${zipCode}

🛒 ORDER DETAILS
${cartItems.map(item => {
        let line = `• ${item.product.name}`;
        if (item.variation) {
          line += ` (${item.variation.name})`;
        }
        line += ` x${item.quantity} - ₱${(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
        if (item.product.purity_percentage && item.product.purity_percentage > 0) {
          line += `\n  Purity: ${item.product.purity_percentage}%`;
        }
        return line;
      }).join('\n\n')}

💰 PRICING
Product Total: ₱${totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
Shipping Fee: ₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })} (${shippingLocation.replace('_', ' & ')})
${discountAmount > 0 ? `Discount (${appliedPromo?.code}): -₱${discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}\n` : ''}Grand Total: ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}

💳 PAYMENT METHOD
${paymentMethod?.name || 'N/A'}
${paymentMethod ? `Account: ${paymentMethod.account_number}` : ''}

📸 PROOF OF PAYMENT
${paymentProofUrl ? 'Screenshot attached to order.' : 'Pending'}

📱 CONTACT METHOD
Messenger: https://www.facebook.com/messages/t/61555961135365

📋 ORDER ID: ${orderData.id}

Please confirm this order. Thank you!
      `.trim();

      // Store order message for copying
      setOrderMessage(orderDetails);

      // Auto-copy to clipboard
      try {
        await navigator.clipboard.writeText(orderDetails);
        setCopied(true);
      } catch (err) {
        console.error('Failed to auto-copy:', err);
      }

      // Open contact method based on selection
      // Using m.me link with Page ID to open Messenger directly
      const contactUrl = contactMethod === 'messenger'
        ? `https://www.facebook.com/messages/t/61555961135365?text=${encodeURIComponent(orderDetails)}`
        : null;

      if (contactUrl) {
        // Short delay to ensure clipboard write finishes and UI updates
        setTimeout(() => {
          try {
            const contactWindow = window.open(contactUrl, '_blank');
            if (!contactWindow || contactWindow.closed || typeof contactWindow.closed === 'undefined') {
              console.warn('⚠️ Popup blocked or contact method failed to open');
              setContactOpened(false);
            } else {
              setContactOpened(true);
            }
          } catch (error) {
            console.error('❌ Error opening contact method:', error);
            setContactOpened(false);
          }
        }, 500);
      }

      // Show confirmation
      setStep('confirmation');
    } catch (error) {
      console.error('❌ Error placing order:', error);
      alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(orderMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = orderMessage;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (err) {
        alert('Failed to copy. Please manually select and copy the message below.');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleOpenContact = () => {
    const contactUrl = contactMethod === 'messenger'
      ? `https://www.facebook.com/messages/t/61555961135365?text=${encodeURIComponent(orderMessage)}`
      : null;

    if (contactUrl) {
      window.open(contactUrl, '_blank');
    }
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center border-2 border-navy-700/30">
            <div className="bg-gradient-to-br from-gold-500 to-gold-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce border-2 border-gold-700">
              <ShieldCheck className="w-14 h-14 text-black" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-black to-gray-900 bg-clip-text text-transparent">COMPLETE YOUR ORDER</span>
              <Sparkles className="w-7 h-7 text-gold-600" />
            </h1>
            <p className="text-gray-600 mb-8 text-base md:text-lg leading-relaxed">
              Copy the order message below and send it via Messenger along with your payment screenshot.
            </p>

            {/* Order Message Display */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left border-2 border-navy-700/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-navy-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-gold-600" />
                  Your Order Message
                </h3>
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-lg font-medium transition-all text-sm shadow-md hover:shadow-lg border border-navy-900/20"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-300 max-h-64 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">
                  {orderMessage}
                </pre>
              </div>
              {copied && (
                <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Message copied to clipboard! Paste it in Messenger along with your payment screenshot.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleOpenContact}
                className="w-full bg-navy-900 hover:bg-navy-800 text-white py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2 border border-navy-900/20"
              >
                <MessageCircle className="w-5 h-5" />
                Open Messenger
              </button>

              {!contactOpened && (
                <p className="text-sm text-gray-600">
                  💡 If Messenger doesn't open, copy the message above and visit our page manually
                </p>
              )}
            </div>

            <div className="bg-gradient-to-r from-gold-50 to-gold-100/50 rounded-2xl p-6 mb-8 text-left border-2 border-navy-700/30">
              <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
                What Happens Next?
                <Sparkles className="w-5 h-5 text-gold-600" />
              </h3>
              <ul className="space-y-3 text-sm md:text-base text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <span>Send your order details and payment screenshot — we'll confirm within 24 hours or less.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <span>Your products are carefully packed and prepared for shipping.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <span>Payments made before 11 AM are shipped the same day.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <span>Tracking numbers are sent via Messenger from 11 PM onwards.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">5️⃣</span>
                  <span>
                    You can check your order status anytime on our <a href="/track-order" target="_blank" className="text-blue-600 hover:underline font-bold">Track Order page</a> using your Order ID.
                  </span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.location.href = '/';
              }}
              className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-600 hover:to-gold-700 text-black py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2 border-2 border-gold-700"
            >
              <Heart className="w-5 h-5 animate-pulse" />
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white py-6 md:py-8">
        <div className="container mx-auto px-3 md:px-4 max-w-6xl">
          <button
            onClick={onBack}
            className="text-gray-700 hover:text-gold-600 font-medium mb-4 md:mb-6 flex items-center gap-2 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm md:text-base">Back to Cart</span>
          </button>

          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-black to-gray-900 bg-clip-text text-transparent mb-6 md:mb-8 flex items-center gap-2">
            Checkout
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-gold-600" />
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Customer Information */}
              <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
                <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 md:mb-6 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-gold-500 to-gold-600 p-2 rounded-xl">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-black" />
                  </div>
                  Customer Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="input-field"
                      placeholder="Juan Dela Cruz"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                      placeholder="juan@gmail.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                      placeholder="09XX XXX XXXX"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
                <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 md:mb-6 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-gold-500 to-gold-600 p-2 rounded-xl">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-black" />
                  </div>
                  Shipping Address
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="input-field"
                      placeholder="123 Rizal Street"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barangay *
                    </label>
                    <input
                      type="text"
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="input-field"
                      placeholder="Brgy. San Antonio"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="input-field"
                        placeholder="Quezon City"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Province *
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="input-field"
                        placeholder="Metro Manila"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP/Postal Code *
                    </label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="input-field"
                      placeholder="1100"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Location Selection */}
              <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
                <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-2 md:mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-gold-600" />
                  Choose Shipping Location *
                </h2>
                <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                  Shipping rates apply to small pouches (4.1 × 9.5 inches) with a capacity of up to 3 pens. For bulk orders exceeding this size, our team will contact you for the adjusted shipping fees.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {shippingLocations.map((loc) => (
                    <button
                      key={loc.id}
                      onClick={() => setShippingLocation(loc.id as 'LUZON' | 'VISAYAS' | 'MINDANAO' | 'MAXIM')}
                      className={`p-3 rounded-lg border-2 transition-all ${shippingLocation === loc.id
                        ? 'border-navy-900 bg-gold-50'
                        : 'border-gray-200 hover:border-navy-700'
                        }`}
                    >
                      <p className="font-semibold text-navy-900 text-sm">{loc.id.replace('_', ' & ')}</p>
                      <p className="text-xs text-gray-500">₱{loc.fee.toLocaleString()}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all transform shadow-lg ${isDetailsValid
                  ? 'bg-navy-900 hover:bg-navy-800 text-white hover:scale-105 hover:shadow-xl border border-navy-900/20'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                Proceed to Payment ✨
              </button>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-xl p-5 md:p-6 sticky top-24 border-2 border-navy-700/30">
                <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 md:mb-6 flex items-center gap-2">
                  Order Summary
                  <Sparkles className="w-5 h-5 text-gold-600" />
                </h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => {
                    // Determine if this item has a product-level discount
                    const hasVariation = !!item.variation;
                    const originalPrice = hasVariation
                      ? item.variation!.price * item.quantity
                      : item.product.base_price * item.quantity;
                    const currentPrice = item.price * item.quantity;
                    const hasProductDiscount = hasVariation
                      ? (item.variation!.discount_active && item.variation!.discount_price !== null)
                      : (item.product.discount_active && item.product.discount_price !== null);
                    const savedAmount = originalPrice - currentPrice;

                    return (
                      <div key={index} className="pb-4 border-b border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-navy-900 text-sm">{item.product.name}</h4>
                            {item.variation && (
                              <p className="text-xs text-gold-600 mt-1">{item.variation.name}</p>
                            )}
                            {item.product.purity_percentage && item.product.purity_percentage > 0 ? (
                              <p className="text-xs text-gray-500 mt-1">
                                {item.product.purity_percentage}% Purity
                              </p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-navy-900 text-sm">
                              ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                            </span>
                            {hasProductDiscount && savedAmount > 0 && (
                              <div className="flex flex-col items-end">
                                <span className="text-xs text-gray-400 line-through">
                                  ₱{originalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                                </span>
                                <span className="text-xs text-green-600 font-medium">
                                  Save ₱{savedAmount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4 mb-6">
                  {/* Promo Code Input */}
                  <div className="pt-2 pb-4 border-b border-gray-100">
                    <p className="text-sm font-medium text-navy-900 mb-2 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-gold-600" />
                      Have a promo code?
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        placeholder="Enter code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gold-400 focus:border-transparent outline-none uppercase"
                        disabled={!!appliedPromo || isApplyingPromo}
                      />
                      {appliedPromo ? (
                        <button
                          onClick={() => {
                            setAppliedPromo(null);
                            setDiscountAmount(0);
                            setPromoCode('');
                            setPromoSuccess('');
                          }}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      ) : (
                        <button
                          onClick={handleApplyPromoCode}
                          disabled={!promoCode || isApplyingPromo}
                          className="px-4 py-2 bg-navy-900 text-white rounded-lg text-sm font-medium hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {isApplyingPromo ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </button>
                      )}
                    </div>
                    {promoError && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        {promoError}
                      </p>
                    )}
                    {promoSuccess && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        {promoSuccess}
                      </p>
                    )}
                  </div>

                  {/* Subtotal with discount pricing */}
                  {discountAmount > 0 ? (
                    <>
                      {/* Discounted Subtotal Display */}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Subtotal</span>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 line-through text-sm">
                            ₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                          </span>
                          <span className="font-semibold text-green-600">
                            ₱{(totalPrice - discountAmount).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Savings Badge */}
                      <div className="flex justify-between items-center bg-green-50 -mx-6 px-6 py-3 rounded-lg border border-green-100">
                        <span className="flex items-center gap-1.5 text-green-700 font-medium text-sm">
                          <Tag className="w-4 h-4" />
                          Discount ({appliedPromo?.code})
                        </span>
                        <span className="font-bold text-green-700">
                          -₱{discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                        </span>
                      </div>

                      {/* You Saved Message */}
                      <div className="flex justify-center -mx-6 px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 -mt-2">
                        <p className="text-white text-sm font-bold flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" />
                          You saved ₱{discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}!
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span className="font-medium">₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Shipping</span>
                    <span className="font-medium text-gold-600">
                      {shippingLocation ? `₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })}` : 'Select location'}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-navy-900">Total</span>
                      <span className="text-2xl font-bold text-gold-600">
                        ₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                    {!shippingLocation && (
                      <p className="text-xs text-red-500 mt-1 text-right">Please select shipping location</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Payment Step
  const paymentMethodInfo = paymentMethods.find(pm => pm.id === selectedPaymentMethod);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-white py-6 md:py-8">
      <div className="container mx-auto px-3 md:px-4 max-w-6xl">
        <button
          onClick={() => setStep('details')}
          className="text-gray-700 hover:text-gold-600 font-medium mb-4 md:mb-6 flex items-center gap-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm md:text-base">Back to Details</span>
        </button>

        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-black to-gray-900 bg-clip-text text-transparent mb-6 md:mb-8 flex items-center gap-2">
          Payment
          <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-gold-600" />
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Shipping Location Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
              <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-2 md:mb-3 flex items-center gap-2">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-gold-600" />
                Choose Shipping Location *
              </h2>
              <p className="text-xs md:text-sm text-gray-600 mb-4 md:mb-6">
                Shipping rates apply to small pouches (4.1 × 9.5 inches) with a capacity of up to 3 pens. For bulk orders exceeding this size, our team will contact you for the adjusted shipping fees.
              </p>
              <div className="grid grid-cols-1 gap-3">
                {shippingLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setShippingLocation(loc.id as 'LUZON' | 'VISAYAS' | 'MINDANAO' | 'MAXIM')}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${shippingLocation === loc.id
                      ? 'border-navy-900 bg-gold-50'
                      : 'border-gray-200 hover:border-navy-700'
                      }`}
                  >
                    <div className="text-left">
                      <p className="font-semibold text-navy-900">{loc.id.replace('_', ' & ')}</p>
                      <p className="text-sm text-gray-500">₱{loc.fee.toLocaleString()}</p>
                    </div>
                    {shippingLocation === loc.id && (
                      <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
              <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 md:mb-6 flex items-center gap-2">
                <div className="bg-gradient-to-br from-gold-500 to-gold-600 p-2 rounded-xl">
                  <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-black" />
                </div>
                Payment Method
              </h2>

              <div className="grid grid-cols-1 gap-4 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${selectedPaymentMethod === method.id
                      ? 'border-navy-900 bg-gold-50'
                      : 'border-gray-200 hover:border-navy-700'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gold-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-gold-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-navy-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.account_name}</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-6 h-6 bg-gold-600 rounded-full flex items-center justify-center">
                        <span className="text-black text-xs font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {paymentMethodInfo && (
                <div className="bg-gold-50 rounded-lg p-6 border border-navy-600">
                  <h3 className="font-semibold text-navy-900 mb-4">Payment Details</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p><strong>Account Number:</strong> {paymentMethodInfo.account_number}</p>
                    <p><strong>Account Name:</strong> {paymentMethodInfo.account_name}</p>
                    <p><strong>Amount to Pay:</strong> <span className="text-xl font-bold text-gold-600">₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span></p>
                  </div>

                  {paymentMethodInfo.qr_code_url && (
                    <div className="flex justify-center">
                      <div className="bg-white p-4 rounded-lg">
                        <img
                          src={paymentMethodInfo.qr_code_url}
                          alt="Payment QR Code"
                          className="w-48 h-48 object-contain"
                        />
                        <p className="text-xs text-center text-gray-500 mt-2">Scan to pay</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Contact Method Selection */}
            <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
              <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 md:mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-gold-600" />
                Preferred Contact Method *
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setContactMethod('messenger')}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${contactMethod === 'messenger'
                    ? 'border-navy-900 bg-gold-50'
                    : 'border-gray-200 hover:border-navy-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-6 h-6 text-gold-600" />
                    <div className="text-left">
                      <p className="font-semibold text-navy-900">Messenger</p>
                      <p className="text-sm text-gray-500">SlimDose Peptides</p>
                    </div>
                  </div>
                  {contactMethod === 'messenger' && (
                    <div className="w-6 h-6 bg-gold-600 rounded-full flex items-center justify-center">
                      <span className="text-black text-xs font-bold">✓</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Payment Proof Upload */}
            <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
              <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                <FileImage className="w-5 h-5 text-gold-600" />
                Upload Payment Proof *
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Please upload a screenshot of your payment receipt (GCash, Bank Transfer, etc.).
              </p>

              {!paymentProof ? (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-blue-500 mb-2" />
                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> payment screenshot</p>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG or JPEG (MAX. 10MB)</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setPaymentProof(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              ) : (
                <div className="relative bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                    {paymentProof.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(paymentProof)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileImage className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {paymentProof.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    onClick={() => setPaymentProof(null)}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            {/* Additional Notes */}
            <div className="bg-white rounded-2xl shadow-lg p-5 md:p-6 border-2 border-navy-700/30">
              <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 flex items-center gap-2">
                <div className="bg-gradient-to-br from-gold-500 to-gold-600 p-2 rounded-xl">
                  <MessageCircle className="w-5 h-5 text-black" />
                </div>
                Order Notes (Optional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field"
                rows={4}
                placeholder="Any special instructions or notes for your order..."
              />
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={!contactMethod || !shippingLocation || !paymentProof || isUploadingProof}
              className={`w-full py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${contactMethod && shippingLocation && paymentProof && !isUploadingProof
                ? 'bg-navy-900 hover:bg-navy-800 text-white hover:shadow-xl transform hover:scale-105 border border-navy-900/20'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              Complete Order
            </button>
            {isUploadingProof && (
              <div className="mt-2 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading payment proof...
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-5 md:p-6 sticky top-24 border-2 border-navy-700/30">
              <h2 className="text-lg md:text-xl font-bold text-navy-900 mb-4 md:mb-6 flex items-center gap-2">
                Final Summary
                <Sparkles className="w-5 h-5 text-gold-600" />
              </h2>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm">
                <p className="font-semibold text-navy-900 mb-2">{fullName}</p>
                <p className="text-gray-600">{email}</p>
                <p className="text-gray-600">{phone}</p>
                <div className="mt-3 pt-3 border-t border-gray-200 text-gray-600">
                  <p>{address}</p>
                  <p>{barangay}</p>
                  <p>{city}, {state} {zipCode}</p>
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                {cartItems.map((item, index) => {
                  const hasVariation = !!item.variation;
                  const originalPrice = hasVariation
                    ? item.variation!.price * item.quantity
                    : item.product.base_price * item.quantity;
                  const currentPrice = item.price * item.quantity;
                  const hasProductDiscount = hasVariation
                    ? (item.variation!.discount_active && item.variation!.discount_price !== null)
                    : (item.product.discount_active && item.product.discount_price !== null);
                  const savedAmount = originalPrice - currentPrice;

                  return (
                    <div key={index} className="pb-3 border-b border-gray-100 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <p className="font-medium text-navy-900 text-xs">{item.product.name}</p>
                          {item.variation && (
                            <p className="text-xs text-gold-600">{item.variation.name}</p>
                          )}
                          <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-navy-900 text-xs">
                            ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                          </span>
                          {hasProductDiscount && savedAmount > 0 && (
                            <div className="flex flex-col items-end">
                              <span className="text-xs text-gray-400 line-through">
                                ₱{originalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                              </span>
                              <span className="text-xs text-green-600">
                                -₱{savedAmount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                {/* Subtotal with discount pricing */}
                {discountAmount > 0 ? (
                  <>
                    {/* Discounted Subtotal Display */}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Subtotal</span>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 line-through text-sm">
                          ₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                        </span>
                        <span className="font-semibold text-green-600">
                          ₱{(totalPrice - discountAmount).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>

                    {/* Savings Badge */}
                    <div className="flex justify-between items-center bg-green-50 -mx-6 px-6 py-2.5 border-y border-green-100">
                      <span className="flex items-center gap-1 text-green-700 font-medium text-xs">
                        <Tag className="w-3.5 h-3.5" />
                        Saved with {appliedPromo?.code}
                      </span>
                      <span className="font-bold text-green-700 text-sm">
                        -₱{discountAmount.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Shipping</span>
                  <span className="font-medium text-gold-600">
                    {shippingLocation ? `₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })} (${shippingLocation.replace('_', ' & ')})` : 'Select location'}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-navy-900">Total</span>
                    <span className="text-2xl font-bold text-gold-600">
                      ₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                    </span>
                  </div>
                  {!shippingLocation && (
                    <p className="text-xs text-red-500 mt-1 text-right">Please select shipping location</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
