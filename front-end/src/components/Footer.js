import React from "react";
import logo from "./logo1.jpg";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  };

  return (
    <footer className="bg-white text-gray-500 py-12 px-6 lg:px-8 border-t border-gray-200">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img
                src={logo}
                alt="EagleView Logo"
                className="h-20 w-20 rounded-full object-cover"
              />
              <span className="text-7xl font-sans text-gray-900">
                EagleView
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-md">
              Empowering investors with precision stock analysis and market
              insights to soar above the competition.
            </p>
            <div className="flex space-x-5 mb-8">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">X</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">LinkedIn</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-1.337-.255-2.453-1.799-2.453-1.805 0-2.201 1.325-2.201 2.696v5.361h-3v-11h2.879v1.359h.041c.525-.948 1.64-1.799 3.366-1.799 3.605 0 4.267 2.164 4.267 4.986v5.054z" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors">
                <span className="sr-only">YouTube</span>
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Columns */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">About EagleView</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Our Mission
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Team
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Careers
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Press
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Investment Tools</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Stock Analyzer
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Portfolio Tracker
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Market Scanner
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Valuation Calculator
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources & Support</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => handleNavigation("/blog")}
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Blog
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/help-center")}
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Help Center
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/contact-us")}
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation("/privacy-policy")}
                  className="text-sm hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <p className="text-xs text-gray-400">
              © 2024-2025 EagleView Analytics Ltd. All Rights Reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600 mr-6">
                Privacy Policy
              </a>
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600 mr-6">
                Terms of Use
              </a>
              <a href="#" className="text-xs text-gray-400 hover:text-gray-600">
                Legal
              </a>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-400 leading-relaxed">
            EagleView Analytics Ltd is not a registered broker, dealer, or
            investment adviser. Information on this platform is for educational
            purposes only and does not constitute investment advice. EagleView
            does not guarantee the accuracy, completeness, or timeliness of the
            data provided. Past performance is not indicative of future results.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;