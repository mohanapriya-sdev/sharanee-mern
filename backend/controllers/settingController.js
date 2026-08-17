const asyncHandler = require("../utils/asyncHandler");
const Setting = require("../models/Setting");

const DEFAULT_SETTINGS = {
  storeName: "",
  storeEmail: "",
  storePhone: "",
  storeAddress: "",

  currency: "INR",

  shippingFee: 0,
  freeShippingThreshold: 0,
  deliveryDays: "5-7",

  taxRate: 0,
  taxIncluded: false,

  codEnabled: true,
  onlinePaymentEnabled: true,
  upiId: "",

  emailOnNewOrder: true,
  emailOnLowStock: true,
  emailOnNewCustomer: false,
  lowStockThreshold: 10,

  maintenanceMode: false,
};

// GET SETTINGS
exports.getSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create(DEFAULT_SETTINGS);
  } else {
    // IMPORTANT: Fix old settings documents missing new fields
    let changed = false;

    Object.keys(DEFAULT_SETTINGS).forEach((key) => {
      if (settings[key] === undefined) {
        settings[key] = DEFAULT_SETTINGS[key];
        changed = true;
      }
    });

    if (changed) {
      await settings.save();
    }
  }

  res.json({
    success: true,
    settings,
  });
});

// UPDATE SETTINGS
exports.updateSettings = asyncHandler(async (req, res) => {
  let settings = await Setting.findOne();

  if (!settings) {
    settings = await Setting.create({
      ...DEFAULT_SETTINGS,
      ...req.body,
    });
  } else {
    Object.assign(settings, req.body);
    await settings.save();
  }

  res.json({
    success: true,
    message: "Settings Updated",
    settings,
  });
});