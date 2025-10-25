import { useCart, useDispatchCart } from "./ContextReducer";
import "../Css/Cart.css";
import { FaTrashAlt, FaCheck, FaShoppingBasket } from "react-icons/fa";

const Cart = () => {
  let data = useCart();
  let dispatch = useDispatchCart();

  let totalPrice = data.reduce((total, food) => total + food.price, 0);

  const handleCheckOut = async () => {
    let userEmail = localStorage.getItem("userEmail");

    try {
      let response = await fetch("https://foodiii.onrender.com/api/orderData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_data: data,
          email: userEmail,
          order_date: new Date().toDateString(),
        }),
      });

      if (response.status === 200) {
        dispatch({ type: "DROP" });
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    }
  };

  if (data.length === 0) {
    return (
      <div className="empty-cart-container">
        <div className="empty-cart-icon">
          <FaShoppingBasket />
        </div>
        <h2 className="empty-cart-title">Your cart is empty</h2>
        <p className="empty-cart-message">
          Add delicious items to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h1 className="cart-title">Your Order</h1>

      <div className="cart-items-container">
        {data.map((food, index) => (
          <div key={index} className="cart-item">
            <div className="cart-item-image">
              <img src={food.img} alt={food.name} />
            </div>

            <div className="cart-item-details">
              <h3 className="cart-item-name">{food.name}</h3>
              <div className="cart-item-meta">
                <span className="cart-item-size">{food.size}</span>
                <span className="cart-item-qty">Qty: {food.qty}</span>
              </div>
            </div>

            <div className="cart-item-price">₹{food.price}</div>

            <button
              className="cart-item-remove"
              onClick={() => dispatch({ type: "REMOVE", index: index })}
              aria-label="Remove item"
            >
              <FaTrashAlt />
            </button>
          </div>
        ))}
      </div>

      <div className="cart-summary">
        <div className="cart-summary-row">
          <span>Subtotal</span>
          <span>₹{totalPrice}</span>
        </div>
        <div className="cart-summary-row">
          <span>Delivery Fee</span>
          <span>₹40</span>
        </div>
        <div className="cart-summary-row total">
          <span>Total</span>
          <span>₹{totalPrice + 40}</span>
        </div>
      </div>

      <button className="checkout-button" onClick={handleCheckOut}>
        <FaCheck className="checkout-icon" />
        <span>Proceed to Checkout</span>
      </button>
    </div>
  );
};

export default Cart;
