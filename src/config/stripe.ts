import Stripe from 'stripe';


const stripeSecret = process.env.STRIPE_SECRET_KEY;
if (!stripeSecret) {
throw new Error('STRIPE_SECRET_KEY not set in environment');
}


export const stripe = new Stripe(stripeSecret);
export default stripe;