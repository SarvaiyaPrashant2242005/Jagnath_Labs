/**
 * @file servicesData.js
 * @description Centralized data for the 5 Main Service Categories and their 6 dedicated services.
 * Categories:
 * 1. Food Testing (/services/food-testing)
 * 2. Counseling Services (/services/counseling)
 * 3. Environmental Testing (/services/environmental-testing)
 * 4. Agricultural Testing (/services/agricultural-testing)
 * 5. Consultancy Services (/services/consultancy)
 */

export const SERVICE_CATEGORIES = [
  {
    id: 'food-testing',
    slug: 'food-testing',
    title: 'Food Testing',
    shortTitle: 'Food Testing',
    badge: 'Category 01',
    heroBadge: 'FSSAI & NABL ACCREDITED TESTING',
    heroTitle: 'Advanced Food Testing & Quality Assurance Services',
    heroDescription: 'From farm to fork, Jagnath Lab Technologies provides authoritative analytical and microbiological testing services to guarantee food safety, authenticity, consumer trust, and regulatory compliance.',
    image: '/assets/reference_images/1150285146.webp',
    iconName: 'Apple',
    overview: 'Our state-of-the-art food testing laboratory is equipped with high-resolution instrumentation (GC-MS, HPLC, ICP-OES, AAS) to analyze raw ingredients, packaged foodstuffs, agricultural commodities, and dairy products adhering strictly to FSSAI, AOAC, and ISO testing protocols.',
    keyBenefits: [
      'Comprehensive screening compliant with FSSAI regulations',
      'Accurate nutritional labeling and proximate values',
      'Rapid turnaround times for microbiological screening',
      'State-of-the-art detection of chemical contaminants and adulterants'
    ],
    services: [
      {
        id: 'nutritional-analysis',
        name: 'Nutritional Analysis',
        badge: 'Service 01',
        description: 'Complete nutritional profile evaluation including calories, carbohydrates, dietary fiber, total proteins, fats, fatty acid profiles (saturated, unsaturated, trans fats), sodium, vitamins, and essential minerals for mandatory packaging compliance.',
        highlights: ['Proximate analysis (Moisture, Ash, Protein, Fat)', 'Vitamins A, C, D, E, B-Complex assays', 'Fatty acid profiling by GC-FID', 'FSSAI-compliant nutrition facts panel']
      },
      {
        id: 'microbiological-testing',
        name: 'Microbiological Testing',
        badge: 'Service 02',
        description: 'Rigorous pathogen detection and microbial enumeration to identify spoilage organisms, foodborne pathogens, and hygiene indicator organisms to protect consumer health and validate processing sterility.',
        highlights: ['Pathogen detection (Salmonella, Listeria, E. coli)', 'Total Plate Count (TPC) & Coliform counts', 'Yeast and Mould enumeration', 'Commercial sterility & shelf-stability verification']
      },
      {
        id: 'chemical-analysis',
        name: 'Chemical Analysis',
        badge: 'Service 03',
        description: 'Accurate determination of chemical parameters, acidity levels, peroxide values, free fatty acids, active additives, artificial colors, synthetic sweeteners, and natural chemical properties of raw and formulated foods.',
        highlights: ['pH, titratable acidity & moisture content', 'Peroxide value, iodine value & saponification', 'Permitted and non-permitted food additives', 'Preservatives testing (Benzoates, Sorbates, Nitrites)']
      },
      {
        id: 'food-adulteration-testing',
        name: 'Food Adulteration Testing',
        badge: 'Service 04',
        description: 'Specialized diagnostic tests to uncover intentional or accidental adulteration in edible oils, milk and dairy products, spices, honey, pulses, and grain products using standardized chemical and chromatographic assays.',
        highlights: ['Starch, urea, and synthetic milk adulterant checks', 'Argemone oil and mineral oil detection in edible oils', 'Sudan dye & artificial coloring in spices', 'Honey authenticity & C4/C3 sugar profiling']
      },
      {
        id: 'shelf-life-testing',
        name: 'Shelf Life Testing',
        badge: 'Service 05',
        description: 'Real-time and accelerated stability storage studies simulating variable temperature, humidity, and lighting conditions to establish accurate expiration dates and monitor sensory, chemical, and microbial decay.',
        highlights: ['Accelerated stability chamber testing (ICH guidelines)', 'Rancidity & lipid oxidation progression (TBARS, PV)', 'Organoleptic and sensory evaluation over time', 'Packaging barrier integrity assessment']
      },
      {
        id: 'food-safety-quality-testing',
        name: 'Food Safety & Quality Testing',
        badge: 'Service 06',
        description: 'End-to-end quality assurance ensuring food items meet national and international export standards, verifying absence of toxic heavy metals, naturally occurring toxins, and hazardous process contaminants.',
        highlights: ['Toxic heavy metals screening (Pb, As, Cd, Hg)', 'Mycotoxins & Aflatoxins (B1, B2, G1, G2, M1)', 'Residual solvent & packaging migrant tests', 'Export-grade compliance certification']
      }
    ]
  },
  {
    id: 'counseling',
    slug: 'counseling',
    title: 'Counseling Services',
    shortTitle: 'Counseling Services',
    badge: 'Category 02',
    heroBadge: 'CLINICAL DIETETICS & HEALTH COUNSELING',
    heroTitle: 'Professional Nutritional, Dietetic & Food Hygiene Counseling',
    heroDescription: 'Personalized dietary guidance, certified clinical diet planning, and institutional food hygiene counseling backed by accurate laboratory data and certified dietetic practitioners.',
    image: '/assets/reference_images/2162590496.webp',
    iconName: 'HeartHandshake',
    overview: 'Bridging the gap between scientific analytical results and daily wellness. Our counseling division assists individuals, health-conscious organizations, schools, and commercial kitchens in developing evidence-based nutrition programs, diet charts, and strict hygiene habits.',
    keyBenefits: [
      'Tailored consultation with certified dietitians and nutritionists',
      'Integration of laboratory biomarkers with nutritional guidance',
      'Preventive lifestyle and therapeutic medical nutrition therapy',
      'Practical hygiene blueprints for catering and food operations'
    ],
    services: [
      {
        id: 'nutrition-counseling',
        name: 'Nutrition Counseling',
        badge: 'Service 01',
        description: 'One-on-one professional consultations to evaluate personal lifestyle, metabolic requirements, and nutritional gaps, providing a personalized roadmap toward vitality and balanced health.',
        highlights: ['Macronutrient and micronutrient balance analysis', 'Biochemical report interpretation for diet planning', 'Weight management & metabolic optimization', 'Supplementation guidance and necessity checks']
      },
      {
        id: 'diet-planning-consultation',
        name: 'Diet Planning & Consultation',
        badge: 'Service 02',
        description: 'Customized therapeutic and preventive meal planning designed for specific medical conditions such as diabetes, hypertension, renal conditions, cardiovascular wellness, and digestive health.',
        highlights: ['Low-glycemic meal strategies for diabetic care', 'Heart-healthy, low-sodium dietary charts', 'Renal diet formulations with mineral controls', 'Gastrointestinal wellness & FODMAP diets']
      },
      {
        id: 'food-safety-awareness',
        name: 'Food Safety Awareness',
        badge: 'Service 03',
        description: 'Educational programs and interactive workshops for households, hospitality staff, and commercial handlers on critical food safety rules, allergen control, and cross-contamination prevention.',
        highlights: ['Safe storage temperatures & danger zone control', 'Food allergen identification & prevention', 'Personal hygiene standards for food handlers', 'Preventing biological and chemical contamination']
      },
      {
        id: 'health-wellness-counseling',
        name: 'Health & Wellness Counseling',
        badge: 'Service 04',
        description: 'Holistic lifestyle counseling focusing on preventive health, regular hydration, restorative sleep habits, stress reduction, and optimal energy balance throughout different life stages.',
        highlights: ['Workplace corporate wellness programs', 'Geriatric and adolescent nutritional care', 'Stress management & lifestyle modification', 'Long-term healthy habit formulation']
      },
      {
        id: 'dietary-assessment',
        name: 'Dietary Assessment',
        badge: 'Service 05',
        description: 'In-depth nutritional audit of individual or collective institutional food intake utilizing 24-hour recalls, food frequency questionnaires, and body composition analytics.',
        highlights: ['Food intake logging & caloric tracking', 'Nutrient deficit & excess identification', 'Body mass index (BMI) & body composition review', 'Actionable personalized audit reports']
      },
      {
        id: 'food-hygiene-guidance',
        name: 'Food Hygiene Guidance',
        badge: 'Service 06',
        description: 'Step-by-step guidance for catering operations, institutional cafeterias, and domestic kitchens to implement sanitary cooking practices, dishware sanitation, and clean preparation environments.',
        highlights: ['Kitchen sanitization protocols & checklists', 'Safe raw material receiving & washing procedures', 'Pest vulnerability elimination guidelines', 'Water potability validation in cooking']
      }
    ]
  },
  {
    id: 'environmental-testing',
    slug: 'environmental-testing',
    title: 'Environmental Testing',
    shortTitle: 'Environmental Testing',
    badge: 'Category 03',
    heroBadge: 'GPCB & CPCB RECOGNIZED ENVIRONMENTAL LAB',
    heroTitle: 'Accredited Environmental Testing & Regulatory Monitoring',
    heroDescription: 'High-precision testing of water, wastewater, industrial effluents, ambient air, stack emissions, and noise levels to ensure compliance with GPCB, CPCB, and MoEF&CC environmental mandates.',
    image: '/assets/reference_images/1479609109.webp',
    iconName: 'Wind',
    overview: 'As a Schedule-II Environmental Auditor recognized by the Gujarat Pollution Control Board, Jagnath Lab Technologies conducts field sampling, laboratory testing, and certified reporting for industrial estates, commercial plants, and municipal authorities.',
    keyBenefits: [
      'Statutory compliance for GPCB Consent to Establish (CTE) & Operate (CC&A)',
      'Accredited procedures according to IS, APHA, and CPCB guidelines',
      'Advanced field monitoring equipment for on-site air and noise recording',
      'Reliable documentation recognized by regulatory inspection authorities'
    ],
    services: [
      {
        id: 'drinking-water-testing',
        name: 'Drinking Water Testing',
        badge: 'Service 01',
        description: 'Complete physicochemical and microbiological evaluation of potable water sources according to Bureau of Indian Standards IS 10500:2012 specifications to certify human consumption safety.',
        highlights: ['Physicochemical parameters (pH, TDS, Hardness, Turbidity)', 'Toxic heavy metals (Lead, Arsenic, Mercury, Chromium)', 'Bacteriological safety (Total Coliforms, E. coli)', 'Chlorides, Fluorides, Nitrates & Sulphates']
      },
      {
        id: 'wastewater-testing',
        name: 'Wastewater Testing',
        badge: 'Service 02',
        description: 'Comprehensive analysis of treated and untreated domestic, municipal, and commercial wastewater to monitor purification performance and satisfy local drainage discharge limits.',
        highlights: ['Biochemical Oxygen Demand (BOD 3-day at 27°C)', 'Chemical Oxygen Demand (COD)', 'Total Suspended Solids (TSS) & Settleable Solids', 'Ammoniacal Nitrogen & Total Kjeldahl Nitrogen (TKN)']
      },
      {
        id: 'soil-quality-testing',
        name: 'Soil Quality Testing',
        badge: 'Service 03',
        description: 'Detailed analysis of industrial vicinity soils, landfills, and contaminated sites to assess hazardous solute percolation, organic matter content, salinity, and ecological balance.',
        highlights: ['Soil pH, Electrical Conductivity (EC) & Salinity', 'Organic carbon & cation exchange capacity (CEC)', 'Heavy metal accumulation mapping', 'TCLP leaching tests for contaminated land']
      },
      {
        id: 'air-quality-monitoring',
        name: 'Air Quality Monitoring',
        badge: 'Service 04',
        description: 'On-site ambient air quality monitoring (NAAQS) and industrial stack emission testing to quantify particulate matter, acid gases, and combustion products.',
        highlights: ['Respirable Particulate Matter (PM10 and PM2.5)', 'Sulphur Dioxide (SO2) & Nitrogen Dioxide (NO2)', 'Stack flue gas velocity, temperature & emission rate', 'Carbon Monoxide (CO), VOCs & Hydrocarbons']
      },
      {
        id: 'noise-level-monitoring',
        name: 'Noise Level Monitoring',
        badge: 'Service 05',
        description: 'Calibrated sound pressure level measurements for industrial plant boundaries, DG sets, and residential buffer zones to verify adherence to Factory Act and Central Pollution Control Board noise thresholds.',
        highlights: ['Day and night ambient boundary noise surveys', 'DG set acoustic enclosure insertion loss testing', 'Workplace high-noise machinery profiling (Leq)', 'Octave band frequency analysis']
      },
      {
        id: 'industrial-effluent-testing',
        name: 'Industrial Effluent Testing',
        badge: 'Service 06',
        description: 'Stringent testing of raw and treated trade effluents from chemical, textile, pharmaceutical, and engineering units to ensure compliance with GPCB discharge consents.',
        highlights: ['Heavy metals, Cyanide, Phenolic compounds', 'Oil & Grease, Dissolved Solids, Bio-assay testing', 'ETP inlet vs outlet purification efficiency', 'CETP inlet discharge standard verification']
      }
    ]
  },
  {
    id: 'agricultural-testing',
    slug: 'agricultural-testing',
    title: 'Agricultural Testing',
    shortTitle: 'Agricultural Testing',
    badge: 'Category 04',
    heroBadge: 'PRECISION AGRONOMY & SOIL HEALTH LAB',
    heroTitle: 'Scientific Agricultural Testing for Higher Yields & Soil Health',
    heroDescription: 'Empowering farmers, agribusinesses, and fertilizer producers with exact soil fertility ratings, organic fertilizer assays, pesticide residue checks, and irrigation water quality profiling.',
    image: '/assets/reference_images/1322071992.webp',
    iconName: 'Sprout',
    overview: 'Sustainable crop yield begins with certified laboratory insight. Our agricultural testing unit provides comprehensive nutrient mapping, organic and inorganic fertilizer testing, and seed vigor assays to optimize agricultural investments and crop health.',
    keyBenefits: [
      'Tailored fertilizer and micronutrient recommendation charts',
      'Pesticide residue testing ensuring export and domestic compliance',
      'Irrigation salinity and sodicity assessment protecting soil structure',
      'Rapid turnaround for seasonal planting schedules'
    ],
    services: [
      {
        id: 'soil-fertility-testing',
        name: 'Soil Fertility Testing',
        badge: 'Service 01',
        description: 'Precision analysis of macronutrients and micronutrients in agricultural soil samples to diagnose nutrient deficiencies, determine pH adjustments, and plan optimal fertilization.',
        highlights: ['Available Nitrogen (N), Phosphorus (P2O5), Potassium (K2O)', 'Micronutrients (Zinc, Iron, Manganese, Copper, Boron)', 'Organic Carbon % and Soil Electrical Conductivity', 'Lime requirement and gypsum requirement testing']
      },
      {
        id: 'fertilizer-testing',
        name: 'Fertilizer Testing',
        badge: 'Service 02',
        description: 'Chemical assay of chemical fertilizers (DAP, Urea, NPK mixes), bio-fertilizers, and organic compost in accordance with the Fertilizer Control Order (FCO) standards.',
        highlights: ['Total Nitrogen, ammoniacal & nitrate forms', 'Water-soluble phosphate & citrate-insoluble phosphate', 'Moisture, heavy metals & biuret content in urea', 'Carbon-to-Nitrogen ratio (C:N) in organic compost']
      },
      {
        id: 'pesticide-residue-analysis',
        name: 'Pesticide Residue Analysis',
        badge: 'Service 03',
        description: 'Multi-residue screening using advanced GC-MS/MS and LC-MS/MS techniques to quantify organochlorines, organophosphates, synthetic pyrethroids, and fungicides in crops and agricultural runoff.',
        highlights: ['Over 150+ pesticide active ingredient screens', 'Maximum Residue Limit (MRL) export compliance', 'Herbicide and fungicide residue detection', 'Pre-harvest interval advisory testing']
      },
      {
        id: 'seed-quality-testing',
        name: 'Seed Quality Testing',
        badge: 'Service 04',
        description: 'Certified seed laboratory testing evaluating physical purity, moisture percentage, germination percentage, and seedling vigor to guarantee seed viability prior to sowing.',
        highlights: ['Germination capacity & standard germination %', 'Physical purity & inert matter separation', 'Seed moisture content by hot-air oven method', 'Weed seed contamination screening']
      },
      {
        id: 'irrigation-water-testing',
        name: 'Irrigation Water Testing',
        badge: 'Service 05',
        description: 'Assessment of borewell, canal, and recycled irrigation water to evaluate salinity hazards, Sodium Adsorption Ratio (SAR), and residual sodium carbonate that affect soil permeability.',
        highlights: ['Sodium Adsorption Ratio (SAR) & Boron toxicity', 'Residual Sodium Carbonate (RSC)', 'Electrical Conductivity (Salinity hazard rating)', 'Chloride, sulfate, and bicarbonate levels']
      },
      {
        id: 'plant-crop-nutrient-analysis',
        name: 'Plant & Crop Nutrient Analysis',
        badge: 'Service 06',
        description: 'Diagnostic leaf, petiole, and plant tissue testing to detect sub-clinical nutrient hunger signs, evaluate fertilizer uptake efficiency, and correct crop deficiencies mid-season.',
        highlights: ['Foliar nitrogen, phosphorus, and potassium levels', 'Trace element status in actively growing tissue', 'Chloride and sodium leaf-burn toxicity check', 'Crop-specific nutrient reference ranges']
      }
    ]
  },
  {
    id: 'consultancy',
    slug: 'consultancy',
    title: 'Consultancy Services',
    shortTitle: 'Consultancy Services',
    badge: 'Category 05',
    heroBadge: 'ACCREDITATION, LICENSING & REGULATORY CONSULTING',
    heroTitle: 'Expert Laboratory, Regulatory & Industrial Consultancy',
    heroDescription: 'Guiding food businesses, laboratories, and manufacturing units through end-to-end FSSAI licensing, NABL ISO/IEC 17025 accreditation, ISO certifications, and GPCB environmental compliance.',
    image: '/assets/reference_images/2199680361.webp',
    iconName: 'Briefcase',
    overview: 'Navigating technical statutory standards requires proven industry experience. Our senior consultants deliver step-by-step guidance, documentation drafting, internal audit execution, and liaison support to achieve and maintain statutory clearances.',
    keyBenefits: [
      'Turnkey assistance from initial gap audit to certificate grant',
      'Experienced NABL lead assessors and FSSAI regulatory experts',
      'Customized quality manual, SOP, and documentation authoring',
      'Zero non-conformance support during official inspection audits'
    ],
    services: [
      {
        id: 'fssai-registration-licensing',
        name: 'FSSAI Registration & Licensing Consultancy',
        badge: 'Service 01',
        description: 'Comprehensive support for food business operators (manufacturers, repackers, exporters, and retailers) to obtain Basic Registration, State Licenses, and Central FSSAI Licenses.',
        highlights: ['Eligibility categorization & document compilation', 'Form-B & manufacturing blueprint preparation', 'Product recall & food safety plan drafting', 'Annual return filing & license renewal support']
      },
      {
        id: 'nabl-accreditation-consultancy',
        name: 'NABL Accreditation Consultancy',
        badge: 'Service 02',
        description: 'End-to-end guidance for testing and calibration laboratories aiming to achieve ISO/IEC 17025:2017 accreditation under the National Accreditation Board for Testing and Calibration Laboratories.',
        highlights: ['Quality Management System (QMS) manual & SOPs', 'Measurement uncertainty (MU) budgeting & validation', 'Proficiency Testing (PT) & ILC plan formulation', 'Pre-assessment & final audit closure guidance']
      },
      {
        id: 'iso-certification-consultancy',
        name: 'ISO Certification Consultancy',
        badge: 'Service 03',
        description: 'Structured consultancy for organizations seeking international management certifications including ISO 9001 (Quality), ISO 14001 (Environment), and ISO 45001 (Occupational Health & Safety).',
        highlights: ['Gap analysis against target ISO standard', 'Process mapping & internal documentation setup', 'Internal auditor training & execution', 'Stage-1 and Stage-2 certification audit support']
      },
      {
        id: 'food-safety-management-consultancy',
        name: 'Food Safety Management Consultancy',
        badge: 'Service 04',
        description: 'Implementation support for advanced food safety frameworks including ISO 22000 (FSMS), HACCP (Hazard Analysis Critical Control Point), and FSSC 22000 schemes.',
        highlights: ['HACCP hazard analysis & CCP determination', 'Prerequisite Programs (PRP) implementation', 'Allergen, sanitation, and hygiene standard operating rules', 'Mock trace-and-recall validation exercises']
      },
      {
        id: 'environmental-compliance-consultancy',
        name: 'Environmental Compliance Consultancy',
        badge: 'Service 05',
        description: 'Strategic environmental engineering advisory for GPCB Consent to Establish (CTE), Consolidated Consent & Authorization (CC&A), Environmental Audit Scheme reports, and hazardous waste compliance.',
        highlights: ['GPCB CTE & CC&A application handling', 'Schedule-II Environmental Audit report compilation', 'Hazardous waste manifest and Form-4 submissions', 'ETP/STP design review and troubleshooting advisory']
      },
      {
        id: 'agricultural-quality-consultancy',
        name: 'Agricultural Quality Consultancy',
        badge: 'Service 06',
        description: 'Consultancy for agribusinesses, farmer producer organizations (FPOs), seed companies, and organic exporters to implement Good Agricultural Practices (GAP) and quality assurance standards.',
        highlights: ['GlobalGAP & IndiaGAP certification roadmaps', 'Organic certification (NPOP/NOP) documentation', 'Post-harvest quality management protocols', 'Export consignment quality compliance advisory']
      }
    ]
  }
];

export const getCategoryBySlug = (slug) => {
  if (!slug) return null;
  const clean = String(slug).trim().toLowerCase();
  return SERVICE_CATEGORIES.find(c => c.slug === clean || c.id === clean);
};
