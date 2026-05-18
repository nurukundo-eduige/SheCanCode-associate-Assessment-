const express = require("express");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Idempotency Gateway API is running.");
});

app.use("/", paymentRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});