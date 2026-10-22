import React from 'react';
import { 
  Wind, 
  Droplet, 
  Layers, 
  Volume2, 
  Apple, 
  Microscope, 
  TestTubes, 
  Building,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export const ServicesView = ({ onAppointmentClick }) => {
  const servicesList = [
    {
      id: '01',
      badge: 'Service 01',
      title: 'Ambient Air Quality Monitoring & Stack Testing',
      icon: <Wind size={22} />,
      image: '/assets/reference_images/1479609109.webp',
      intro: 'Ensure compliance with environmental standards and protect public health through our precise air analysis and stack emission testing services.',
      sections: [
        {
          title: 'Ambient Air Quality Monitoring (NAAQS)',
          bullets: [
            'PM10, PM2.5, SO2, NOx, CO, Ozone',
            'Ammonia, Benzene & Heavy Metals',
            'Continuous & periodic monitoring',
            'NAAQS compliance reporting'
          ]
        },
        {
          title: 'Emissions & Stack Testing',
          bullets: [
            'Velocity & emission rate measurement',
            'Combustion products analysis',
            'Dioxins, furans & acid gases',
            'Source Apportionment Studies'
          ]
        },
        {
          title: 'Workplace & Indoor Air Quality',
          bullets: [
            'Industrial hygiene monitoring',
            'VOC assessments',
            'Dust & particulate surveys',
            'Occupational exposure limits'
          ]
        }
      ]
    },
    {
      id: '02',
      badge: 'Service 02',
      title: 'Water & Wastewater Testing',
      icon: <Droplet size={22} />,
      image: '/assets/reference_images/1545344758.webp',
      intro: 'Comprehensive chemical, physical, and microbiological characterization of drinking water, process water, groundwater, and industrial effluents.',
      sections: [
        {
          title: 'Drinking Water Analysis (IS 10500)',
          bullets: [
            'pH, TDS, Turbidity, Total Hardness',
            'Heavy metals (Pb, As, Cd, Cr, Hg)',
            'E. coli, Total Coliforms, Faecal Strep',
            'Pesticide residue & potability cert.'
          ]
        },
        {
          title: 'Industrial Effluents & ETP Compliance',
          bullets: [
            'BOD, COD, Oil & Grease, TSS',
            'Ammoniacal Nitrogen & Total Nitrogen',
            'GPCB & CPCB consent compliance',
            'ETP / STP performance & aeration check'
          ]
        }
      ]
    },
    {
      id: '03',
      badge: 'Service 03',
      title: 'Soil, Sludge & Solid Waste Analysis',
      icon: <Layers size={22} />,
      image: '/assets/reference_images/1322071992.webp',
      intro: 'Complete biological and chemical profiling of agricultural soils, ETP sludges, compost, and hazardous industrial solid wastes.',
      sections: [
        {
          title: 'Soil Fertility & Nutrient Profiling',
          bullets: [
            'Nitrogen, Phosphorus, Potassium (NPK)',
            'Calcium, Magnesium & Sodium',
            'Organic Carbon determination',
            'Micronutrient mapping (Zn, Fe, Mn, Cu)'
          ]
        },
        {
          title: 'Heavy Metals & Hazardous Sludge (TCLP)',
          bullets: [
            'TCLP leachate analysis',
            'Hazardous waste characterisation',
            'Chloride & Soluble Sulphates',
            'Landfill & co-processing suitability'
          ]
        }
      ]
    },
    {
      id: '04',
      badge: 'Service 04',
      title: 'Industrial Hygiene, Noise & Illumination',
      icon: <Volume2 size={22} />,
      image: '/assets/reference_images/1884886428.webp',
      intro: 'Optimize workplace safety conditions, protect workers, and comply with Factories Act guidelines through calibrated field surveys.',
      sections: [
        {
          title: 'Environmental & DG Noise Monitoring',
          bullets: [
            'Ambient day & night noise surveys',
            'DG Set noise insertion loss test',
            'Instantaneous noise frequency tracking',
            'Factory perimeter noise mapping'
          ]
        },
        {
          title: 'Workplace Illumination Surveys',
          bullets: [
            'Lux level shopfloor measurement',
            'Factories Act lighting compliance',
            'Ergonomic workstation illumination',
            'Emergency lighting validation'
          ]
        }
      ]
    },
    {
      id: '05',
      badge: 'Service 05',
      title: 'Food & Agricultural Testing',
      icon: <Apple size={22} />,
      image: '/assets/reference_images/1150285146.webp',
      intro: 'Quality and regulatory testing of agricultural grains, processed snacks, spices, dairy products, and packaged foods under FSSAI mandates.',
      sections: [
        {
          title: 'Food Quality & FSSAI Standards',
          bullets: [
            'Proximate analysis & moisture content',
            'Preservatives, artificial colors, acidity',
            'Peroxide value & rancidity checks',
            'Nutritional panel facts determination'
          ]
        },
        {
          title: 'Pesticide & Mycotoxin Contaminants',
          bullets: [
            'Multi-residue pesticide screens',
            'Aflatoxins (B1, B2, G1, G2) & Ochratoxin',
            'Heavy metals (Pb, As, Cd, Hg)',
            'Antibiotic residue testing'
          ]
        }
      ]
    },
    {
      id: '06',
      badge: 'Service 06',
      title: 'Microbiological & Pathogen Testing',
      icon: <Microscope size={22} />,
      image: '/assets/reference_images/1485080100.webp',
      intro: 'Isolation, identification, and quantification of bacterial, fungal, and viral contaminants across foods, pharmaceuticals, and water.',
      sections: [
        {
          title: 'Food & Water Pathogen Screening',
          bullets: [
            'Salmonella spp. & Listeria monocytogenes',
            'Staphylococcus aureus & Pseudomonas',
            'Total Viable Plate Count (TPC)',
            'Yeast and Mould enumeration'
          ]
        },
        {
          title: 'Sterility & Cleanroom Environmental Monitoring',
          bullets: [
            'Cleanroom air sedimentation plates',
            'Surface swab & personnel hygiene assays',
            'Disinfectant efficacy validation',
            'Bioburden determination'
          ]
        }
      ]
    },
    {
      id: '07',
      badge: 'Service 07',
      title: 'Toxicology & Chemical Analysis',
      icon: <TestTubes size={22} />,
      image: '/assets/reference_images/2191676796.webp',
      intro: 'Chemical assay, qualitative identification, and toxic chemical screening for industrial raw materials and formulated chemicals.',
      sections: [
        {
          title: 'Assay & Purity Determination',
          bullets: [
            'Active chemical assay & purity',
            'Loss on drying & volatile matter',
            'Sulphated ash & insoluble matter',
            'Acid-base & redox titrimetry'
          ]
        },
        {
          title: 'Heavy Metal Toxicology',
          bullets: [
            'Lead, Arsenic, Cadmium, Mercury',
            'Trace elemental impurities',
            'Hazardous chemical classification',
            'Material safety data support'
          ]
        }
      ]
    },
    {
      id: '08',
      badge: 'Service 08',
      title: 'Civil & Construction Material Testing',
      icon: <Building size={22} />,
      image: '/assets/reference_images/2199680361.webp',
      intro: 'Reliable testing of construction materials to ensure structural integrity, durability, and compliance with IS and BIS standards.',
      sections: [
        {
          title: 'Concrete & Cement Testing',
          bullets: [
            'Compressive strength of concrete cubes',
            'Cement consistency & setting time',
            'Water-cement ratio analysis',
            'Flexural & tensile strength tests'
          ]
        },
        {
          title: 'Aggregates, Sand & Soil Mechanics',
          bullets: [
            'Sieve analysis & fineness modulus',
            'Specific gravity & water absorption',
            'Flakiness & elongation index',
            'Standard Proctor compaction & CBR'
          ]
        }
      ]
    }
  ];

  return (
    <div className="jlt-services-wrapper">
      {/* 1. Header Banner */}
      <section className="jlt-sub-hero">
        <div className="jlt-container">
          <span className="jlt-section-badge" style={{ color: '#86efac' }}>OUR SERVICES</span>
          <h1 className="jlt-sub-hero-title">Comprehensive Testing Capabilities</h1>
          <p className="jlt-sub-hero-desc">
            Complete range of accredited environmental, microbiological, chemical, food, and industrial testing solutions designed for precision and compliance.
          </p>
        </div>
      </section>

      {/* 2. Alternating Services List */}
      <section className="jlt-section" style={{ paddingTop: '2rem' }}>
        <div className="jlt-container">
          {servicesList.map((svc, sIdx) => {
            const isImageLeft = sIdx % 2 === 0;

            return (
              <div key={svc.id} className="jlt-service-row">
                {/* Image Column */}
                <div 
                  className="jlt-service-img-box"
                  style={{ order: isImageLeft ? 1 : 2 }}
                >
                  <img 
                    src={svc.image} 
                    alt={svc.title} 
                    className="jlt-service-row-img"
                  />
                </div>

                {/* Content Column */}
                <div 
                  className="jlt-service-content-col"
                  style={{ order: isImageLeft ? 2 : 1 }}
                >
                  <div className="jlt-service-badge-pill">
                    {svc.icon}
                    <span>{svc.badge}</span>
                  </div>

                  <h2 className="jlt-service-row-title">{svc.title}</h2>
                  <p className="jlt-service-row-p">{svc.intro}</p>

                  <div className="jlt-service-subsections">
                    {svc.sections.map((sub, subIdx) => (
                      <div key={subIdx}>
                        <h4 className="jlt-service-sub-title">{sub.title}</h4>
                        <ul className="jlt-service-sub-bullets">
                          {sub.bullets.map((b, bIdx) => (
                            <li key={bIdx} className="jlt-service-sub-bullet">
                              <CheckCircle2 size={16} />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <button 
                    type="button" 
                    className={sIdx % 2 === 0 ? "jlt-btn-quote" : "jlt-btn-quote jlt-btn-quote-green"}
                    onClick={onAppointmentClick}
                  >
                    <span>Get a Quote</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default ServicesView;
