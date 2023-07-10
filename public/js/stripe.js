/*eslint-disable*/
import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51NQRBzDkOYfi1vJpMyyDTX7ZD6juRn9azyEvvzLLMcWE2CW6ZE6xNNrgLCRx1YxsizVqebVm9K97B8mQOlGFQn4X006RQKVFiD'
); // FRONTEND MODE - Stripe(public key)

export const bookTour = async (tourId) => {
  try {
    // 1. Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2. Create checkout form + charge credit card
    await stripe.redirectToCheckout({ sessionId: session.data.session.id });
  } catch (err) {
    showAlert('error', err);
  }
};
