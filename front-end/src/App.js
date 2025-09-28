import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Watchlist from "./pages/Watchlist";
import StockDetails from "./components/StockDetails";
import Screener from "./components/Screener";
import Subscription from "./components/Subscription";
import Blog from "./pages/Blog";
import HelpCenter from "./pages/HelpCenter";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Footer from "./components/Footer";
import Chat from "./components/chat";
import CompareStocks from "./components/CompareStocks";
import Profile from "./components/profile";
import Portfolio from "./components/Portfolio";
import ScrollToTop from "./components/ScrollToTop";
import MarketWatch from "./pages/MarketWatch";
import Gold from "./components/Gold";
import Tax from "./components/Tax";
import MarketView from "./components/MarketView";
import TradingView from "./components/TradingView";
export default function App() {
  const auth_token = "eyJ0eXAiOiJKV1QiLCJrZXlfaWQiOiJza192MS4wIiwiYWxnIjoiSFMyNTYifQ.eyJzdWIiOiI4TEFQNkgiLCJqdGkiOiI2ODNlOGI3ODVhMGZiMDZlNTdiOGEyZGIiLCJpc011bHRpQ2xpZW50IjpmYWxzZSwiaXNQbHVzUGxhbiI6ZmFsc2UsImlhdCI6MTc0ODkyOTQwMCwiaXNzIjoidWRhcGktZ2F0ZXdheS1zZXJ2aWNlIiwiZXhwIjoxNzQ4OTg4MDAwfQ.dICJMxZwRmVCBPOvYPRm_GMKT0WJSjc_FrfrFpm57Z0";

  return (
    <Router>
      <ScrollToTop />
      <div className="app-container">
        {/* <StockTicker auth_token={auth_token}/> */}
        <Routes>
          <Route path="/" element={<MarketView auth_token={auth_token} />} />
          <Route path="/blog" element={<Blog auth_token={auth_token} />} />
          <Route path="/help-center" element={<HelpCenter auth_token={auth_token} />} />
          <Route path="/contact-us" element={<ContactUs auth_token={auth_token} />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy auth_token={auth_token} />} />
          <Route path='/portfolio' element={<Portfolio auth_token={auth_token} />} />
          <Route path='/marketwatch' element={<MarketWatch auth_token={auth_token} />} />
          <Route path="/tax" element={<Tax auth_token={auth_token} />} />
          <Route path="/watchlist" element={<Watchlist auth_token={auth_token} />} />
          <Route path="/screener" element={<Screener auth_token={auth_token} />} />
          <Route path="/profile" element={<Profile auth_token={auth_token} />} />
          <Route path="/subscribe" element={<Subscription auth_token={auth_token} />} />
          <Route path="/comparestocks" element={<CompareStocks auth_token={auth_token} />} />
          <Route path="/:symbol" element={<StockDetails auth_token={auth_token} />} />
          <Route path="/digital-gold" element={<Gold auth_token={auth_token} />} />
          <Route path="/tradingview" element={<TradingView auth_token={auth_token} />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
      <Chat />
      <Footer />
    </Router>
  );
}