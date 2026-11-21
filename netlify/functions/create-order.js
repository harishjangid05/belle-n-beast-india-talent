// POST /.netlify/functions/create-order
// Creates a Razorpay order for the ₹850 fee and a registration ID for the applicant.
// The registration ID is stored on the order (receipt + notes) so it can be verified later.
const { FEE_PAISE, CURRENCY, CATEGORY_NAMES, keys, razorpay, registrationId, clip, json } = require('../lib/razorpay');

const CITIES = ['Mumbai','Delhi','Bengaluru','Hyderabad','Chennai','Kolkata','Pune','Ahmedabad','Jaipur','Chandigarh','Lucknow','Indore','Surat','Bhopal','Kochi','Panaji','Nagpur','Guwahati','Bhubaneswar','Coimbatore'];
const DATES = ['2027-01-01','2027-01-02','2027-01-03','2027-01-04','2027-01-05','2027-01-06','2027-01-07'];
const TIMES = ['morning','afternoon','evening'];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });
  let a;
  try { a = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }

  // Re-check the essentials on the server; the browser checks are only for convenience.
  const digits = String(a.phone || '').replace(/\D/g, '');
  const problems = [];
  if (!CATEGORY_NAMES[a.category]) problems.push('category');
  if (clip(a.fullName).length < 2) problems.push('fullName');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(a.email || '').trim())) problems.push('email');
  if (digits.length < 10 || digits.length > 15) problems.push('phone');
  if (!CITIES.includes(a.eventCity)) problems.push('eventCity');
  if (!DATES.includes(a.eventDate)) problems.push('eventDate');
  if (!TIMES.includes(a.timePreference)) problems.push('timePreference');
  if (problems.length) return json(400, { error: 'Some details are missing or invalid.', fields: problems });

  try {
    const { keyId } = keys();
    const regId = registrationId(a.category);
    // Razorpay allows up to 15 notes of max 256 characters each.
    const order = await razorpay('/orders', {
      method: 'POST',
      body: {
        amount: FEE_PAISE,
        currency: CURRENCY,
        receipt: regId,
        notes: {
          registration_id: regId,
          full_name: clip(a.fullName, 120),
          email: clip(a.email, 120),
          phone: clip(a.phone, 20),
          category: CATEGORY_NAMES[a.category],
          dob: clip(a.dob, 10),
          current_location: clip(`${a.currentCity || ''}, ${a.state || ''}`, 160),
          passport: clip(a.passport, 20),
          experience: clip(a.experience, 20),
          relocation: clip(a.relocation, 20),
          event_city: a.eventCity,
          event_date: a.eventDate,
          time_preference: a.timePreference,
          portfolio_url: clip(a.portfolioUrl, 250)
        }
      }
    });
    return json(200, {
      keyId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      registrationId: regId
    });
  } catch (err) {
    return json(err.status || 500, { error: err.status ? err.message : 'Something went wrong. Please try again.' });
  }
};
