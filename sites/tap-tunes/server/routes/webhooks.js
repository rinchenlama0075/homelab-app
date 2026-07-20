const express = require("express");
const { constructWebhookEvent, handleCheckoutCompleted } = require("../lib/stripe");

// Mounted in index.js with express.raw() (not express.json()) for this path
// specifically — Stripe's signature verification needs the exact raw
// request body bytes.
function buildRouter() {
  const router = express.Router();

  router.post("/stripe", (req, res) => {
    let event;
    try {
      event = constructWebhookEvent(req.body, req.headers["stripe-signature"]);
    } catch (err) {
      console.error("[webhooks] signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed") {
      handleCheckoutCompleted(event.data.object);
    }

    res.json({ received: true });
  });

  return router;
}

module.exports = { buildRouter };
