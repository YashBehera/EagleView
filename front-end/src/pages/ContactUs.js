import React, { useState, useRef } from "react";
import emailjs from "@emailjs/browser";
import Navbar from "../components/Navbar";

const ContactUs = ({ auth_token }) => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const form = useRef();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Replace with your EmailJS Service ID, Template ID, and Public Key
      const SERVICE_ID = "service_agql09f"; // e.g., service_xxxxxx
      const TEMPLATE_ID = "template_0x9ebnt"; // e.g., template_xxxxxx
      const PUBLIC_KEY = "nDT0IEQpOFbadOnJL"; // e.g., xxxxxxxxxxxxxxx
      const response = await emailjs.sendForm(
        SERVICE_ID,
        TEMPLATE_ID,
        form.current,
        PUBLIC_KEY
      );

      if (response.status === 200) {
        setSubmitted(true);
        setFormData({ name: "", email: "", message: "" }); // Reset form
      }
    } catch (err) {
      setError("Failed to send message. Please try again.");
      console.error("EmailJS error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
      <Navbar token={auth_token} />
      <div className="max-w-7xl mx-auto mt-5">
        <h1 className="text-4xl font-bold text-yellow-600 mb-8 text-center">Contact Us</h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          We’d love to hear from you! Reach out for support or inquiries.
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          {submitted ? (
            <div className="text-center text-green-600 font-medium">
              Thank you for your message! We will get back to you soon.
            </div>
          ) : (
            <form ref={form} onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-center text-red-600 font-medium">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="4"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-yellow-500 focus:border-yellow-500"
                  required
                />
              </div>
              <button
                type="submit"
                className={`w-full p-2 rounded-md transition-colors ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-yellow-600 hover:bg-yellow-700 text-white"
                }`}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </form>
          )}
          <div className="mt-6 text-center text-gray-600">
            Or email us at{" "}
            <a href="mailto:support@eagleview.com" className="text-yellow-500 hover:text-yellow-600">
              support@eagleview.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;