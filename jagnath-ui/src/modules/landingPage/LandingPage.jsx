import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

// Reusable Components
import Badge from '../../shared/components/Badge/Badge';
import Button from '../../shared/components/Button/Button';
import Card from '../../shared/components/Card/Card';

// Local Video Import
import landingVideo from '../../assets/video/jagnath Landing page.mp4';
import logoImg from '../../assets/images/J-logo.png';

// React Icons
import {
  FaCalendarAlt,
  FaVial,
  FaAward,
  FaFileMedical,
  FaCloudDownloadAlt,
  FaCheckDouble,
  FaHome,
  FaHeartbeat,
  FaVenus,
  FaUserShield,
  FaFacebookF,
  FaTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaChevronDown,
  FaStar,
  FaTimes,
  FaCheck,
  FaLaptopMedical,
  FaFileDownload,
  FaTruck,
  FaUserMd,
  FaRegMoneyBillAlt,
  FaRunning,
  FaChartLine,
  FaHospitalSymbol,
  FaShieldAlt,
  FaNotesMedical
} from 'react-icons/fa';
import {
  MdBloodtype
} from 'react-icons/md';
import { GiMicroscope } from 'react-icons/gi';
import { TbReportAnalytics } from 'react-icons/tb';
import { FiActivity } from 'react-icons/fi';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

function LandingPage({ onNavigate }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [openFaq, setOpenFaq] = useState(null);

  // GSAP Refs
  const heroHeadingRef = useRef(null);
  const heroDescRef = useRef(null);
  const heroBadgeRef = useRef(null);
  const heroBtnsRef = useRef(null);
  const counterRefs = useRef([]);
  const partnerMarqueeRef = useRef(null);
  const servicesGridRef = useRef(null);
  const compLeftRef = useRef(null);
  const compRightRef = useRef(null);
  const timelineSectionRef = useRef(null);
  const progressBarRef = useRef(null);
  const timelineStepsRef = useRef([]);
  const featuresGridRef = useRef(null);
  const testimonialSliderRef = useRef(null);
  const faqContainerRef = useRef(null);
  const ctaContainerRef = useRef(null);

  // Lenis and general GSAP triggers
  useEffect(() => {
    // 1. Lenis Smooth Scroll Setup
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    // 2. Navbar Scroll Trigger
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);

    // 3. Hero Animations (Entrance)
    const tlHero = gsap.timeline();
    tlHero.fromTo(heroBadgeRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' }
    );
    tlHero.fromTo(heroHeadingRef.current,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' },
      '-=0.4'
    );
    tlHero.fromTo(heroDescRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
      '-=0.4'
    );
    tlHero.fromTo(heroBtnsRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' },
      '-=0.3'
    );

    // 5. Counters ScrollTrigger
    counterRefs.current.forEach((el) => {
      if (!el) return;
      const targetVal = parseFloat(el.getAttribute('data-target'));
      const isFloat = el.getAttribute('data-float') === 'true';
      const suffix = el.getAttribute('data-suffix') || '';

      gsap.fromTo(el,
        { textContent: 0 },
        {
          textContent: targetVal,
          duration: 2.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          snap: { textContent: isFloat ? 0.1 : 1 },
          onUpdate: function () {
            const currentVal = parseFloat(el.textContent);
            el.textContent = (isFloat ? currentVal.toFixed(1) : Math.floor(currentVal)) + suffix;
          }
        }
      );
    });

    // 6. Services Grid Reveal
    if (servicesGridRef.current) {
      const cards = servicesGridRef.current.querySelectorAll('.service-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 60 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: servicesGridRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
    }

    // 7. Comparison Columns Slide In
    if (compLeftRef.current && compRightRef.current) {
      gsap.fromTo(compLeftRef.current,
        { opacity: 0, x: -60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: compLeftRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
      gsap.fromTo(compRightRef.current,
        { opacity: 0, x: 60 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: compRightRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
    }

    // 8. Horizontal Timeline fill line and nodes reveal (Automatic on reach, no scrub)
    if (timelineSectionRef.current && progressBarRef.current) {
      const isMobile = window.innerWidth <= 991;
      gsap.fromTo(progressBarRef.current,
        { [isMobile ? 'height' : 'width']: '0%' },
        {
          [isMobile ? 'height' : 'width']: '100%',
          duration: 2.2,
          ease: 'power1.inOut',
          scrollTrigger: {
            trigger: timelineSectionRef.current,
            start: 'top 70%',
            toggleActions: 'play none none none',
          }
        }
      );

      timelineStepsRef.current.forEach((step, index) => {
        if (!step) return;
        gsap.fromTo(step,
          { opacity: 0.4, scale: 0.85 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            delay: index * 0.32,
            ease: 'back.out(1.7)',
            scrollTrigger: {
              trigger: timelineSectionRef.current,
              start: 'top 70%',
              toggleActions: 'play none none none',
              onStart: () => {
                setTimeout(() => {
                  step.classList.add('completed');
                  step.classList.add('active');
                }, index * 320);
              }
            }
          }
        );
      });
    }

    // 9. Features Stagger Reveal
    if (featuresGridRef.current) {
      const cards = featuresGridRef.current.querySelectorAll('.feature-card');
      gsap.fromTo(cards,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.08,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: featuresGridRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
    }

    // 10. FAQ Stagger Reveal
    if (faqContainerRef.current) {
      const items = faqContainerRef.current.querySelectorAll('.faq-item');
      gsap.fromTo(items,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: faqContainerRef.current,
            start: 'top 85%',
            toggleActions: 'play none none none',
          }
        }
      );
    }

    // 11. Final CTA scale transition
    if (ctaContainerRef.current) {
      gsap.fromTo(ctaContainerRef.current,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: ctaContainerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          }
        }
      );
    }

    // Cleanup on unmount
    return () => {
      lenis.destroy();
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Testimonials Auto-sliding logic
  const testimonials = [
    {
      name: "Dr. Sarah Jenkins",
      role: "Chief Cardiologist, City Medical",
      review: "Jaganath-Lab is our primary diagnostic partner. Their NABL-certified reports are highly accurate, and the digital delivery speed helps us manage patient emergencies effectively.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=150"
    },
    {
      name: "Rajesh Patel",
      role: "Fitness Instructor",
      review: "The home sample collection is extremely clean and punctual. I book health packages for my parents every year; it is affordable, secure, and reports come in hours.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150"
    },
    {
      name: "Elena Rostova",
      role: "Digital Specialist",
      review: "Having all reports on an online dashboard makes it easy to track my values. I don't have to carry sheets of papers anymore. Highly recommend for healthcare testing.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150"
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      changeSlide((activeSlide + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeSlide]);

  const changeSlide = (index) => {
    if (testimonialSliderRef.current) {
      gsap.to(testimonialSliderRef.current, {
        opacity: 0,
        scale: 0.96,
        y: 10,
        duration: 0.3,
        onComplete: () => {
          setActiveSlide(index);
          gsap.to(testimonialSliderRef.current, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: 'power2.out',
          });
        }
      });
    } else {
      setActiveSlide(index);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // FAQs
  const faqs = [
    {
      q: "How do I book a health package or diagnostic test?",
      a: "You can book in under a minute on our landing page. Click 'Book a Test', select your required diagnostic screening or full body health packages, choose a convenient slot for home collection, and complete booking."
    },
    {
      q: "What is the turnaround time for test results?",
      a: "Most standard blood tests, glucose monitoring, and pathology screenings are delivered within 6 to 12 hours. Some advanced hormone or vitamin profile assays may take up to 24 hours."
    },
    {
      q: "How are the samples collected from home?",
      a: "Our certified and trained phlebotomists will arrive at your selected slot. They follow strict WHO protocols, carrying sealed collection vials, sanitizers, and temperature-controlled transport bags."
    },
    {
      q: "Are my reports verified by qualified experts?",
      a: "Yes. Every diagnostic test at Jaganath-Lab is performed on modern automatic equipment, and all reports are reviewed and double-signed by certified pathologists."
    },
    {
      q: "How do I access my digital reports?",
      a: "Once completed, you will receive an SMS and email notification with a secure download link. You can also view all historical reports anytime on your online dashboard."
    }
  ];

  return (
    <>
      {/* Navbar Section */}
      <header className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-wrapper" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <a href="#" className="nav-logo" id="logo-anchor">
            <img src={logoImg} alt="Jaganath Logo" className="nav-logo-img" />
            Jaganath<span className="logo-text-highlight">- Lab</span>
          </a>
          <Button variant="secondary" onClick={() => onNavigate && onNavigate('login')}>
            Login
          </Button>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero-section" id="home">
          <div className="hero-video-container">
            <video className="hero-video" autoPlay loop muted playsInline>
              <source src={landingVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="hero-overlay"></div>
          </div>

          <div className="hero-grid">
            <div className="hero-content">
              <div ref={heroBadgeRef}>
                <Badge className="hero-badge">
                  Trusted Diagnostic Laboratory
                </Badge>
              </div>

              <h1 ref={heroHeadingRef} className="hero-heading">
                Advanced Laboratory<br />
                Testing For <span className="highlight">Better Health</span>
              </h1>

              <p ref={heroDescRef} className="hero-desc">
                Jaganath-Lab provides precise laboratory diagnostics, pathology services, comprehensive preventive health checkups, and rapid digital report delivery. Book your test online for home sample collection.
              </p>

              <div ref={heroBtnsRef} className="hero-ctas">
                <Button variant="primary">
                  Book a Test
                </Button>
                <Button variant="glass">
                  View Health Packages
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Counter Section */}
        <section className="counter-section">
          <div className="counter-container">
            <div className="counter-item">
              <span
                ref={(el) => (counterRefs.current[0] = el)}
                className="counter-number highlight"
                data-target="100000"
                data-suffix="+"
              >
                0
              </span>
              <span className="counter-label">Patients Tested</span>
            </div>

            <div className="counter-item">
              <span
                ref={(el) => (counterRefs.current[1] = el)}
                className="counter-number"
                data-target="250"
                data-suffix="+"
              >
                0
              </span>
              <span className="counter-label">Diagnostic Tests</span>
            </div>

            <div className="counter-item">
              <span
                ref={(el) => (counterRefs.current[2] = el)}
                className="counter-number highlight"
                data-target="99.8"
                data-float="true"
                data-suffix="%"
              >
                0
              </span>
              <span className="counter-label">Accuracy Rate</span>
            </div>

            <div className="counter-item">
              <span
                ref={(el) => (counterRefs.current[3] = el)}
                className="counter-number"
                data-target="24"
                data-suffix="/7"
              >
                0
              </span>
              <span className="counter-label">Report Access</span>
            </div>
          </div>
        </section>

        {/* Trust Section (Marquee) */}
        <section className="marquee-wrapper" aria-label="Trusted Partners">
          <div className="marquee-track" ref={partnerMarqueeRef}>
            {/* Double elements for smooth endless horizontal loop */}
            {[1, 2].map((loop) => (
              <div key={loop} style={{ display: 'flex' }}>
                <div className="partner-logo"><FaHospitalSymbol className="partner-icon" /> Apollo Hospital</div>
                <div className="partner-logo"><FaShieldAlt className="partner-icon" /> Max Life Insurance</div>
                <div className="partner-logo"><FaHospitalSymbol className="partner-icon" /> Fortis Healthcare</div>
                <div className="partner-logo"><FaShieldAlt className="partner-icon" /> HDFC ERGO</div>
                <div className="partner-logo"><FaHospitalSymbol className="partner-icon" /> Religare Health</div>
                <div className="partner-logo"><FaShieldAlt className="partner-icon" /> ICICI Lombard</div>
                <div className="partner-logo"><FaHospitalSymbol className="partner-icon" /> Care Clinics</div>
                <div className="partner-logo"><FaShieldAlt className="partner-icon" /> Bajaj Allianz</div>
              </div>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section className="services-section" id="services">
          <div className="section-header">
            <span className="section-subtitle">Diagnostic Menus</span>
            <h2 className="section-title">
              Our Professional <span className="highlight">Medical Services</span>
            </h2>
          </div>

          <div ref={servicesGridRef} className="services-grid">
            <Card className="service-card">
              <div className="service-icon-wrapper"><MdBloodtype /></div>
              <h3 className="service-card-title">Blood Test</h3>
              <p className="service-card-desc">Complete blood counts, hemogram testing, and basic cellular analysis with NABL accuracy.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><GiMicroscope /></div>
              <h3 className="service-card-title">Pathology</h3>
              <p className="service-card-desc">Advanced microscopic slide analysis, tissue biopsies, and oncology panel investigations.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><FaNotesMedical /></div>
              <h3 className="service-card-title">Health Packages</h3>
              <p className="service-card-desc">Comprehensive preventative health profiles custom designed for every age group.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><FaHome /></div>
              <h3 className="service-card-title">Home Sample Collection</h3>
              <p className="service-card-desc">Hygienic and secure sample extraction at your doorstep by expert phlebotomists.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><FiActivity /></div>
              <h3 className="service-card-title">Full Body Checkup</h3>
              <p className="service-card-desc">Exhaustive review of liver, kidney, thyroid, heart, and metabolic parameters.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><TbReportAnalytics /></div>
              <h3 className="service-card-title">Diabetes Screening</h3>
              <p className="service-card-desc">Comprehensive HbA1c tests, fasting glucose, and insulin resistance diagnostics.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><FaHeartbeat /></div>
              <h3 className="service-card-title">Heart Health</h3>
              <p className="service-card-desc">Cardiac biomarkers, lipid counts, and specialized cardiovascular evaluations.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><FaVenus /></div>
              <h3 className="service-card-title">Women's Health</h3>
              <p className="service-card-desc">Dedicated panels examining hormone profiles, thyroid wellness, and bone density markers.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><FaUserShield /></div>
              <h3 className="service-card-title">Senior Citizen Package</h3>
              <p className="service-card-desc">Eldercare wellness checkups detailing arthritis screening, liver panel, and vitamin levels.</p>
            </Card>

            <Card className="service-card">
              <div className="service-icon-wrapper"><FaNotesMedical /></div>
              <h3 className="service-card-title">Vitamin Profile</h3>
              <p className="service-card-desc">Accurate quantification of Vitamin D, Vitamin B12, and vital serum elements.</p>
            </Card>
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section className="comparison-section" id="why-us">
          <div className="section-header">
            <span className="section-subtitle">Diagnostic Excellence</span>
            <h2 className="section-title">
              Why Choose <span className="highlight">Jaganath-Lab</span>
            </h2>
          </div>

          <div className="comparison-grid">
            <div ref={compLeftRef} className="comparison-card">
              <div className="comparison-header">
                <h3 className="comparison-title">Traditional Labs</h3>
                <span className="comparison-subtitle">Conventional diagnostic centers</span>
              </div>
              <ul className="comparison-list">
                <li className="comparison-item">
                  <FaTimes className="comparison-icon cross" />
                  <span>Long waiting times in crowded registration areas.</span>
                </li>
                <li className="comparison-item">
                  <FaTimes className="comparison-icon cross" />
                  <span>Manual report collection 24 to 48 hours after testing.</span>
                </li>
                <li className="comparison-item">
                  <FaTimes className="comparison-icon cross" />
                  <span>Semi-automated equipment with higher human error rates.</span>
                </li>
                <li className="comparison-item">
                  <FaTimes className="comparison-icon cross" />
                  <span>Inconvenient home sample collection timings.</span>
                </li>
                <li className="comparison-item">
                  <FaTimes className="comparison-icon cross" />
                  <span>No digital archive to track historic health records.</span>
                </li>
              </ul>
            </div>

            <div ref={compRightRef} className="comparison-card highlight-card">
              <div className="comparison-header">
                <h3 className="comparison-title">Jaganath-Lab</h3>
                <span className="comparison-subtitle">Modern premium healthcare model</span>
              </div>
              <ul className="comparison-list">
                <li className="comparison-item">
                  <FaCheck className="comparison-icon check" />
                  <span>Fast 60-second online test slot booking.</span>
                </li>
                <li className="comparison-item">
                  <FaCheck className="comparison-icon check" />
                  <span>NABL-certified reports via Email and WhatsApp in 6-12 hours.</span>
                </li>
                <li className="comparison-item">
                  <FaCheck className="comparison-icon check" />
                  <span>100% automated diagnostic platforms for 99.8% precision.</span>
                </li>
                <li className="comparison-item">
                  <FaCheck className="comparison-icon check" />
                  <span>Doorstep collection by expert pathologists at your preferred slot.</span>
                </li>
                <li className="comparison-item">
                  <FaCheck className="comparison-icon check" />
                  <span>Interactive dashboard with historic parameter charts.</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="timeline-section" id="process">
          <div className="section-header">
            <span className="section-subtitle">How it works</span>
            <h2 className="section-title">
              Our Precise <span className="highlight">Diagnostic Process</span>
            </h2>
          </div>

          <div ref={timelineSectionRef} className="timeline-outer-container">
            <div className="timeline-line">
              <div ref={progressBarRef} className="timeline-progress-bar"></div>
            </div>

            <div className="timeline-steps">
              <div
                ref={(el) => (timelineStepsRef.current[0] = el)}
                className="timeline-step"
              >
                <div className="timeline-node"><FaCalendarAlt /></div>
                <div className="timeline-info">
                  <h3 className="timeline-step-title">1. Book Test</h3>
                  <p className="timeline-step-desc">Select tests and schedule home collection slot.</p>
                </div>
              </div>

              <div
                ref={(el) => (timelineStepsRef.current[1] = el)}
                className="timeline-step"
              >
                <div className="timeline-node"><FaVial /></div>
                <div className="timeline-info">
                  <h3 className="timeline-step-title">2. Collection</h3>
                  <p className="timeline-step-desc">Phlebotomist extracts samples hygienically.</p>
                </div>
              </div>

              <div
                ref={(el) => (timelineStepsRef.current[2] = el)}
                className="timeline-step"
              >
                <div className="timeline-node"><GiMicroscope /></div>
                <div className="timeline-info">
                  <h3 className="timeline-step-title">3. Analysis</h3>
                  <p className="timeline-step-desc">Automated equipment screens the samples.</p>
                </div>
              </div>

              <div
                ref={(el) => (timelineStepsRef.current[3] = el)}
                className="timeline-step"
              >
                <div className="timeline-node"><FaAward /></div>
                <div className="timeline-info">
                  <h3 className="timeline-step-title">4. Verification</h3>
                  <p className="timeline-step-desc">Pathologists crosscheck the analysis results.</p>
                </div>
              </div>

              <div
                ref={(el) => (timelineStepsRef.current[4] = el)}
                className="timeline-step"
              >
                <div className="timeline-node"><FaFileMedical /></div>
                <div className="timeline-info">
                  <h3 className="timeline-step-title">5. Generation</h3>
                  <p className="timeline-step-desc">Detailed PDF report is securely compiled.</p>
                </div>
              </div>

              <div
                ref={(el) => (timelineStepsRef.current[5] = el)}
                className="timeline-step"
              >
                <div className="timeline-node"><FaCloudDownloadAlt /></div>
                <div className="timeline-info">
                  <h3 className="timeline-step-title">6. Delivery</h3>
                  <p className="timeline-step-desc">Get your NABL reports on email & WhatsApp.</p>
                </div>
              </div>

              <div
                ref={(el) => (timelineStepsRef.current[6] = el)}
                className="timeline-step"
              >
                <div className="timeline-node"><FaCheckDouble /></div>
                <div className="timeline-info">
                  <h3 className="timeline-step-title">7. Completed</h3>
                  <p className="timeline-step-desc">Consult specialists with your online reports.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="section-header">
            <span className="section-subtitle">Smart Health Features</span>
            <h2 className="section-title">
              Diagnostic Benefits <span className="highlight">For Patients</span>
            </h2>
          </div>

          <div ref={featuresGridRef} className="features-grid">
            <div className="feature-card">
              <FaLaptopMedical className="feature-icon" />
              <h3 className="feature-title">Online Booking</h3>
              <p className="feature-desc">Schedule any medical panel evaluation in less than a minute.</p>
            </div>

            <div className="feature-card">
              <FaFileDownload className="feature-icon" />
              <h3 className="feature-title">Digital Reports</h3>
              <p className="feature-desc">Receive highly legible, secure PDF results via WhatsApp and Email.</p>
            </div>

            <div className="feature-card">
              <FaTruck className="feature-icon" />
              <h3 className="feature-title">Home Collection</h3>
              <p className="feature-desc">Certified expert phlebotomists visit your home or workplace.</p>
            </div>

            <div className="feature-card">
              <FaUserMd className="feature-icon" />
              <h3 className="feature-title">Expert Pathologists</h3>
              <p className="feature-desc">Every diagnostic parameter is verified and signed by specialists.</p>
            </div>

            <div className="feature-card">
              <FaAward className="feature-icon" />
              <h3 className="feature-title">Certified Equipment</h3>
              <p className="feature-desc">Automated, NABL-compliant processing centers for full precision.</p>
            </div>

            <div className="feature-card">
              <FaRegMoneyBillAlt className="feature-icon" />
              <h3 className="feature-title">Affordable Packages</h3>
              <p className="feature-desc">Save up to 50% on family wellness screenings.</p>
            </div>

            <div className="feature-card">
              <FaRunning className="feature-icon" />
              <h3 className="feature-title">Fast Results</h3>
              <p className="feature-desc">Quick turnaround guarantees same-day report compilation.</p>
            </div>

            <div className="feature-card">
              <FaChartLine className="feature-icon" />
              <h3 className="feature-title">Health Dashboard</h3>
              <p className="feature-desc">Visualize historical health stats with our smart interface charts.</p>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="testimonial-section" id="testimonials">
          <div className="section-header">
            <span className="section-subtitle">Reviews</span>
            <h2 className="section-title">
              What Our <span className="highlight">Patients Say</span>
            </h2>
          </div>

          <div className="testimonial-container">
            <div className="testimonial-card-wrapper" ref={testimonialSliderRef}>
              <div className="testimonial-slide-card">
                <FaFileMedical className="testimonial-quote-icon" />
                <p className="testimonial-text">
                  "{testimonials[activeSlide].review}"
                </p>
                <div className="testimonial-stars" aria-label="5 stars rating">
                  {[...Array(testimonials[activeSlide].rating)].map((_, i) => (
                    <FaStar key={i} />
                  ))}
                </div>
                <div className="testimonial-profile">
                  <div className="testimonial-avatar-wrapper">
                    <img
                      className="testimonial-avatar"
                      src={testimonials[activeSlide].image}
                      alt={testimonials[activeSlide].name}
                    />
                  </div>
                  <div className="testimonial-info-text">
                    <span className="testimonial-name">{testimonials[activeSlide].name}</span>
                    <span className="testimonial-role">{testimonials[activeSlide].role}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => changeSlide(index)}
                  className={`testimonial-dot ${activeSlide === index ? 'active' : ''}`}
                  aria-label={`Go to slide ${index + 1}`}
                ></button>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="faq-section" id="faqs">
          <div className="section-header">
            <span className="section-subtitle">Got Questions?</span>
            <h2 className="section-title">
              Frequently Asked <span className="highlight">Questions</span>
            </h2>
          </div>

          <div ref={faqContainerRef} className="faq-container">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`faq-item ${openFaq === index ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="faq-header"
                  onClick={() => toggleFaq(index)}
                  aria-expanded={openFaq === index}
                >
                  <span className="faq-question">{faq.q}</span>
                  <span className="faq-icon-wrapper">
                    <FaChevronDown />
                  </span>
                </button>
                <div className="faq-content" style={{ maxHeight: openFaq === index ? '12.5rem' : '0rem' }}>
                  <p className="faq-answer">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="section-padding" id="cta-section">
          <div ref={ctaContainerRef} className="cta-gradient-card">
            <h2 className="section-title" style={{ color: 'var(--white)', marginBottom: '1rem' }}>
              Ready For Your Health Checkup?
            </h2>
            <p className="hero-desc" style={{ margin: '0 auto 2rem', color: 'rgba(255, 255, 255, 0.9)' }}>
              Book your diagnostic laboratory tests and home sample collection in minutes.
            </p>
            <div className="hero-ctas" style={{ justifyContent: 'center' }}>
              <Button variant="secondary">
                Book Appointment
              </Button>
              <Button variant="glass">
                <FaPhoneAlt style={{ marginRight: '0.5rem' }} /> Contact Us
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="footer-section">
        <div className="footer-container">
          <div className="footer-col">
            <a href="#" className="footer-logo">
              <GiMicroscope className="logo-icon" />
              Jaganath<span className="logo-text-highlight">-Lab</span>
            </a>
            <p className="footer-desc">
              Providing modern, premium diagnostic parameters, advanced biological screening, and precise reports compiled by expert pathologists.
            </p>
            <div className="footer-socials">
              <a href="https://facebook.com" className="social-icon-link" aria-label="Facebook"><FaFacebookF /></a>
              <a href="https://twitter.com" className="social-icon-link" aria-label="Twitter"><FaTwitter /></a>
              <a href="https://linkedin.com" className="social-icon-link" aria-label="LinkedIn"><FaLinkedinIn /></a>
              <a href="https://instagram.com" className="social-icon-link" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>

          <div className="footer-col">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Home</a></li>
              <li><a href="#services" className="footer-link">Services</a></li>
              <li><a href="#why-us" className="footer-link">Why Choose Us</a></li>
              <li><a href="#process" className="footer-link">Process</a></li>
              <li><a href="#testimonials" className="footer-link">Testimonials</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-title">Diagnostic Services</h3>
            <ul className="footer-links">
              <li><a href="#services" className="footer-link">Blood Counts</a></li>
              <li><a href="#services" className="footer-link">Pathology Panels</a></li>
              <li><a href="#services" className="footer-link">Preventive Package</a></li>
              <li><a href="#services" className="footer-link">Diabetes screening</a></li>
              <li><a href="#services" className="footer-link">Cardiac Biomarkers</a></li>
            </ul>
          </div>

          <div className="footer-col">
            <h3 className="footer-title">Contact Info</h3>
            <ul className="footer-contact-list">
              <li className="footer-contact-item">
                <FaMapMarkerAlt className="contact-icon" />
                <span>102 Diagnostic Plaza, Science City Road, Ahmedabad, India</span>
              </li>
              <li className="footer-contact-item">
                <FaPhoneAlt className="contact-icon" />
                <span>+91 79 4000 1234<br />+91 98765 43210</span>
              </li>
              <li className="footer-contact-item">
                <FaEnvelope className="contact-icon" />
                <span>support@jaganathlab.com<br />reports@jaganathlab.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} Jaganath-Lab. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#" className="footer-bottom-link">Privacy Policy</a>
            <a href="#" className="footer-bottom-link">Terms & Conditions</a>
            <a href="#" className="footer-bottom-link">NABL Guidelines</a>
          </div>
        </div>
      </footer>
    </>
  );
}

export default LandingPage;
