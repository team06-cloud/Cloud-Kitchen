import "../../styles/HeroSection.css";
import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { TbHandClick } from "react-icons/tb";
import Navbar from "../../../Component/Navbar";

const HeroSection = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const sliderRef = useRef(null);
  const autoplayTimerRef = useRef(null);

  const heroImages = [
    "https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/775031/pexels-photo-775031.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "https://images.pexels.com/photos/769289/pexels-photo-769289.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
  ];

  useEffect(() => {
    setTimeout(() => {
      setTextVisible(true);
    }, 500);
  }, []);

  const goToSlide = (index) => {
    if (isAnimating || index === currentImageIndex) return;

    setIsAnimating(true);

    const currentSlider = sliderRef.current;
    const newSlide = document.createElement("div");
    newSlide.className = "hero-slide slide-enter-right";
    newSlide.style.backgroundImage = `url(${heroImages[index]})`;

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    newSlide.appendChild(overlay);

    currentSlider.appendChild(newSlide);

    setTimeout(() => {
      newSlide.classList.remove("slide-enter-right");
      document
        .querySelector(".hero-slide:first-child")
        .classList.add("slide-exit-left");
    }, 50);

    setTimeout(() => {
      currentSlider.removeChild(
        document.querySelector(".hero-slide:first-child")
      );
      newSlide.classList.remove("slide-enter-right");
      setCurrentImageIndex(index);
      setIsAnimating(false);
    }, 800);
  };

  useEffect(() => {
    autoplayTimerRef.current = setInterval(() => {
      const nextIndex = (currentImageIndex + 1) % heroImages.length;
      goToSlide(nextIndex);
    }, 5000);

    return () => {
      if (autoplayTimerRef.current) {
        clearInterval(autoplayTimerRef.current);
      }
    };
  }, [currentImageIndex, heroImages.length]);

  const handleIndicatorClick = (index) => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
    goToSlide(index);

    autoplayTimerRef.current = setInterval(() => {
      const nextIndex = (currentImageIndex + 1) % heroImages.length;
      goToSlide(nextIndex);
    }, 5000);
  };

  return (
    <div className="hero-section">
      <div className="hero-slider" ref={sliderRef}>
        <div
          className="hero-slide"
          style={{ backgroundImage: `url(${heroImages[currentImageIndex]})` }}
        >
          <div className="overlay"></div>
        </div>
      </div>

      <div className="navbar-placeholder">
        <Navbar />
      </div>

      <div className="hero-content">
        <div className={`text-container ${textVisible ? "text-visible" : ""}`}>
          <h1 className="hero-title">
            <span className="title-text">Cloud Kitchen</span>
            <span className="title-underline"></span>
          </h1>

          <h3 className="hero-subtitle">
            Delicious food delivered right to your doorstep
          </h3>

          <p className="hero-tagline">Fast • Fresh • Flavorful</p>

          <div className="hero-button">
            <Link to="/menu">
              <button className="cta-button">
                VIEW MENU{" "}
                <span className="icon">
                  <TbHandClick />
                </span>
                <span className="button-pulse"></span>
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
