import { api } from "../axios";

export const createCheckoutSession = () => {
  console.log();
  return api
    .post(`/stripe/checkout-sessions`, {
      cancelUrl: window.location.href,
    })
    .then((res) => {
      if (res.status === 200) {
        window.location.href = res.data.url;
      }
    });
};

export const createPortalSession = () => {
  return api
    .post(`/stripe/portal-sessions`, {
      returnUrl: window.location.href,
    })
    .then((res) => {
      if (res.status === 200) {
        window.location.href = res.data.url;
      }
    });
};
