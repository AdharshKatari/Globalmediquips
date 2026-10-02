/* Global Mediquips Enterprise Backend & Admin REST API Server */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_PATH = path.join(__dirname, 'database.json');

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Serve static frontend files
app.use(express.static(__dirname));

const IN_DEPTH_PRODUCTS = [
  {
    id: "2857152264362",
    title: "Philips BiPAP Auto Machine (DreamStation)",
    category: "cpap-bipap",
    categoryName: "CPAP & BiPAP Care",
    brand: "Philips Respironics",
    price: 81000,
    priceDisplay: "₹81,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/8/533175945/LJ/KA/DT/25122208/philips-bipap-auto-machine-500x500.png",
    brochureUrl: "http://5.imimg.com/data5/SELLER/Doc/2025/8/533175933/HQ/AY/RW/25122208/philips-bipap-auto-machine.pdf",
    inStock: true,
    requiresPrescription: true,
    description: "DreamStation BiPAP Auto is an advanced auto-titrating bi-level positive airway pressure device designed for obstructive sleep apnea (OSA) and respiratory insufficiency. Includes Bi-Flex pressure relief (0-3), SmartRamp (0-45 min), adaptive heated humidification with heated tube, color LCD screen with ambient light sensor, and SD card data logging storing up to 6 months of detailed compliance data.",
    specs: [
      { key: "Operating Modes", value: "CPAP Fixed, BiPAP Fixed, BiPAP Auto" },
      { key: "IPAP Pressure Range", value: "4 to 25 cm H2O" },
      { key: "EPAP Pressure Range", value: "4 to 25 cm H2O" },
      { key: "Flex Relief Technology", value: "Bi-Flex Pressure Relief (Settings 1, 2, 3)" },
      { key: "Ramp Feature", value: "SmartRamp (0 - 45 Mins, 4 to min IPAP)" },
      { key: "Humidification", value: "Adaptive Heated Humidifier with Heated Tube" },
      { key: "Data Logging", value: "SD Card Storage (6 Months On-board Data)" },
      { key: "Altitude Compensation", value: "Automatic Altitude Compensation" },
      { key: "Noise Level", value: "Quiet Operation (< 30 dBA)" },
      { key: "Warranty", value: "2 Years Manufacturer Warranty" }
    ]
  },
  {
    id: "2857152145630",
    title: "ResMed Lumis 100 VPAP S BiPAP Machine",
    category: "cpap-bipap",
    categoryName: "CPAP & BiPAP Care",
    brand: "ResMed",
    price: 72000,
    priceDisplay: "₹72,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/1/482782601/HT/QT/NK/25122208/resmed-lumis-100-vpap-st-bipap-500x500.png",
    inStock: true,
    requiresPrescription: true,
    description: "ResMed Lumis 100 VPAP S is a non-invasive ventilator designed for non-dependent respiratory patients. Features TiControl for managing inspiratory time, VSync leak management, 5-level Trigger and Cycle sensitivity, integrated HumidAir heated humidifier with ClimateLineAir tube, and AirView cloud telemetry for remote physician monitoring.",
    specs: [
      { key: "Operating Modes", value: "S (Spontaneous), CPAP" },
      { key: "Pressure Range", value: "2 to 25 cm H2O" },
      { key: "Leak Management", value: "VSync Automatic Leak Compensation" },
      { key: "Inspiratory Control", value: "TiControl (Ti Max, Ti Min)" },
      { key: "Trigger & Cycle", value: "5 Levels of Adjustable Sensitivity" },
      { key: "Humidification", value: "Integrated HumidAir with ClimateControl" },
      { key: "Cloud Telemetry", value: "Built-in Wireless Connectivity for AirView" },
      { key: "Warranty", value: "2 Years Manufacturer Warranty" }
    ]
  },
  {
    id: "2857152129412",
    title: "BPL Oxy 5 Neo Dual Oxygen Concentrator",
    category: "oxygen-concentrators",
    categoryName: "Oxygen Concentrator",
    brand: "BPL Medical Technologies",
    price: 38000,
    priceDisplay: "₹38,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/2/492186901/WQ/JG/FH/25122208/bpl-oxy-5-neo-dual-oxygen-concentrator-500x500.png",
    inStock: true,
    requiresPrescription: false,
    description: "BPL Oxy 5 Neo Dual is a high-performance 5-liter dual-flow medical oxygen concentrator that enables simultaneous oxygen delivery to two patients. Equipped with an oxygen purity sensor, digital hour meter, audio-visual alarms for low purity, power failure, and pressure faults, and heavy-duty casters for effortless mobility.",
    specs: [
      { key: "Oxygen Flow Rate", value: "0.5 to 5.0 Liters / Minute (Dual Outlet)" },
      { key: "Oxygen Concentration", value: "93% ± 3% Purity at all flow rates" },
      { key: "Power Consumption", value: "350 Watts (AC 220V / 50Hz)" },
      { key: "Safety Alarms", value: "Low Oxygen, Power Failure, High/Low Pressure" },
      { key: "Operational Display", value: "LCD Display with Cumulative Running Hours" },
      { key: "Weight", value: "15.5 kg" },
      { key: "Warranty", value: "2 Years Manufacturer Warranty" }
    ]
  },
  {
    id: "2857152146255",
    title: "Philips Portable Oxygen Concentrator (SimplyGo)",
    category: "oxygen-concentrators",
    categoryName: "Oxygen Concentrator",
    brand: "Philips Respironics",
    price: 165000,
    priceDisplay: "₹1,65,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2024/12/470559729/KP/MJ/WJ/25122208/philips-simply-go-portable-oxygen-concentrator-500x500.png",
    inStock: true,
    requiresPrescription: false,
    description: "Philips SimplyGo is the only FAA-approved portable oxygen concentrator (POC) offering continuous flow (up to 2 LPM) and pulse dose delivery (up to setting 6) in a lightweight 4.5 kg unit. Designed for active patients and travel, it features a long-life rechargeable lithium-ion battery, carrying bag, cart, and high-impact casing.",
    specs: [
      { key: "Continuous Flow", value: "0.5 to 2.0 LPM (0.5 LPM Increments)" },
      { key: "Pulse Dose Settings", value: "1 to 6 Settings" },
      { key: "Oxygen Purity", value: "87% to 96% Across All Settings" },
      { key: "Battery Duration", value: "Up to 3.5 Hours (Pulse Setting 2)" },
      { key: "Weight with Battery", value: "4.5 kg (10 lbs)" },
      { key: "FAA Approval", value: "Approved for Commercial Airline Travel" },
      { key: "Warranty", value: "2 Years Manufacturer Warranty" }
    ]
  },
  {
    id: "2857152320030",
    title: "Oxymed 10L Oxygen Concentrator",
    category: "oxygen-concentrators",
    categoryName: "Oxygen Concentrator",
    brand: "Oxymed",
    price: 58000,
    priceDisplay: "₹58,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/2/492186901/WQ/JG/FH/25122208/bpl-oxy-5-neo-dual-oxygen-concentrator-500x500.png",
    inStock: true,
    requiresPrescription: false,
    description: "Oxymed 10-Liter high-flow continuous medical oxygen concentrator engineered for clinical and heavy-duty home oxygen therapy. Built-in oxygen purity indicator (OPI), integrated nebulizer outlet, digital hour meter, and ultra-quiet compressor.",
    specs: [
      { key: "Oxygen Flow Rate", value: "1.0 to 10.0 Liters / Minute" },
      { key: "Oxygen Purity", value: "93% ± 3% Purity" },
      { key: "Nebulizer Function", value: "Integrated Nebulizer Outlet (≥ 0.15 ml/min)" },
      { key: "Power Consumption", value: "610 Watts" },
      { key: "Weight", value: "24.0 kg" },
      { key: "Warranty", value: "2 Years Manufacturer Warranty" }
    ]
  },
  {
    id: "2857152242297",
    title: "Hospital Examination Couch",
    category: "hospital-furniture",
    categoryName: "Hospital Furniture",
    brand: "Global Mediquips",
    price: 12500,
    priceDisplay: "₹12,500",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/4/500859056/JO/TG/KE/25122208/products-6fa48-500x500.png",
    inStock: true,
    requiresPrescription: false,
    description: "Heavy-duty clinical examination couch manufactured with epoxy powder-coated tubular MS frame, 2-inch high-density foam cushioned top with washable leatherette cover, ratchet-adjustable head section, utility paper roll holder, and 2 integrated sliding storage drawers.",
    specs: [
      { key: "Overall Dimensions", value: "1830 L × 610 W × 810 H mm" },
      { key: "Frame Material", value: "CRCA Tubular MS Frame with Epoxy Powder Coating" },
      { key: "Upholstery", value: "High Density 50mm Foam Cushion with Rexine Cover" },
      { key: "Headrest Adjustment", value: "Multi-position Ratchet Mechanism" },
      { key: "Storage Drawers", value: "2 Steel Sliding Utility Drawers" }
    ]
  },
  {
    id: "2857152156188",
    title: "5-Function Manual ICU Hospital Bed",
    category: "hospital-furniture",
    categoryName: "Hospital Furniture",
    brand: "Global Mediquips",
    price: 42000,
    priceDisplay: "₹42,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/4/500732864/IG/JP/DZ/25122208/5-function-manual-icu-hospital-bed-health-shine-250x250.png",
    inStock: true,
    requiresPrescription: false,
    description: "Premium 5-function manual ICU bed constructed with perforated CRCA steel top, removable ABS head and foot boards, collapsible aluminum alloy side safety rails, 4-wheel central braking system, and 5 independent smooth-crank operations.",
    specs: [
      { key: "Overall Dimensions", value: "2150 L × 980 W × 450-700 H mm" },
      { key: "Crank Functions", value: "Backrest, Kneerest, Height, Trendelenburg & Rev. Trendelenburg" },
      { key: "Side Rails", value: "Collapsible Aluminum Alloy Side Rails" },
      { key: "Casters", value: "125mm Heavy-duty Swivel Casters with Central Lock" },
      { key: "Load Capacity", value: "Up to 250 kg" }
    ]
  },
  {
    id: "2857152129133",
    title: "Gynec Examination Table / Recovery Trolley",
    category: "hospital-furniture",
    categoryName: "Hospital Furniture",
    brand: "Global Mediquips",
    price: 24500,
    priceDisplay: "₹24,500",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/4/501443506/DU/OX/JE/25122208/hydraulic-trauma-care-recovery-trolley-ss-for-hospital-500x500.png",
    inStock: true,
    requiresPrescription: false,
    description: "304-grade stainless steel hydraulic gynecological examination table and emergency trauma care recovery trolley. Features 3-section upholstered top, hydraulic height elevation pedal, padded lithotomy leg crutches, retractable stainless steel fluid basin, and trendelenburg tilt.",
    specs: [
      { key: "Material", value: "Full 304 Grade Stainless Steel Construction" },
      { key: "Elevation Mechanism", value: "Heavy-duty Hydraulic Foot Pedal" },
      { key: "Accessories Included", value: "Padded Lithotomy Crutches & Stainless Basin" },
      { key: "Sections", value: "3-Section Top with Washable Leatherette Cushion" }
    ]
  },
  {
    id: "2857152231788",
    title: "Nidek 12 Channel ECG Machine (Model ECG-712)",
    category: "ecg-machines",
    categoryName: "ECG & Diagnostics",
    brand: "Nidek",
    price: 52000,
    priceDisplay: "₹52,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2025/2/486279737/JU/HF/UM/25122208/ecg-machine-12-channel-nidek-model-ecg-712-500x500.png",
    inStock: true,
    requiresPrescription: false,
    description: "Nidek ECG-712 is a high-precision 12-channel digital electrocardiograph equipped with a 7-inch color touch screen, Glasgow automatic ECG analysis algorithm, internal memory storing up to 1000 ECG records, thermal printing, USB data transfer, and rechargeable lithium battery.",
    specs: [
      { key: "Channels", value: "12 Channel Simultaneous Lead Acquisition" },
      { key: "Display Screen", value: "7-Inch Color TFT Touch Screen (800 × 480)" },
      { key: "Interpretation", value: "Built-in Automatic ECG Analysis Algorithm" },
      { key: "Printer", value: "210mm Thermal Paper Roll / Z-fold" },
      { key: "Internal Storage", value: "1000 Patient ECG Records" },
      { key: "Battery Backup", value: "Built-in Li-ion Battery (Up to 3 Hours)" }
    ]
  },
  {
    id: "2857152242062",
    title: "Mindray Syringe Pump Benefusion SP1",
    category: "icu-equipment",
    categoryName: "ICU Equipment",
    brand: "Mindray",
    price: 28000,
    priceDisplay: "₹28,000",
    hsnCode: "90181100",
    image: "https://5.imimg.com/data5/SELLER/PDFImage/2024/12/470617971/AR/NC/ST/25122208/mindray-benefusion-usp-syringe-pump-500x500.png",
    inStock: true,
    requiresPrescription: false,
    description: "Mindray BeneFusion SP1 is an ultra-precise critical care infusion syringe pump designed for ICU and anesthesia administration. Compatible with 10ml, 20ml, 30ml, and 50/60ml syringes, offering high flow accuracy (±2%), 3-level occlusion pressure alarm settings, drug library, and 6-hour battery backup.",
    specs: [
      { key: "Syringe Sizes", value: "10ml, 20ml, 30ml, 50ml / 60ml Syringes" },
      { key: "Flow Rate Range", value: "0.1 to 1500 ml/h (0.1 ml/h increments)" },
      { key: "Infusion Accuracy", value: "High Precision (±2% Mechanical Accuracy)" },
      { key: "Occlusion Alarms", value: "3 Adjustable Levels (Low, Medium, High)" },
      { key: "Battery Life", value: "Rechargeable Lithium Battery (6 Hours at 5ml/h)" }
    ]
  }
];

function loadDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    const initialDb = {
      company: {
        name: "Global Mediquips",
        owner: "Shivashankar Katari",
        year: 2013,
        turnover: "Rs. 2 - 5 Crore",
        gst: "36BHGPK3813B1ZS",
        hsnDefault: "90181100",
        banker: "ICICI BANK LIMITED",
        location: "Amberpet, Hyderabad, Telangana, India",
        helpline: "+91 96669 99185"
      },
      products: IN_DEPTH_PRODUCTS,
      quotes: [
        {
          quoteRef: "GM-Q-100241",
          buyerName: "Dr. Ramesh V.",
          hospitalName: "Sunshine Hospitals Hyderabad",
          phone: "+91 98765 11223",
          location: "Secunderabad",
          items: [{ title: "Philips BiPAP Auto Machine (DreamStation)", price: 81000, quantity: 2 }],
          totalAmount: 162000,
          totalAmountDisplay: "₹1,62,000",
          status: "Pending",
          createdAt: "2026-10-01T20:15:00Z"
        }
      ],
      reviews: [
        { reviewer: "Shivani", location: "Hyderabad, Telangana", date: "2025-07-17", product: "Digital Spirometer", rating: 5 },
        { reviewer: "Narsimha Reddy", location: "Hyderabad, Telangana", date: "2025-07-04", product: "CPAP Machine", rating: 5 }
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function saveDatabase(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// REST API ROUTES
app.get('/api/company', (req, res) => {
  const db = loadDatabase();
  res.json({ success: true, data: db.company });
});

app.get('/api/products', (req, res) => {
  const db = loadDatabase();
  let results = db.products;
  const { category, brand, search } = req.query;

  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }
  if (brand && brand !== 'all') {
    results = results.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(p => 
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: results.length, data: results });
});

app.get('/api/products/:id', (req, res) => {
  const db = loadDatabase();
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  res.json({ success: true, data: product });
});

app.post('/api/quotes', (req, res) => {
  const { buyerName, hospitalName, phone, location, items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, error: 'No items in quote' });
  }

  const db = loadDatabase();
  const quoteRef = `GM-Q-${Date.now().toString().slice(-6)}`;
  const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  const newQuote = {
    quoteRef,
    buyerName: buyerName || "Hospital Procurement Officer",
    hospitalName: hospitalName || "Private Hospital / Clinic",
    phone: phone || "+91 96669 99185",
    location: location || "Hyderabad, Telangana",
    items,
    totalAmount,
    totalAmountDisplay: `₹${totalAmount.toLocaleString('en-IN')}`,
    status: "Pending",
    createdAt: new Date().toISOString()
  };

  db.quotes.push(newQuote);
  saveDatabase(db);
  res.status(201).json({ success: true, data: newQuote });
});

// ADMIN CRUD ROUTES

// Canonical display names for every product category (keeps catalog labels consistent)
const CATEGORY_NAMES = {
  'cpap-bipap': 'CPAP & BiPAP Care',
  'oxygen-concentrators': 'Oxygen Concentrators',
  'hospital-furniture': 'Hospital Furniture',
  'ecg-machines': 'ECG & Diagnostics',
  'icu-pumps': 'ICU Pumps'
};

app.post('/api/admin/products', (req, res) => {
  const { title, category, categoryName, brand, price, hsnCode, image, description, countryOfOrigin, application, pressureRange, rampRate, dataStorage, warranty, brochureUrl, videoUrl } = req.body;
  if (!title || !price) {
    return res.status(400).json({ success: false, error: 'Title and Price required' });
  }

  const db = loadDatabase();
  const newProduct = {
    id: Date.now().toString(),
    title,
    category: category || 'cpap-bipap',
    categoryName: categoryName || CATEGORY_NAMES[category] || 'Medical Equipment',
    brand: brand || 'Global Mediquips',
    price: Number(price),
    priceDisplay: `₹${Number(price).toLocaleString('en-IN')}`,
    hsnCode: hsnCode || '90181100',
    image: image || 'https://5.imimg.com/data5/SELLER/PDFImage/2025/8/533175945/LJ/KA/DT/25122208/philips-bipap-auto-machine-250x250.png',
    brochureUrl: brochureUrl || '',
    videoUrl: videoUrl || '',
    countryOfOrigin: countryOfOrigin || 'Made in India',
    application: application || 'Hospital / Home Care',
    pressureRange: pressureRange || 'Standard Medical Range',
    rampRate: rampRate || '0 - 60 Mins',
    dataStorage: dataStorage || 'Digital Logging',
    warranty: warranty || '2 Years Manufacturer Warranty',
    inStock: true,
    requiresPrescription: false,
    description: description || 'Certified medical equipment supplied by Global Mediquips.',
    specs: [
      { key: "Brand", value: brand || "Global Mediquips" },
      { key: "Warranty", value: warranty || "2 Years Manufacturer Warranty" },
      { key: "Country of Origin", value: countryOfOrigin || "Made in India" },
      { key: "Application / Usage", value: application || "Hospital / Home Care" },
      { key: "Pressure Range", value: pressureRange || "Standard" },
      { key: "Ramp Rate", value: rampRate || "0-60 Mins" },
      { key: "Data Storage", value: dataStorage || "Digital Logging" },
      { key: "HSN & GST Compliance", value: `HSN ${hsnCode || '90181100'} - 12% GST` }
    ]
  };

  db.products.unshift(newProduct);
  saveDatabase(db);
  res.status(201).json({ success: true, message: 'Product added', data: newProduct });
});

// Edit Existing Medical Equipment
app.put('/api/admin/products/:id', (req, res) => {
  const db = loadDatabase();
  const productIndex = db.products.findIndex(p => p.id === req.params.id);
  if (productIndex === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const existing = db.products[productIndex];
  const {
    title, category, categoryName, brand, price, hsnCode, image, description,
    countryOfOrigin, application, pressureRange, rampRate, dataStorage,
    warranty, brochureUrl, videoUrl, specs, inStock
  } = req.body;

  if (title) existing.title = title;
  if (category) {
    existing.category = category;
    // Keep the displayed category name in sync with the selected category
    existing.categoryName = CATEGORY_NAMES[category] || categoryName || existing.categoryName;
  } else if (categoryName) {
    existing.categoryName = categoryName;
  }
  if (brand) existing.brand = brand;
  if (price !== undefined && price !== "") {
    existing.price = parseFloat(price) || existing.price;
    existing.priceDisplay = `₹${existing.price.toLocaleString('en-IN')}`;
  }
  if (hsnCode) existing.hsnCode = hsnCode;
  if (image) existing.image = image;
  if (description) existing.description = description;
  if (countryOfOrigin) existing.countryOfOrigin = countryOfOrigin;
  if (application) existing.application = application;
  if (pressureRange) existing.pressureRange = pressureRange;
  if (rampRate) existing.rampRate = rampRate;
  if (dataStorage) existing.dataStorage = dataStorage;
  if (warranty) existing.warranty = warranty;
  if (brochureUrl !== undefined) existing.brochureUrl = brochureUrl;
  if (videoUrl !== undefined) existing.videoUrl = videoUrl;
  if (inStock !== undefined) existing.inStock = !!inStock;

  // Full specification matrix provided by the admin editor — replace it wholesale
  if (Array.isArray(specs)) {
    existing.specs = specs.filter(s => s && s.key && s.value);
  } else if (existing.specs && Array.isArray(existing.specs)) {
    // Legacy partial sync for older clients

    const setSpec = (k, v) => {
      if (!v) return;
      const s = existing.specs.find(x => x.key.toLowerCase().includes(k.toLowerCase()));
      if (s) s.value = v;
      else existing.specs.push({ key: k, value: v });
    };
    if (brand) setSpec("Brand", brand);
    if (countryOfOrigin) setSpec("Country of Origin", countryOfOrigin);
    if (application) setSpec("Application / Usage", application);
    if (pressureRange) setSpec("Pressure Range", pressureRange);
    if (rampRate) setSpec("Ramp Rate", rampRate);
    if (hsnCode) setSpec("HSN & GST Compliance", `HSN ${hsnCode} - 12% GST`);
  }

  saveDatabase(db);
  res.json({ success: true, message: 'Product updated successfully', data: existing });
});

app.delete('/api/admin/products/:id', (req, res) => {
  const db = loadDatabase();
  const initCount = db.products.length;
  db.products = db.products.filter(p => p.id !== req.params.id);
  if (db.products.length === initCount) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }
  saveDatabase(db);
  res.json({ success: true, message: 'Product deleted' });
});

app.put('/api/admin/quotes/:quoteRef', (req, res) => {
  const db = loadDatabase();
  const quote = db.quotes.find(q => q.quoteRef === req.params.quoteRef);
  if (!quote) return res.status(404).json({ success: false, error: 'Quote not found' });
  quote.status = req.body.status || quote.status;
  saveDatabase(db);
  res.json({ success: true, data: quote });
});

// Update Storefront Settings (Founder Photo & Hero Featured Product)
app.post('/api/admin/settings', (req, res) => {
  const db = loadDatabase();
  const { founderImage, featuredProductId } = req.body;
  if (!db.company) db.company = {};
  if (founderImage !== undefined) {
    db.company.founderImage = founderImage;
  }
  // Guard: an empty/invalid featured product id would break the home hero card
  if (typeof featuredProductId === 'string' && featuredProductId.trim() !== '') {
    db.company.featuredProductId = featuredProductId.trim();
  }
  saveDatabase(db);
  res.json({ success: true, message: 'Storefront settings saved successfully', data: db.company });
});

app.get('/api/admin/dashboard', (req, res) => {
  const db = loadDatabase();
  const totalPipeline = db.quotes.reduce((sum, q) => sum + q.totalAmount, 0);
  res.json({
    success: true,
    data: {
      company: db.company,
      productsCount: db.products.length,
      quotesCount: db.quotes.length,
      pipelineValue: `₹${totalPipeline.toLocaleString('en-IN')}`,
      products: db.products,
      quotes: db.quotes
    }
  });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Global Mediquips Master Server Running on Port ${PORT}`);
  console.log(`🌐 Live URL: http://localhost:${PORT}`);
  console.log(`====================================================`);
  loadDatabase();
});

module.exports = app;
