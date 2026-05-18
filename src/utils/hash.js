const crypto = require("crypto");

function hashRequestBody(body) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(body))
    .digest("hex");
}

module.exports = { hashRequestBody };