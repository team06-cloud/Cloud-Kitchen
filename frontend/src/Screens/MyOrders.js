import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Component/Navbar";
import "./styles/MyOrderPage.css";
import MyOrdersPageCard from "./components/myOrdersPage/MyOrdersPageCard";

const MyOrders = () => {
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState([]);
  const [ordersByDate, setOrdersByDate] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour12: true,
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  useEffect(() => {
    const fetchMyOrder = async () => {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        console.error("No auth token found");
        setLoading(false);
        navigate("/login");
        return;
      }

      try {
        setLoading(true);
        let response = await fetch(
          "https://foodiii.onrender.com/api/YourOrder",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify({
              email: localStorage.getItem("userEmail"),
            }),
          }
        );

        if (response.status === 403) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }

        const jsonResponse = await response.json();
        setOrderData(jsonResponse.myData);

        const newOrdersByDate = new Map();
        jsonResponse.myData.forEach((order) => {
          const date = formatDate(order.date);
          if (!newOrdersByDate.has(date)) {
            newOrdersByDate.set(date, []);
          }

          const orderWithTime = {
            ...order,
            formattedTime: formatTime(order.date),
          };

          newOrdersByDate.get(date).push(orderWithTime);
        });
        setOrdersByDate(newOrdersByDate);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyOrder();
  }, [navigate]);

  return (
    <div className="my-orders-page">
      <div className="my-orders-header">
        <Navbar />
        <div className="my-orders-title-container">
          <div className="my-orders-title">
            <h1>Your Order History</h1>
            <p>Track all your delicious meals from Foodiii</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader-ring"></div>
          <h2>Loading your orders...</h2>
        </div>
      ) : ordersByDate.size === 0 ? (
        <div className="no-orders-container">
          <div className="no-orders-icon">🍽️</div>
          <h2>No Orders Yet</h2>
          <p>Your order history will appear here</p>
          <button className="browse-menu-btn" onClick={() => navigate("/menu")}>
            Browse Menu
          </button>
        </div>
      ) : (
        <div className="orders-history-container">
          {[...ordersByDate.keys()].map((date) => (
            <div key={date} className="order-date-group">
              <div className="date-header">
                <span className="date-label">{date}</span>
              </div>
              <div className="order-cards-container">
                {ordersByDate.get(date).map((item, index) => (
                  <MyOrdersPageCard key={index} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
