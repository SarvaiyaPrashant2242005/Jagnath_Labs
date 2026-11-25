import React from 'react';
import { BACKEND_ROOT_URL } from '../../../shared/services/apiEndpoints';
import { sanitizeSamplingParamName } from '../../../shared/utils/parameterDisplayUtils';

/**
 * Resolves standard dynamic logo URL for TRF with fallback
 */
export const resolveTRFLogoUrl = (company, customLogoUrl) => {
  if (customLogoUrl) return customLogoUrl;
  if (!company) return '/Images/Navbar_Logo.png';
  const rawLogo = company.test_request_logo || company.testRequestLogo || company.logo || '/Images/Navbar_Logo.png';
  if (!rawLogo) return '/Images/Navbar_Logo.png';
  if (rawLogo.startsWith('http://') || rawLogo.startsWith('https://') || rawLogo.startsWith('/Images/') || rawLogo.startsWith('/images/')) {
    return rawLogo;
  }
  const cleanPath = rawLogo.replace(/\\/g, '/');
  const idx = cleanPath.lastIndexOf('uploads/');
  if (idx !== -1) {
    return `${BACKEND_ROOT_URL}/${cleanPath.substring(idx)}`;
  }
  return `${BACKEND_ROOT_URL}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

/**
 * Reusable Header Table across Page 1 and Page 2
 */
export const TRFHeaderTable = ({ logoUrl }) => (
  <table
    className="trf-header-table"
    style={{
      width: '100%',
      borderCollapse: 'collapse',
      border: '1.2px solid #000000',
      marginBottom: '6px',
      tableLayout: 'fixed'
    }}
  >
    <tbody>
      <tr>
        {/* Dynamic Logo Cell */}
        <td
          style={{
            width: '40%',
            height: '74px',
            border: '1.2px solid #000000',
            padding: '2px 6px',
            verticalAlign: 'middle',
            textAlign: 'center',
            boxSizing: 'border-box'
          }}
        >
          <img
            src={logoUrl}
            alt="Jagnath Lab Technologies"
            style={{
              maxHeight: '68px',
              maxWidth: '100%',
              width: 'auto',
              height: 'auto',
              objectFit: 'contain',
              display: 'block',
              margin: '0 auto'
            }}
            onError={(e) => { e.target.src = '/Images/Navbar_Logo.png'; }}
          />
        </td>

        {/* Center Title: FORMATS */}
        <td
          style={{
            width: '32%',
            border: '1.2px solid #000000',
            textAlign: 'center',
            verticalAlign: 'middle',
            padding: '4px'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '1.45rem',
              fontWeight: 800,
              letterSpacing: '2px',
              color: '#000000',
              fontFamily: '"Times New Roman", Times, serif'
            }}
          >
            FORMATS
          </h2>
        </td>

        {/* Right Info Table */}
        <td
          style={{
            width: '28%',
            border: '1.2px solid #000000',
            padding: 0,
            verticalAlign: 'middle'
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.74rem',
              fontFamily: '"Times New Roman", Times, serif',
              lineHeight: 1.25
            }}
          >
            <tbody>
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #000000', fontWeight: 'bold', width: '56%' }}>Amendment No.</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>00</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Amendment Date</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>--</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Issue No.</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>01</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Issue Date</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>01/09/2018</td>
              </tr>
              <tr>
                <td style={{ padding: '2.5px 5px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>Format No.</td>
                <td style={{ padding: '2.5px 5px', textAlign: 'center' }}>7.1 F-01</td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
);

/**
 * Reusable Footer Table and Letterhead Contact Information
 */
export const TRFFooterSection = ({ pageNumber = 1, totalPages = 2, marginTop = '6px' }) => (
  <div className="trf-document-info-box" style={{ marginTop, paddingTop: '2px', paddingBottom: '2px', width: '100%', pageBreakInside: 'avoid', breakInside: 'avoid' }}>
    {/* Doc / Quality System Table */}
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        border: '1.2px solid #000000',
        fontSize: '0.72rem',
        fontFamily: '"Times New Roman", Times, serif',
        marginBottom: '2px',
        lineHeight: 1.2
      }}
    >
      <tbody>
        <tr>
          <td style={{ width: '38%', padding: '1.5px 5px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', fontWeight: 600 }}>
            Doc No: JLT/ 7.1 F-01
          </td>
          <td style={{ width: '34%', padding: '2px 5px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000' }}></td>
          <td style={{ width: '28%', padding: '2px 5px', borderBottom: '1px solid #000000', textAlign: 'right', fontWeight: 600 }}>
            Page {pageNumber} of {totalPages}
          </td>
        </tr>
        <tr>
          <td style={{ padding: '2px 5px', borderRight: '1px solid #000000', borderBottom: '1px solid #000000', fontWeight: 600 }}>
            Format No. 7.1 F-01
          </td>
          <td colSpan={2} style={{ padding: '2px 5px', borderBottom: '1px solid #000000', fontWeight: 600 }}>
            Format: Test Request Form (Water & Waste Water)
          </td>
        </tr>
        <tr>
          <td style={{ padding: '2px 5px', borderRight: '1px solid #000000', fontWeight: 600 }}>
            Prepared By: TM
          </td>
          <td style={{ padding: '2px 5px', borderRight: '1px solid #000000', fontWeight: 600 }}>
            Approved By: QM
          </td>
          <td style={{ padding: '2px 5px', fontWeight: 600 }}>
            Issue By/Reviewed By: TM
          </td>
        </tr>
      </tbody>
    </table>

    {/* Official Jagnath Labs Letterhead Contact Footer (Right-Aligned) */}
    <div
      className="letterhead-footer-section"
      style={{
        fontFamily: 'sans-serif',
        fontSize: '0.70rem',
        paddingTop: '2px',
        paddingBottom: '2px',
        width: '100%'
      }}
    >
      {/* Address & Contact Columns Right-Aligned */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          gap: '24px',
          flexWrap: 'wrap',
          marginLeft: 'auto',
          marginBottom: '3px'
        }}
      >
        {/* Address Column */}
        <div style={{ color: '#047857', fontWeight: 600, lineHeight: 1.35, textAlign: 'left' }}>
          <div>📍 5-6/B, Nayanjyot Chambers,</div>
          <div style={{ paddingLeft: '16px' }}>First Floor, Opp. Vachhera Vada,</div>
          <div style={{ paddingLeft: '16px' }}>Gondal-360 311. Dist. : Rajkot. (Guj.)</div>
        </div>

        {/* Contact Details Column */}
        <div style={{ color: '#047857', fontWeight: 600, lineHeight: 1.35, textAlign: 'left' }}>
          <div>✉ jagnathtechnologies@yahoo.com</div>
          <div>🌐 www.jagnath.com</div>
          <div>📞 +91 8140 5555 15</div>
        </div>
      </div>

      {/* Green Horizontal Separator */}
      <div style={{ borderTop: '1.2px solid #059669', margin: '3px 0 2px 0' }} />

      {/* GPCB Schedule-II Auditors Tagline Right-Aligned */}
      <div
        style={{
          textAlign: 'right',
          fontSize: '0.76rem',
          fontWeight: 'bold',
          color: '#1e3a8a',
          letterSpacing: '0.2px'
        }}
      >
        Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
      </div>
    </div>
  </div>
);

/**
 * Unified TestRequestDocument Component
 * Renders Page 1 and Page 2 pixel-perfect according to reference specification
 */
export const TestRequestDocument = ({
  formData = {},
  company = {},
  client = {},
  category = {},
  parameters = [],
  checkedParameters = null,
  caution = null,
  isPrintMode = false,
  customLogoUrl = null,
  containerStyle = {}
}) => {
  const logoUrl = resolveTRFLogoUrl(company, customLogoUrl);

  const displayLocations = React.useMemo(() => {
    const locSet = new Set();
    if (formData.locationOfSample) locSet.add(formData.locationOfSample);
    (parameters || []).forEach(p => {
      if (p.locationOfSample) locSet.add(p.locationOfSample);
    });
    return Array.from(locSet).filter(Boolean).join(', ') || formData.locationOfSample || 'N/A';
  }, [formData.locationOfSample, parameters]);

  const rawTitle = formData.formTitle || 'WATER & WASTE WATER';
  const cleanTitle = rawTitle.replace(/^TEST REQUEST FORM FOR /i, '').trim();

  // Determine parameters to display and whether a second page is required
  const displayParameters = React.useMemo(() => {
    if (!parameters || parameters.length === 0) return [];
    if (checkedParameters !== null && typeof checkedParameters === 'object') {
      const filtered = parameters.filter(p => {
        const pId = p.id || p.parameterId || p.parameter_id;
        return !!checkedParameters[pId];
      });
      return filtered;
    }
    return parameters.filter(p => !!(p.parameterName || p.name || p.parameter?.parameterName));
  }, [parameters, checkedParameters]);

  const hasCaution = !!((formData.includeCaution || formData.include_caution) && caution);
  const hasSecondPage = displayParameters.length > 0 || hasCaution;
  const totalPages = hasSecondPage ? 2 : 1;

  const sharedPageStyle = {
    width: '100%',
    maxWidth: isPrintMode ? '210mm' : '210mm',
    minHeight: isPrintMode ? 'auto' : '297mm',
    height: 'auto',
    display: 'flex',
    flexDirection: 'column',
    boxSizing: 'border-box',
    padding: '4mm 12mm 3mm 12mm',
    backgroundColor: '#ffffff',
    fontFamily: '"Times New Roman", Times, serif',
    color: '#000000',
    lineHeight: 1.25,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: isPrintMode ? 'none' : '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
    border: isPrintMode ? 'none' : '1px solid #e2e8f0',
    borderRadius: isPrintMode ? '0' : '8px',
    margin: '0 auto',
    ...containerStyle
  };

  return (
    <div className="trf-document-wrapper" style={{ width: '100%', display: isPrintMode ? 'block' : 'flex', flexDirection: 'column', gap: isPrintMode ? '0' : '2rem' }}>

      {/* ================================= PAGE 1 ================================= */}
      <div
        className="trf-page-container letterhead-sheet"
        style={{
          ...sharedPageStyle,
          pageBreakAfter: hasSecondPage ? 'always' : 'auto',
          breakAfter: hasSecondPage ? 'page' : 'auto'
        }}
      >
        {/* Centered Watermark Layer */}
        <img
          src="/images/letterpad_watermark.png"
          alt="Watermark"
          className="letterhead-watermark"
          style={{
            position: 'absolute',
            left: '-30px',
            top: '50%',
            bottom: 'auto',
            transform: 'translateY(-50%)',
            width: '470px',
            maxWidth: '58%',
            height: 'auto',
            objectFit: 'contain',
            opacity: 0.88,
            mixBlendMode: 'multiply',
            pointerEvents: 'none',
            userSelect: 'none',
            zIndex: 0
          }}
        />

        {/* Foreground Content Layer */}
        <div
          className="letterhead-content"
          style={{
            position: 'relative',
            zIndex: 1,
            width: '100%',
            height: isPrintMode ? 'auto' : '100%',
            flexGrow: isPrintMode ? 0 : 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header Table */}
          <TRFHeaderTable logoUrl={logoUrl} />

          {/* Document Title Bar */}
          <div
            style={{
              textAlign: 'center',
              fontWeight: 800,
              fontSize: '0.90rem',
              letterSpacing: '0.3px',
              textDecoration: 'underline',
              margin: '3px 0 5px 0'
            }}
          >
            TEST REQUEST FORM FOR {cleanTitle || 'PaniPuri'}
          </div>

          {/* Main Form Table */}
          <table
            className="trf-main-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              border: '1.2px solid #000000',
              fontSize: '0.70rem',
              fontFamily: '"Times New Roman", Times, serif',
              tableLayout: 'fixed',
              lineHeight: 1.25
            }}
          >
            <colgroup>
              <col style={{ width: '20%' }} />
              <col style={{ width: '2%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '2%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '2%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>
            <tbody>
              {/* Row 1: Company / Customer */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Name of Company/<br />Customer</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={7} style={{ padding: '2px 5px', fontWeight: 600 }}>
                  {company.companyName || company.company_name || ''} {client.clientName ? `- ${client.clientName}` : ''}
                </td>
              </tr>

              {/* Row 2: Address */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Address for<br />Communication</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={7} style={{ padding: '2px 5px' }}>
                  {formData.address || client.plantAddress || client.officeAddress || 'N/A'}
                </td>
              </tr>

              {/* Row 3: Email ID & Location */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Email ID</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={4} style={{ padding: '2px 5px', borderRight: '1px solid #000000' }}>
                  {formData.email || client.email || 'N/A'}
                </td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Location of Sample</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{displayLocations}</td>
              </tr>

              {/* Row 4: Contact Person & Contact No */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Contact Person</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={4} style={{ padding: '2px 5px', borderRight: '1px solid #000000' }}>
                  {formData.contactPerson || client.contactPerson || 'N/A'}
                </td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Contact No.</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{formData.contactNumber || client.mobile || client.phone || 'N/A'}</td>
              </tr>

              {/* Row 5: Date of Collection & Date of Receipt */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Date of Collection of<br />Sample</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={4} style={{ padding: '2px 5px', borderRight: '1px solid #000000' }}>
                  {formData.dateOfCollection || 'N/A'}
                </td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Date of Receipt of<br />Sample</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{formData.dateOfReceipt || 'N/A'}</td>
              </tr>

              {/* Row 6: Sample Collected By & Sample Quantity */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Sample Collected By</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={4} style={{ padding: '2px 5px', borderRight: '1px solid #000000' }}>
                  {formData.sampleCollectedBy || 'N/A'}
                </td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Sample Quantity</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{formData.sampleQuantity || 'N/A'}</td>
              </tr>

              {/* Row 7: Field Data Sheet, Form Type & Packing Details */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Field Data Sheet</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 4px', borderRight: '1px solid #000000' }}>{formData.fieldDataSheet || 'Available'}</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Form Type</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 4px', borderRight: '1px solid #000000' }}>{formData.formType || 'Regular'}</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Packing details</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{formData.packingDetails || 'glass bottel'}</td>
              </tr>

              {/* Row 8: Sample ID No. & Report No. */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Sample ID No.</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={4} style={{ padding: '2px 5px', borderRight: '1px solid #000000', fontWeight: 'bold' }}>
                  {formData.sampleIdNumber || 'N/A'}
                </td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Report No.</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', fontSize: '0.68rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>{formData.reportNumber || 'N/A'}</td>
              </tr>

              {/* Row 9: Sample Particular */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Sample Particular</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={7} style={{ padding: '2px 5px' }}>{formData.sampleParticular || 'N/A'}</td>
              </tr>

              {/* Row 10: Availability of Equipments & Reference Standards */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Availability of<br />Equipments</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 4px', borderRight: '1px solid #000000' }}>{formData.equipmentAvailable || 'Available'}</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Availability of<br />reference standards</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 4px', borderRight: '1px solid #000000' }}>{formData.referenceStandardAvailable || 'Available'}</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Adequacy of sample<br />quantity</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{formData.adequacyOfSample || 'Adequate'}</td>
              </tr>

              {/* Row 11: Availability of Test Method & Trained Person */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Availability of<br />Test method</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 4px', borderRight: '1px solid #000000' }}>{formData.testMethodAvailable || 'Available'}</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Availability of<br />Trained person</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 4px', borderRight: '1px solid #000000' }}>{formData.trainedPersonAvailable || 'Available'}</td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Tentative Days of<br />Issuing the Report</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{formData.tentativeDays || '15-20 Days'}</td>
              </tr>

              {/* Row 12: Sample testing facility reviewed by */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Sample testing facility<br />reviewed by</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={7} style={{ padding: '2px 5px', fontWeight: 'bold' }}>
                  {formData.facilityReviewedBy || 'Quality Manager/Technical Manager'}
                </td>
              </tr>

              {/* Row 13: Signatures Area */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none', verticalAlign: 'top', height: '35px' }}>
                  Signature of Customer<br />Representative
                </td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000', verticalAlign: 'top' }}>:</td>
                <td colSpan={4} style={{ padding: '2px 5px', borderRight: '1px solid #000000', verticalAlign: 'middle' }}>
                  {formData.customerSignature ? (
                    <img src={formData.customerSignature} alt="Customer Sig" style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
                  ) : null}
                </td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none', verticalAlign: 'top' }}>
                  Signature of Sample<br />Received By
                </td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000', verticalAlign: 'top' }}>:</td>
                <td style={{ padding: '2px 5px', verticalAlign: 'middle' }}>
                  {formData.receiverSignature ? (
                    <img src={formData.receiverSignature} alt="Receiver Sig" style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
                  ) : null}
                </td>
              </tr>

              {/* Row 14: Names and Designations */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Name & Designation of<br />Customer</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td colSpan={4} style={{ padding: '2px 5px', borderRight: '1px solid #000000' }}>
                  {formData.customerRepresentativeName || 'prashant'}
                </td>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none' }}>Name & Designation<br />of Sample Received</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000' }}>:</td>
                <td style={{ padding: '2px 5px' }}>{formData.sampleReceiverName || 'pasyo'}</td>
              </tr>

              {/* Row 15: Test Protocol */}
              <tr style={{ borderBottom: '1px solid #000000' }}>
                <td style={{ padding: '2px 4px', fontWeight: 'bold', borderRight: 'none', verticalAlign: 'top' }}>Test Protocol / method<br />to be adopted</td>
                <td style={{ padding: '2px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000', verticalAlign: 'top' }}>:</td>
                <td colSpan={7} style={{ padding: '2px 5px', whiteSpace: 'pre-line' }}>
                  {formData.testProtocol || `Ground Water/Surface Water/Drinking Water: APHA 23rd Edition 2017\nWaste Water: APHA 23rd Edition 2017`}
                </td>
              </tr>

              {/* Row 16: Remarks */}
              <tr>
                <td style={{ padding: '1.5px 4px', fontWeight: 'bold', borderRight: 'none', verticalAlign: 'top' }}>Remarks</td>
                <td style={{ padding: '1.5px 0', textAlign: 'center', fontWeight: 'bold', borderRight: '1px solid #000000', verticalAlign: 'top' }}>:</td>
                <td colSpan={7} style={{ padding: '2px 5px', fontSize: '0.65rem', lineHeight: 1.22 }}>
                  <ol style={{ margin: 0, paddingLeft: '1.1rem' }}>
                    <li>Please mention specific tests to be applied</li>
                    <li>All the test procedures are followed as per National & International Standards.</li>
                    <li>In case of sampling conducted by JLT, sampling plan is followed as per National & International Standards.</li>
                    <li>If due to any unavoidable or unforeseen condition, the testing will be sub contracted only to competent agencies that comply with ISO/IEC 17025:2017(NABL) requirements</li>
                  </ol>
                  {formData.remarks ? (
                    <div style={{ marginTop: '2px', fontWeight: 'bold' }}>Additional: {formData.remarks}</div>
                  ) : null}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Footer Section Page 1 */}
          <TRFFooterSection pageNumber={1} totalPages={totalPages} />
        </div>
      </div>

      {/* ================================= PAGE 2 ================================= */}
      {hasSecondPage && (
        <div
          className="trf-page-container letterhead-sheet"
          style={{
            ...sharedPageStyle,
            pageBreakAfter: 'auto',
            breakAfter: 'auto'
          }}
        >
          {/* Centered Watermark Layer */}
          <img
            src="/images/letterpad_watermark.png"
            alt="Watermark"
            className="letterhead-watermark"
            style={{
              position: 'absolute',
              left: '-30px',
              top: '50%',
              bottom: 'auto',
              transform: 'translateY(-50%)',
              width: '470px',
              maxWidth: '58%',
              height: 'auto',
              objectFit: 'contain',
              opacity: 0.88,
              mixBlendMode: 'multiply',
              pointerEvents: 'none',
              userSelect: 'none',
              zIndex: 0
            }}
          />

          {/* Foreground Content Layer */}
          <div
            className="letterhead-content"
            style={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              height: isPrintMode ? 'auto' : '100%',
              flexGrow: isPrintMode ? 0 : 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header Table (Repeated exactly) */}
            <TRFHeaderTable logoUrl={logoUrl} />

            {/* Page 2 Section Title */}
            <div style={{ marginTop: '2px', marginBottom: '4px' }}>
              <div style={{ fontWeight: 800, fontSize: '0.80rem' }}>
                Test Parameter to Be Analyzed: -
              </div>
              <div style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {category.name || formData.categoryName || 'AMBIENT AIR'}
              </div>
            </div>

            {/* Parameters Table (20 Fixed Rows matching reference) */}
            <table
              className="trf-param-table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1.2px solid #000000',
                fontSize: '0.74rem',
                fontFamily: '"Times New Roman", Times, serif',
                lineHeight: 1.2
              }}
            >
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ width: '8%', padding: '3px 2px', border: '1px solid #000000', textAlign: 'center', fontWeight: 'bold' }}>Sr. No.</th>
                  <th style={{ width: '42%', padding: '3px 6px', border: '1px solid #000000', textAlign: 'center', fontWeight: 'bold' }}>Test Parameters</th>
                  <th style={{ width: '10%', padding: '3px 2px', border: '1px solid #000000', textAlign: 'center', fontWeight: 'bold' }}>Tick √</th>
                  <th style={{ width: '40%', padding: '3px 6px', border: '1px solid #000000', textAlign: 'center', fontWeight: 'bold' }}>Test Method</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: Math.max(20, displayParameters.length) }).map((_, i) => {
                  const param = displayParameters[i];
                  const pName = param ? sanitizeSamplingParamName(param.parameterName || param.name || param.parameter?.parameterName || '') : '';
                  const pLoc = param?.locationOfSample ? ` [${param.locationOfSample}]` : '';
                  const displayName = pName ? `${pName}${pLoc}` : '';
                  const pMethod = param ? (param.testMethod || param.defaultTestMethod || param.test_method || '') : '';
                  const isChecked = checkedParameters !== null
                    ? (param ? !!checkedParameters[param.id] : false)
                    : (param && pName ? true : false);

                  return (
                    <tr key={i} style={{ height: '18px' }}>
                      <td style={{ textAlign: 'center', border: '1px solid #000000', padding: '1px 2px', fontSize: '0.72rem' }}>
                        {i + 1}.
                      </td>
                      <td style={{ textAlign: 'left', border: '1px solid #000000', padding: '1px 6px', fontWeight: isChecked ? 600 : 'normal', fontSize: '0.72rem' }}>
                        {displayName}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000000', fontWeight: 'bold', padding: '1px 2px', fontSize: '0.85rem' }}>
                        {isChecked ? '√' : ''}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000000', padding: '1px 4px', fontSize: '0.70rem' }}>
                        {pMethod}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Caution / Quotation Notice if enabled */}
            {(formData.includeCaution || formData.include_caution) && caution && (
              <div
                style={{
                  marginTop: '6px',
                  border: '1px solid #000000',
                  padding: '4px 8px',
                  fontSize: '0.72rem',
                  lineHeight: 1.3,
                  background: '#ffffff'
                }}
              >
                <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '2px' }}>
                  QUOTATION: {caution.title}
                </div>
                <div style={{ whiteSpace: 'pre-wrap', color: '#111' }}>
                  {caution.description}
                </div>
              </div>
            )}

            {/* Approved By Technical Manager */}
            <div
              className="trf-approved-by-section"
              style={{
                textAlign: 'right',
                marginTop: '8px',
                marginBottom: '4px',
                fontWeight: 'bold',
                fontSize: '0.82rem',
                paddingRight: '12px',
                fontFamily: '"Times New Roman", Times, serif'
              }}
            >
              <div>Approved By</div>
              <div style={{ marginTop: '2px' }}>Technical Manager</div>
            </div>

            {/* Footer Section Page 2 */}
            <TRFFooterSection pageNumber={2} totalPages={totalPages} />
          </div>
        </div>
      )}

    </div>
  );
};

export default TestRequestDocument;
