import React from "react";
import Navbar from "../components/Navbar";

const Blog = ({ auth_token }) => {
  const articles = [
    {
      title: "Top 5 Stock Market Trends for 2025",
      excerpt: "Explore the key trends shaping the stock market this year, from AI-driven analytics to green investments.",
      date: "April 20, 2025",
      link: "#"
    },
    {
      title: "How to Use EagleView for Portfolio Optimization",
      excerpt: "Learn how EagleView's tools can help you maximize returns with data-driven strategies.",
      date: "April 15, 2025",
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50  text-gray-900 font-sans">
      <Navbar token={auth_token}/>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-yellow-600 mb-8 text-center mt-5">EagleView Blog</h1>
        <p className="text-lg text-gray-600 mb-12 text-center">
          Stay informed with the latest market insights, investment tips, and EagleView updates.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {articles.map((article, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <h2 className="text-2xl font-semibold text-blue-900 mb-2">{article.title}</h2>
              <p className="text-gray-600 mb-4">{article.excerpt}</p>
              <div className="text-sm text-gray-500 mb-4">{article.date}</div>
              <a href={article.link} className="text-yellow-500 hover:text-yellow-600 font-medium">
                Read More
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Blog;