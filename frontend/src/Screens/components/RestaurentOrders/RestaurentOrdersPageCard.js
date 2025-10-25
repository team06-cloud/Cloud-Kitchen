import React, { memo, useState } from "react";
import "../../styles/RestaurentOrdersPage.css";

const RestaurentOrdersPageCard = ({ item }) => {
  const [selectedState, setSelectedState] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleStateChange = (event) => {
    const selectedState = event.target.value;
    setSelectedState(selectedState);
  };

  const handleStateSubmit = async () => {
    if (!selectedState) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(
        "https://foodiii.onrender.com/api/UpdateState",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: localStorage.getItem("userEmail"),
            id: item._id,
            Selected_State: selectedState,
          }),
        }
      );

      if (response.ok) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error updating order state:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to truncate order ID
  const shortenOrderId = (id) => {
    if (!id) return "";
    return id.length > 8 ? `${id.substring(0, 8)}...` : id;
  };

  return (
    <div className="restaurant-order-card">
      <div className="order-card-header">
        <div className="order-time">
          {item.formattedTime || "Time not available"}
        </div>
        <div className="order-id">ID: {shortenOrderId(item._id)}</div>
      </div>

      <div className="order-card-image">
        <img src={item.order.img} alt={`${item.order.name}`} />
      </div>

      <div className="order-card-details">
        <h3 className="order-item-name">{item.order.name}</h3>

        <div className="details-grid">
          <div className="detail-item">
            <span className="detail-label">Quantity</span>
            <span className="detail-value">{item.order.qty}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Size</span>
            <span className="detail-value">{item.order.size}</span>
          </div>

          <div className="detail-item">
            <span className="detail-label">Price</span>
            <span className="detail-value price">₹{item.order.price}</span>
          </div>
        </div>

        <div className="customer-info">
          <h4>Customer Details</h4>
          <div className="customer-details">
            <div className="customer-detail">
              <span className="customer-label">Mobile</span>
              <span className="customer-value">
                {item.MobileNo || "Not provided"}
              </span>
            </div>
            <div className="customer-detail">
              <span className="customer-label">Email</span>
              <span className="customer-value email">
                {item.email || "Not provided"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="order-card-actions">
        <div className="state-control">
          <label htmlFor="order-state">Update Status</label>
          <select
            id="order-state"
            value={selectedState}
            onChange={handleStateChange}
            className="state-select"
          >
            <option value="" disabled>
              Select Status
            </option>
            <option value="Cooking">Cooking</option>
            <option value="On The Way">On The Way</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <button
            className={`update-state-btn ${submitSuccess ? "success" : ""} ${
              isSubmitting ? "loading" : ""
            }`}
            onClick={handleStateSubmit}
            disabled={!selectedState || isSubmitting}
          >
            {isSubmitting
              ? "Updating..."
              : submitSuccess
              ? "Updated!"
              : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default memo(RestaurentOrdersPageCard);
