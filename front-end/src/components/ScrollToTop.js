import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force scroll to top of page with setTimeout to ensure it runs after render
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant" // Use "instant" instead of "smooth" for immediate effect
      });
      
      // Additional backup method - sometimes needed for certain layouts
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0; // For Safari
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
}

export default ScrollToTop;