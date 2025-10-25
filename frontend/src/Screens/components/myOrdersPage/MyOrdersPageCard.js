import "../../styles/MyOrderPage.css";

const MyOrdersPageCard = ({ item }) => {
  const getStatusClass = () => {
    const status = item.Order_State.toLowerCase();
    if (status === "delivered") return "status-delivered";
    if (status === "preparing") return "status-preparing";
    if (status === "on the way") return "status-on-way";
    if (status === "cancelled") return "status-cancelled";
    return "status-pending";
  };

  const getStatusIcon = () => {
    const status = item.Order_State.toLowerCase();
    if (status === "delivered") return "✓";
    if (status === "preparing") return "👨‍🍳";
    if (status === "on the way") return "🚚";
    if (status === "cancelled") return "✕";
    return "⏳"; 
  };

  return (
    <div className="order-card">
      <div className="order-card-header">
        <span className="order-time">
          {item.formattedTime || "Time not available"}
        </span>
        <div className={`order-status ${getStatusClass()}`}>
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{item.Order_State}</span>
        </div>
      </div>

      <div className="order-card-content">
        <div className="order-image">
          <img src={item.order.img} alt={item.order.name} />
        </div>

        <div className="order-details">
          <h3 className="order-item-name">{item.order.name}</h3>

          <div className="order-info-grid">
            <div className="order-info-row">
              <span className="info-label">Quantity</span>
              <span className="info-value">{item.order.qty}</span>
            </div>

            <div className="order-info-row">
              <span className="info-label">Size</span>
              <span className="info-value">{item.order.size}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="order-card-footer">
        <div className="order-price">
          <span className="price-label">Total</span>
          <span className="price-value">₹{item.order.price}</span>
        </div>

      </div>
    </div>
  );
};

export default MyOrdersPageCard;
