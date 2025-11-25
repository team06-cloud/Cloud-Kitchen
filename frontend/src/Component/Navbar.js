import "../Css/Header.css";

import { Link, useNavigate } from "react-router-dom";
import { Badge } from "react-bootstrap-v5";
import Modal from "../Modal";
import Cart from "./Cart";
import { useCart } from "./ContextReducer";
import "../Css/Header.css";

import { useState, useEffect } from "react";
import { MdRestaurantMenu } from "react-icons/md";
import {
  FaBars,
  FaHome,
  FaCartArrowDown,
  FaUser,
  FaSignOutAlt,
  FaUtensils,
  FaClipboardList,
} from "react-icons/fa";
import { IoMdClose } from "react-icons/io";

const Navbar = () => {
  const [isToggle, setIsToggle] = useState(false);
  const [cartView, setCartView] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const data = useCart();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleMenu = () => setIsToggle(!isToggle);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authToken2");
    navigate("/login");
    setIsToggle(false);
  };

  const closeMenu = () => setIsToggle(false);

  return (
    <>
      <div className={`navbar-container ${scrolled ? "scrolled" : ""}`}>
        <div className="navbar-inner">
          <Link to="/" className="brand-logo">
            <span className="logo-text">Cloud Kitchen</span>
          </Link>

          <nav className="desktop-nav">
            <Link className="nav-link" to="/">
              <FaHome className="nav-icon" />
              <span>Home</span>
            </Link>
            <Link className="nav-link" to="/menu">
              <MdRestaurantMenu className="nav-icon" />
              <span>Menu</span>
            </Link>

            {!localStorage.getItem("authToken2") ? (
              <Link className="nav-link" to="/RagisterResturent">
                <FaUtensils className="nav-icon" />
                <span>Your Restaurant</span>
              </Link>
            ) : (
              <Link className="nav-link" to="/RestOrder">
                <FaClipboardList className="nav-icon" />
                <span>Restaurant Orders</span>
              </Link>
            )}

            {!localStorage.getItem("authToken") ? (
              <>
                <Link className="nav-link auth-link" to="/login">
                  Login
                </Link>
                <Link className="nav-link btn-signup" to="/Signup">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <Link className="nav-link" to="/myOrder">
                  <FaClipboardList className="nav-icon" />
                  <span>My Orders</span>
                </Link>

                <button className="nav-link logout-btn" onClick={handleLogout}>
                  <FaSignOutAlt className="nav-icon" />
                  <span>Log Out</span>
                </button>

                {data.length > 0 && (
                  <button
                    className="cart-btn"
                    onClick={() => setCartView(true)}
                  >
                    <FaCartArrowDown className="cart-icon" />
                    <span className="cart-text">Cart</span>
                    <Badge pill bg="light" className="cart-badge">
                      {data.length}
                    </Badge>
                  </button>
                )}
              </>
            )}
          </nav>

          <button
            className="toggle-btn"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            {isToggle ? <IoMdClose /> : <FaBars />}
          </button>
        </div>
      </div>

      <div className={`mobile-menu ${isToggle ? "show" : ""}`}>
        <div className="mobile-menu-container">
          <Link className="mobile-nav-link" to="/" onClick={closeMenu}>
            <FaHome className="mobile-nav-icon" />
            <span>Home</span>
          </Link>

          {!localStorage.getItem("authToken2") ? (
            <Link
              className="mobile-nav-link"
              to="/RagisterResturent"
              onClick={closeMenu}
            >
              <FaUtensils className="mobile-nav-icon" />
              <span>Your Restaurant</span>
            </Link>
          ) : (
            <Link
              className="mobile-nav-link"
              to="/RestOrder"
              onClick={closeMenu}
            >
              <FaClipboardList className="mobile-nav-icon" />
              <span>Restaurant Orders</span>
            </Link>
          )}

          {!localStorage.getItem("authToken") ? (
            <>
              <Link className="mobile-nav-link" to="/login" onClick={closeMenu}>
                <FaUser className="mobile-nav-icon" />
                <span>Login</span>
              </Link>
              <Link
                className="mobile-nav-link"
                to="/Signup"
                onClick={closeMenu}
              >
                <FaUser className="mobile-nav-icon" />
                <span>Sign up</span>
              </Link>
            </>
          ) : (
            <>
              <Link
                className="mobile-nav-link"
                to="/myOrder"
                onClick={closeMenu}
              >
                <FaClipboardList className="mobile-nav-icon" />
                <span>My Orders</span>
              </Link>

              <button
                className="mobile-nav-link logout-btn"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="mobile-nav-icon" />
                <span>Log Out</span>
              </button>

              {data.length > 0 && (
                <button
                  className="mobile-nav-link cart-link"
                  onClick={() => {
                    setCartView(true);
                    closeMenu();
                  }}
                >
                  <FaCartArrowDown className="mobile-nav-icon" />
                  <span>Cart</span>
                  <Badge pill bg="light" className="mobile-cart-badge">
                    {data.length}
                  </Badge>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {cartView && (
        <Modal onClose={() => setCartView(false)}>
          <Cart />
        </Modal>
      )}
    </>
  );
};

export default Navbar;
