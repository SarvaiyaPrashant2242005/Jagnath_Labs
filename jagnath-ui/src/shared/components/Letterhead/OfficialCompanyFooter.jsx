import React from 'react';

/**
 * OfficialCompanyFooter
 * Renders the professional Jagnath Labs / custom company letterhead footer:
 * - Address, email, website, phone
 * - Thin green horizontal separator
 * - Designation line: Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
 */
export const OfficialCompanyFooter = ({ company = {} }) => {
  const addressLine1 = company.address || '📍 5-6/B, Nayanjyot Chambers,';
  const addressLine2 = company.address ? `${company.city || ''} ${company.state || ''}`.trim() : 'First Floor, Opp. Vachhera Vada,';
  const addressLine3 = company.address ? '' : 'Gondal-360 311. Dist. : Rajkot. (Guj.)';

  const email = company.company_email || company.companyEmail || 'jagnathtechnologies@yahoo.com';
  const website = company.website || 'www.jagnath.com';
  const phone = company.contact_number || company.contactNumber || '+91 8140 5555 15';

  return (
    <div className="letterhead-footer-container">
      <div className="letterhead-footer-contact-row">
        {/* Left Column: Address */}
        <div className="letterhead-footer-address">
          <div>{addressLine1}</div>
          {addressLine2 && <div style={{ paddingLeft: addressLine3 ? '14px' : '0' }}>{addressLine2}</div>}
          {addressLine3 && <div style={{ paddingLeft: '14px' }}>{addressLine3}</div>}
        </div>

        {/* Right Column: Contact info */}
        <div className="letterhead-footer-contact">
          <div>✉ {email}</div>
          <div>🌐 {website}</div>
          <div>📞 {phone}</div>
        </div>
      </div>

      {/* Thin horizontal separator */}
      <div className="letterhead-footer-divider"></div>

      {/* Designation Line in dark blue/purple */}
      <div className="letterhead-footer-designation">
        Environment Consultant & Gujarat Pollution Control Board Schedule-II Auditors
      </div>
    </div>
  );
};

export default OfficialCompanyFooter;

