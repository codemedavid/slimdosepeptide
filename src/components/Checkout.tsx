import React, { useState, useRef } from 'react';
import { ArrowLeft, ShieldCheck, Package, CreditCard, Sparkles, Heart, Copy, Check, MessageCircle, Upload, X, Image as ImageIcon, Instagram, Phone } from 'lucide-react';
import type { CartItem } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useImageUpload } from '../hooks/useImageUpload';
import { supabase } from '../lib/supabase';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice, onBack }) => {
  const { paymentMethods } = usePaymentMethods();
  const { uploadImage, uploading: uploadingProof } = useImageUpload('payment-proofs');
  const [step, setStep] = useState<'details' | 'payment' | 'confirmation'>('details');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Customer Details
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Shipping Details
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  const [shippingLocation, setShippingLocation] = useState<'NCR' | 'LUZON' | 'VISAYAS_MINDANAO' | ''>('');
  
  // Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | undefined>(undefined);
  const [contactMethod, setContactMethod] = useState<'instagram' | 'viber' | ''>('');
  const [notes, setNotes] = useState('');
  
  // Order message for copying
  const [orderMessage, setOrderMessage] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [contactOpened, setContactOpened] = useState(false);

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  React.useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPaymentMethod) {
      setSelectedPaymentMethod(paymentMethods[0].id);
    }
  }, [paymentMethods, selectedPaymentMethod]);

  // Calculate shipping fee based on location
  const calculateShippingFee = (): number => {
    if (!shippingLocation) return 0;
    
    // Check if medium box applies (3+ peptide sets)
    const totalPeptideSets = cartItems.reduce((sum, item) => {
      // Count items that are peptide products (not syringes)
      const isPeptide = !item.product.name.toLowerCase().includes('syringe');
      return sum + (isPeptide ? item.quantity : 0);
    }, 0);
    
    if (totalPeptideSets >= 3) {
      return 220; // MEDIUM BOX
    }
    
    switch (shippingLocation) {
      case 'NCR':
        return 160;
      case 'LUZON':
        return 165;
      case 'VISAYAS_MINDANAO':
        return 190;
      default:
        return 0;
    }
  };
  
  const shippingFee = calculateShippingFee();
  const finalTotal = totalPrice + shippingFee;

  const isDetailsValid = 
    fullName.trim() !== '' &&
    email.trim() !== '' &&
    phone.trim() !== '' &&
    address.trim() !== '' &&
    city.trim() !== '' &&
    state.trim() !== '' &&
    zipCode.trim() !== '' &&
    country.trim() !== '' &&
    shippingLocation !== '';

  const handleProceedToPayment = () => {
    if (isDetailsValid) {
      setStep('payment');
    }
  };

  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const imageUrl = await uploadImage(file);
      setPaymentProofUrl(imageUrl);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload proof of payment');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveProof = () => {
    setPaymentProofUrl(undefined);
  };

  const handlePlaceOrder = async () => {
    if (!paymentProofUrl) {
      alert('Please upload proof of payment screenshot before proceeding.');
      return;
    }
    
    if (!contactMethod) {
      alert('Please select your preferred contact method (Instagram or Viber).');
      return;
    }
    
    if (!shippingLocation) {
      alert('Please select your shipping location.');
      return;
    }
    
    const paymentMethod = paymentMethods.find(pm => pm.id === selectedPaymentMethod);
    
    try {
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
          shipping_city: city,
          shipping_state: state,
          shipping_zip_code: zipCode,
          shipping_country: country,
          order_items: orderItems,
          total_price: totalPrice,
          shipping_fee: shippingFee,
          shipping_location: shippingLocation,
          payment_method_id: paymentMethod?.id || null,
          payment_method_name: paymentMethod?.name || null,
          payment_proof_url: paymentProofUrl || null,
          contact_method: contactMethod || null,
          notes: notes.trim() || null,
          order_status: 'new',
          payment_status: 'pending'
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

      console.log('✅ Order saved to database:', orderData);
      console.log('📸 Payment proof URL:', paymentProofUrl); // Debug log

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
      
      // Ensure payment proof URL is available
      const proofUrl = paymentProofUrl || orderData.payment_proof_url || null;
      console.log('🔍 Using payment proof URL:', proofUrl); // Debug log
      
      const orderDetails = `
✨ HP GLOW - NEW ORDER

📅 ORDER DATE & TIME
${dateTimeStamp}

👤 CUSTOMER INFORMATION
Name: ${fullName}
Email: ${email}
Phone: ${phone}

📦 SHIPPING ADDRESS
${address}
${city}, ${state} ${zipCode}
${country}

🛒 ORDER DETAILS
${cartItems.map(item => {
  let line = `• ${item.product.name}`;
  if (item.variation) {
    line += ` (${item.variation.name})`;
  }
  line += ` x${item.quantity} - ₱${(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
  line += `\n  Purity: ${item.product.purity_percentage}%`;
  return line;
}).join('\n\n')}

💰 PRICING
Product Total: ₱${totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
Shipping Fee: ₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })} (${shippingLocation.replace('_', ' & ')})
Grand Total: ₱${finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}

💳 PAYMENT METHOD
${paymentMethod?.name || 'N/A'}
${paymentMethod ? `Account: ${paymentMethod.account_number}` : ''}

📸 PROOF OF PAYMENT
${proofUrl ? `✅ Payment proof has been uploaded and is visible on this page.\nPlease attach the payment proof image when sending this message.` : '❌ Payment proof not provided - Please upload proof before placing order'}

📱 CONTACT METHOD
${contactMethod === 'instagram' ? 'Instagram: https://www.instagram.com/hpglowpeptides' : contactMethod === 'viber' ? 'Viber: 09062349763' : 'Not selected'}

📋 ORDER ID: ${orderData.id}

Please confirm this order. Thank you!
      `.trim();

      // Store order message for copying
      setOrderMessage(orderDetails);

      // Open contact method based on selection
      const contactUrl = contactMethod === 'instagram' 
        ? 'https://www.instagram.com/hpglowpeptides'
        : contactMethod === 'viber'
        ? 'viber://chat?number=09062349763'
        : null;
      
      if (contactUrl) {
        try {
          const contactWindow = window.open(contactUrl, '_blank');
          
          if (!contactWindow || contactWindow.closed || typeof contactWindow.closed === 'undefined') {
            console.warn('⚠️ Popup blocked or contact method failed to open');
            setContactOpened(false);
          } else {
            setContactOpened(true);
            setTimeout(() => {
              if (contactWindow.closed) {
                setContactOpened(false);
              }
            }, 1000);
          }
        } catch (error) {
          console.error('❌ Error opening contact method:', error);
          setContactOpened(false);
        }
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
    const contactUrl = contactMethod === 'instagram' 
      ? 'https://www.instagram.com/hpglowpeptides'
      : contactMethod === 'viber'
      ? 'viber://chat?number=09062349763'
      : null;
    
    if (contactUrl) {
      window.open(contactUrl, '_blank');
    }
  };

  if (step === 'confirmation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 text-center border-2 border-green-100">
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
              <ShieldCheck className="w-14 h-14 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center justify-center gap-2 flex-wrap">
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">Order Sent!</span>
              <Sparkles className="w-7 h-7 text-yellow-500" />
            </h1>
            <p className="text-gray-600 mb-8 text-base md:text-lg leading-relaxed">
              ✅ Your order has been automatically saved to our system!
              {contactOpened ? (
                <>
                  <br />
                  {contactMethod === 'instagram' ? 'Instagram' : 'Viber'} has been opened. 
                  <Heart className="inline w-5 h-5 text-pink-500 mx-1" />
                  Please send the order message to complete your order.
                </>
              ) : (
                <>
                  <br />
                  <span className="text-orange-600 font-semibold">⚠️ Contact method didn't open automatically.</span>
                  <br />
                  Use the buttons below to open {contactMethod === 'instagram' ? 'Instagram' : 'Viber'} or copy the message manually.
                </>
              )}
            </p>

            {/* Payment Proof Image Display */}
            {paymentProofUrl && (
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 mb-6 border-2 border-green-200">
                <div className="mb-4 text-center">
                  <h3 className="font-bold text-gray-900 flex items-center justify-center gap-2 mb-2">
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    Your Payment Proof
                  </h3>
                  <p className="text-sm text-gray-600">
                    📸 Screenshot this image and attach it when sending your order message
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-lg">
                  <img
                    src={paymentProofUrl}
                    alt="Payment Proof - Screenshot this image"
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-md object-contain cursor-pointer hover:opacity-95 transition-opacity"
                    style={{ maxHeight: '600px', minHeight: '300px' }}
                    onError={(e) => {
                      console.error('❌ Error loading payment proof image:', paymentProofUrl);
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.innerHTML = `
                        <div class="p-8 text-center text-red-600">
                          <p class="font-semibold">⚠️ Image failed to load</p>
                          <p class="text-sm mt-2">Please check your internet connection or try uploading again.</p>
                        </div>
                      `;
                    }}
                  />
                </div>
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 text-center">
                    💡 <strong>Tip:</strong> Take a screenshot of the image above, then attach it when sending your order message via {contactMethod === 'instagram' ? 'Instagram' : 'Viber'}.
                  </p>
                </div>
              </div>
            )}

            {/* Order Message Display */}
            <div className="bg-gray-50 rounded-2xl p-6 mb-6 text-left border-2 border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                  Your Order Message
                </h3>
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all text-sm"
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
                  Message copied to clipboard! Paste it in {contactMethod === 'instagram' ? 'Instagram' : 'Viber'} and attach the payment proof image above.
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 mb-8">
              <button
                onClick={handleOpenContact}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
              >
                {contactMethod === 'instagram' ? <Instagram className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
                Open {contactMethod === 'instagram' ? 'Instagram' : 'Viber'}
              </button>
              
              {!contactOpened && (
                <p className="text-sm text-gray-600">
                  💡 If {contactMethod === 'instagram' ? 'Instagram' : 'Viber'} doesn't open, copy the message above and paste it manually
                </p>
              )}
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-6 mb-8 text-left border-2 border-blue-100">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                What happens next? 
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </h3>
              <ul className="space-y-3 text-sm md:text-base text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-2xl">1️⃣</span>
                  <span>Copy the order message above and attach the payment proof image (shown above) when sending via {contactMethod === 'instagram' ? 'Instagram' : 'Viber'}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">2️⃣</span>
                  <span>We'll confirm your order on {contactMethod === 'instagram' ? 'Instagram' : 'Viber'} within 24 hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">3️⃣</span>
                  <span>Send payment via your selected method</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">4️⃣</span>
                  <span>Products carefully packaged and shipped</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-2xl">5️⃣</span>
                  <span>Delivery in 3-5 business days 🚚</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                window.location.href = '/';
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-6 md:py-8">
        <div className="container mx-auto px-3 md:px-4 max-w-6xl">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 md:mb-6 flex items-center gap-2 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm md:text-base">Back to Cart</span>
          </button>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 flex items-center gap-2">
            Checkout
            <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-yellow-500" />
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Customer Information */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-blue-100">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  <div className="bg-gradient-to-br from-blue-400 to-purple-500 p-2 rounded-xl">
                    <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
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
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-purple-100">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
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
                      placeholder="123 Rizal Street, Brgy. San Antonio"
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
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country *
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="input-field"
                        placeholder="Philippines"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Location Selection */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-purple-100">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                  Choose Shipping Location *
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setShippingLocation('NCR')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      shippingLocation === 'NCR'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">NCR</p>
                    <p className="text-xs text-gray-500">₱160</p>
                  </button>
                  <button
                    onClick={() => setShippingLocation('LUZON')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      shippingLocation === 'LUZON'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">LUZON</p>
                    <p className="text-xs text-gray-500">₱165</p>
                  </button>
                  <button
                    onClick={() => setShippingLocation('VISAYAS_MINDANAO')}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      shippingLocation === 'VISAYAS_MINDANAO'
                        ? 'border-gold-500 bg-gold-50'
                        : 'border-gray-200 hover:border-gold-300'
                    }`}
                  >
                    <p className="font-semibold text-gray-900 text-sm">VISAYAS & MINDANAO</p>
                    <p className="text-xs text-gray-500">₱190</p>
                  </button>
                </div>
                {cartItems.reduce((sum, item) => sum + (!item.product.name.toLowerCase().includes('syringe') ? item.quantity : 0), 0) >= 3 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-800">
                      <strong>Medium Box:</strong> ₱220 applies (3+ peptide sets)
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={!isDetailsValid}
                className={`w-full py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg transition-all transform shadow-lg ${
                  isDetailsValid
                    ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white hover:scale-105 hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Proceed to Payment ✨
              </button>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 md:p-6 sticky top-24 border-2 border-pink-100">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                  Order Summary
                  <Heart className="w-5 h-5 text-pink-500 animate-pulse" />
                </h2>
                
                <div className="space-y-4 mb-6">
                  {cartItems.map((item, index) => (
                    <div key={index} className="pb-4 border-b border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{item.product.name}</h4>
                          {item.variation && (
                            <p className="text-xs text-blue-600 mt-1">{item.variation.name}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {item.product.purity_percentage}% Purity
                          </p>
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">
                          ₱{(item.price * item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-xs">
                    <span>Shipping</span>
                    <span className="font-medium text-blue-600">
                      {shippingLocation ? `₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })}` : 'Select location'}
                    </span>
                  </div>
                  <div className="border-t-2 border-gray-200 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="text-2xl font-bold text-blue-600">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-6 md:py-8">
      <div className="container mx-auto px-3 md:px-4 max-w-6xl">
        <button
          onClick={() => setStep('details')}
          className="text-blue-600 hover:text-blue-700 font-medium mb-4 md:mb-6 flex items-center gap-2 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm md:text-base">Back to Details</span>
        </button>

        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8 flex items-center gap-2">
          Payment
          <CreditCard className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Shipping Location Selection */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-purple-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                Choose Shipping Location *
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setShippingLocation('NCR')}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    shippingLocation === 'NCR'
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gold-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">NCR</p>
                    <p className="text-sm text-gray-500">₱160</p>
                  </div>
                  {shippingLocation === 'NCR' && (
                    <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShippingLocation('LUZON')}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    shippingLocation === 'LUZON'
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gold-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">LUZON</p>
                    <p className="text-sm text-gray-500">₱165</p>
                  </div>
                  {shippingLocation === 'LUZON' && (
                    <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setShippingLocation('VISAYAS_MINDANAO')}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    shippingLocation === 'VISAYAS_MINDANAO'
                      ? 'border-gold-500 bg-gold-50'
                      : 'border-gray-200 hover:border-gold-300'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-semibold text-gray-900">VISAYAS & MINDANAO</p>
                    <p className="text-sm text-gray-500">₱190</p>
                  </div>
                  {shippingLocation === 'VISAYAS_MINDANAO' && (
                    <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              </div>
              {cartItems.reduce((sum, item) => sum + (!item.product.name.toLowerCase().includes('syringe') ? item.quantity : 0), 0) >= 3 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Medium Box Fee:</strong> ₱220 applies for 3+ peptide sets
                  </p>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-green-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-2 rounded-xl">
                  <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                Payment Method
              </h2>
              
              <div className="grid grid-cols-1 gap-4 mb-6">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                    className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                      selectedPaymentMethod === method.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-500">{method.account_name}</p>
                      </div>
                    </div>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {paymentMethodInfo && (
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
                  <div className="space-y-2 text-sm text-gray-700 mb-4">
                    <p><strong>Account Number:</strong> {paymentMethodInfo.account_number}</p>
                    <p><strong>Account Name:</strong> {paymentMethodInfo.account_name}</p>
                    <p><strong>Amount to Pay:</strong> <span className="text-xl font-bold text-blue-600">₱{finalTotal.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span></p>
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

            {/* Payment Proof Upload */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-red-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                Upload Proof of Payment *
              </h2>
              {paymentProofUrl ? (
                <div className="relative">
                  <img
                    src={paymentProofUrl}
                    alt="Payment Proof"
                    className="w-full max-w-md mx-auto object-contain rounded-lg border-2 border-gray-200 shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveProof}
                    className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-gold-400 hover:bg-gold-50/50 transition-all"
                >
                  {uploadingProof ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Uploading...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-12 w-12 text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-700 mb-1">Click to upload payment proof</p>
                      <p className="text-xs text-gray-500">Screenshot of your payment transaction</p>
                    </>
                  )}
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProofUpload}
                className="hidden"
                disabled={uploadingProof}
              />
            </div>

            {/* Contact Method Selection */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-pink-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-pink-600" />
                Preferred Contact Method *
              </h2>
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => setContactMethod('instagram')}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    contactMethod === 'instagram'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Instagram className="w-6 h-6 text-pink-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Instagram</p>
                      <p className="text-sm text-gray-500">@hpglowpeptides</p>
                    </div>
                  </div>
                  {contactMethod === 'instagram' && (
                    <div className="w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
                <button
                  onClick={() => setContactMethod('viber')}
                  className={`p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                    contactMethod === 'viber'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-6 h-6 text-purple-600" />
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Viber</p>
                      <p className="text-sm text-gray-500">09062349763</p>
                    </div>
                  </div>
                  {contactMethod === 'viber' && (
                    <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 md:p-6 border-2 border-pink-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📝</span>
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
              disabled={!paymentProofUrl || !contactMethod || !shippingLocation || uploadingProof}
              className={`w-full py-3 md:py-4 rounded-2xl font-bold text-base md:text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                paymentProofUrl && contactMethod && shippingLocation && !uploadingProof
                  ? 'bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 hover:from-blue-700 hover:via-blue-800 hover:to-blue-900 text-white hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-5 h-5 md:w-6 md:h-6" />
              {uploadingProof ? 'Uploading...' : 'Complete Order'}
            </button>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-5 md:p-6 sticky top-24 border-2 border-blue-100">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2">
                Final Summary
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </h2>
              
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <p className="font-semibold text-gray-900 mb-2">{fullName}</p>
                <p className="text-gray-600">{email}</p>
                <p className="text-gray-600">{phone}</p>
                <div className="mt-3 pt-3 border-t border-gray-200 text-gray-600">
                  <p>{address}</p>
                  <p>{city}, {state} {zipCode}</p>
                  <p>{country}</p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₱{totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Shipping</span>
                  <span className="font-medium text-blue-600">
                    {shippingLocation ? `₱${shippingFee.toLocaleString('en-PH', { minimumFractionDigits: 0 })} (${shippingLocation.replace('_', ' & ')})` : 'Select location'}
                  </span>
                </div>
                <div className="border-t-2 border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
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
