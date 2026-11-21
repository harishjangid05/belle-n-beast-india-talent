// POST /.netlify/functions/verify-payment
// Confirms a Razorpay payment: checks the HMAC signature, then asks Razorpay for the
// order and payment to make sure the right amount was paid for this order.
// Only then is the registration ID returned as confirmed.
const { FEE_PAISE, razorpay, validSignature, json } = require('../lib/razorpay');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  let b;
  try { b = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  const orderId = String(b.razorpay_order_id || '');
  const paymentId = String(b.razorpay_payment_id || '');
  const signature = String(b.razorpay_signature || '');
  if (!/^order_\w+$/.test(orderId) || !/^pay_\w+$/.test(paymentId) || !signature) {
    return json(400, { verified: false, error: 'Missing payment details.' });
  }

  try {
    if (!validSignature(orderId, paymentId, signature)) {
      return json(400, { verified: false, error: 'Payment signature could not be verified.' });
    }
    const [order, payment] = await Promise.all([
      razorpay(`/orders/${orderId}`),
      razorpay(`/payments/${paymentId}`)
    ]);
    const ok = payment.order_id === orderId
      && payment.amount === FEE_PAISE
      && order.amount === FEE_PAISE
      && ['captured', 'authorized'].includes(payment.status);
    if (!ok) return json(400, { verified: false, error: 'Payment was not completed for this registration.' });

    const n = order.notes || {};
    return json(200, {
      verified: true,
      registrationId: n.registration_id || order.receipt,
      paymentId,
      orderId,
      amount: payment.amount,
      status: payment.status,
      paidAt: payment.created_at,
      fullName: n.full_name,
      category: n.category,
      eventCity: n.event_city,
      eventDate: n.event_date,
      timePreference: n.time_preference
    });
  } catch (err) {
    return json(err.status || 500, { verified: false, error: err.status ? err.message : 'Something went wrong. Please try again.' });
  }
};
