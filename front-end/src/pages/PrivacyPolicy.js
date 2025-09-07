import React from "react";
import Navbar from "../components/Navbar";

const PrivacyPolicy = ({ auth_token }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50  text-gray-900 font-sans">
      <Navbar token={auth_token}/>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-600 mb-8 text-center mt-5">Privacy Policy</h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          Last Updated: April 27, 2025
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600">
              EagleView Analytics Ltd ("we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600">
              We collect personal information such as your name, email, and auth_token, as well as usage data to enhance your experience with EagleView's stock analysis tools.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600">
              Your data is used to provide personalized insights, improve our services, and comply with legal obligations. We do not sell your information to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">4. Your Rights</h2>
            <p className="text-gray-600">
              You have the right to access, correct, or delete your personal data. Contact us at <a href="mailto:privacy@eagleview.com" className="text-yellow-500 hover:text-yellow-600">privacy@eagleview.com</a> to exercise these rights.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600">
              We implement industry-standard security measures to protect your data, though no method is 100% secure. We continuously monitor and update our practices.
            </p>
          </section>
          <section>
            <h2 className="text-2xl font-semibold text-blue-900 mb-4">6. Changes to This Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy periodically. Changes will be posted here with an updated date. Your continued use constitutes acceptance of the revised policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;