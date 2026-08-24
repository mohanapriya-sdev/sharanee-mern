const Address = require("../models/Address");
const axios = require("axios");
const asyncHandler = require("../utils/asyncHandler");

// @route  POST /api/address
const addAddress = asyncHandler(async (req, res) => {
  const address = await Address.create(req.body);
  res.status(201).json({ address });
});

// @route  GET /api/address/:userId
const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await Address.find({ user: req.params.userId }).sort({ createdAt: -1 });
  res.json({ addresses });
});

// @route  PUT /api/address/:id
const updateAddress = asyncHandler(async (req, res) => {
  const address = await Address.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!address) return res.status(404).json({ message: "Address not found" });
  res.json({ address });
});

// @route  DELETE /api/address/:id
const removeAddress = asyncHandler(async (req, res) => {
  const address = await Address.findByIdAndDelete(req.params.id);
  if (!address) return res.status(404).json({ message: "Address not found" });
  res.json({ message: "Address removed" });
});

// @route GET /api/address/verify-pincode/:pincode

const verifyPincode = asyncHandler(async (req, res) => {
  const { pincode } = req.params;

  // Basic validation
  if (!/^\d{6}$/.test(pincode)) {
    return res.status(400).json({
      success: false,
      message: "PIN code must contain exactly 6 digits.",
    });
  }

  try {
    const { data } = await axios.get(
      `https://api.postalpincode.in/pincode/${pincode}`
    );

    if (
      !data ||
      !data.length ||
      data[0].Status !== "Success"
    ) {
      return res.json({
        success: false,
        message: "Invalid PIN code.",
      });
    }

    const office = data[0].PostOffice[0];

    return res.json({
      success: true,
      message: "PIN code verified for this address.",
      postOffice: office.Name,
      district: office.District,
      city: office.Block || office.Division,
      state: office.State,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to verify PIN code.",
    });
  }
});

module.exports = {
  addAddress,
  getAddresses,
  updateAddress,
  removeAddress,
  verifyPincode,
};
