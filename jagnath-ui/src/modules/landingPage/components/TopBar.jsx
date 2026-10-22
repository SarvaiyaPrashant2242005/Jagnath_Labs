import React from 'react';
import { Phone, Mail, Clock, LogIn } from 'lucide-react';

export const TopBar = () => {
  return (
    <div className="jlt-topbar">
      <div className="jlt-container">
        <div className="jlt-topbar-inner">
          <div className="jlt-topbar-left">
            <a href="tel:+918140555515" className="jlt-topbar-item" title="Call Us">
              <Phone size={14} />
              <span>+91 8140 5555 15</span>
            </a>
            <a href="mailto:jagnathtechnologies@yahoo.com" className="jlt-topbar-item" title="Email Us">
              <Mail size={14} />
              <span>jagnathtechnologies@yahoo.com</span>
            </a>
          </div>

          <div className="jlt-topbar-right">
            <div className="jlt-topbar-item">
              <Clock size={14} />
              <span>Mon–Sat: 9:00 AM – 7:00 PM | Sun: Closed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
