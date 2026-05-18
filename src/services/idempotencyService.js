const { hashRequestBody } = require("../utils/hash");

const idempotencyStore = new Map();

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processPayment(req, res) {
  const idempotencyKey = req.header("Idempotency-Key");
  const requestBody = req.body;

  if (!idempotencyKey) {
    return res.status(400).json({
      error: "Idempotency-Key header is required."
    });
  }

  if (!requestBody.amount || requestBody.amount <= 0 || !requestBody.currency) {
    return res.status(400).json({
      error: "Amount must be greater than 0 and currency is required."
    });
  }

  const currentBodyHash = hashRequestBody(requestBody);

  if (idempotencyStore.has(idempotencyKey)) {
    const savedRequest = idempotencyStore.get(idempotencyKey);

    if (savedRequest.bodyHash !== currentBodyHash) {
      return res.status(409).json({
        error: "Idempotency key already used for a different request body."
      });
    }

    if (savedRequest.status === "processing") {
      const finalResult = await savedRequest.promise;
      res.set("X-Cache-Hit", "true");
      return res.status(finalResult.statusCode).json(finalResult.body);
    }

    res.set("X-Cache-Hit", "true");
    return res.status(savedRequest.statusCode).json(savedRequest.body);
  }

  const paymentPromise = (async () => {
    await delay(2000);

    return {
      statusCode: 201,
      body: {
        message: `Charged ${requestBody.amount} ${requestBody.currency}`,
        status: "success"
      }
    };
  })();

  idempotencyStore.set(idempotencyKey, {
    bodyHash: currentBodyHash,
    status: "processing",
    promise: paymentPromise
  });

  const result = await paymentPromise;

  idempotencyStore.set(idempotencyKey, {
    bodyHash: currentBodyHash,
    status: "completed",
    statusCode: result.statusCode,
    body: result.body
  });

  return res.status(result.statusCode).json(result.body);
}

module.exports = { processPayment };