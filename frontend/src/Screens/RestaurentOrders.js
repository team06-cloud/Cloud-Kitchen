// import "../Css/ragisterresturentpage.css";
import React, { useEffect, useState, memo } from "react";
import Navbar from "../Component/Navbar";
import "./styles/RestaurentOrdersPage.css";
import RestaurentOrdersPageCard from "./components/RestaurentOrders/RestaurentOrdersPageCard";

const RestaurentOrders = () => {
  const [data, setData] = useState([]);
  const [ordersByDate, setOrdersByDate] = useState(new Map());
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
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
    const fetchData = async () => {
      try {
        setLoading(true);
        let response = await fetch(
          "https://foodiii.onrender.com/api/getOrderOfMyresturant",
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }

        const jsonResponse = await response.json();
        setData(jsonResponse.data);

        const newOrdersByDate = new Map();
        jsonResponse.data.forEach((order) => {
          const date = formatDate(order.date);
          if (!newOrdersByDate.has(date)) {
            newOrdersByDate.set(date, []);
          }

          // Add formatted time to each order
          const orderWithTime = {
            ...order,
            formattedTime: formatTime(order.date),
          };

          newOrdersByDate.get(date).push(orderWithTime);
        });

        setOrdersByDate(newOrdersByDate);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="restaurant-orders-page">
      <div className="restaurant-orders-header">
        <Navbar />
        <div className="restaurant-orders-title-container">
          <div className="restaurant-orders-title">
            <h1>Restaurant Orders</h1>
            <p>Manage all incoming orders for your restaurant</p>
          </div>
        </div>
      </div>

      <div className="restaurant-orders-content">
        {loading ? (
          <div className="loading-container">
            <div className="loader-ring"></div>
            <h2>Loading orders...</h2>
          </div>
        ) : ordersByDate.size === 0 ? (
          <div className="no-orders-container">
            <div className="no-orders-icon">🍽️</div>
            <h2>No Orders Yet</h2>
            <p>New orders will appear here</p>
          </div>
        ) : (
          <div className="orders-by-date-container">
            {[...ordersByDate.keys()].map((date) => (
              <div key={date} className="order-date-section">
                <div className="date-heading">
                  <span>{date}</span>
                </div>
                <div className="orders-grid">
                  {ordersByDate.get(date).map((item, index) => (
                    <RestaurentOrdersPageCard key={index} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default memo(RestaurentOrders);
