import React from "react";
import Navbar from "../components/Navbar";

const HelpCenter = ({ auth_token }) => {
  const faqs = [
    {
      question: "How do I start using EagleView?",
      answer: "Sign up with your email, authenticate with your token, and explore our stock analysis tools under the Watchlist section."
    },
    {
      question: "What is the auth_token used for?",
      answer: "The auth_token authenticates your session, granting access to premium features and personalized insights."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50  text-gray-900 font-sans">
      <Navbar token={auth_token}/>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-600 mb-8 text-center mt-5">Help Center</h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          Get support and answers to common questions about EagleView.
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900 mb-6">Frequently Asked Questions</h2>
          {faqs.map((faq, index) => (
            <div key={index} className="mb-4">
              <h3 className="text-xl font-medium text-gray-800">{faq.question}</h3>
              <p className="text-gray-600 mt-2">{faq.answer}</p>
            </div>
          ))}
          <div className="mt-8">
            <h3 className="text-xl font-medium text-gray-800 mb-2">Need More Help?</h3>
            <p className="text-gray-600">
              Contact our support team at <a href="mailto:support@eagleview.com" className="text-yellow-500 hover:text-yellow-600">support@eagleview.com</a> or visit our <a href="/contact-us" className="text-yellow-500 hover:text-yellow-600">Contact Us</a> page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;