import React, { useEffect, useRef, useState } from "react";
import { useDispatchCart, useCart } from "../../../Component/ContextReducer";
import "../../styles/FoodMenuPage.css";

const MenuPageCard = (props) => {
  let data = useCart();
  let foodItem = props.foodItems;
  let dispatch = useDispatchCart();

  let options = props.options;
  let priceOptions = Object.keys(options);
  const priceRef = useRef();
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState("");

  const handleAddToCart = async () => {
    await dispatch({
      type: "ADD",
      id: props.foodItems._id,
      name: props.foodItems.name,
      img: props.foodItems.img,
      price: finalPrice,
      qty: qty,
      size: size,
    });
  };

  let finalPrice = qty * parseInt(options[size]);

  useEffect(() => {
    setSize(priceRef.current.value);
  }, []);

  return (
    <div className="food-card">
      <div className="food-card-img">
        <img src={props.foodItems.img} alt={props.foodItems.name} />
      </div>
      <div className="food-card-content">
        <h3>{props.foodItems.name}</h3>
        <div className="food-card-details">
          <div className="food-card-rating">
            <span>★</span>
            <span>{props.foodItems.rating || "4.5"}</span>
          </div>
          <div className="food-card-price">₹{finalPrice}</div>
        </div>

        {props.foodItems.description && (
          <p className="food-card-description">{props.foodItems.description}</p>
        )}

        <div className="food-card-options">
          <div className="option-group">
            <label className="option-label">Qty</label>
            <select
              className="custom-select"
              onChange={(e) => setQty(e.target.value)}
              value={qty}
            >
              {Array.from(Array(6), (e, i) => (
                <option value={i + 1} key={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
          </div>

          <div className="option-group">
            <label className="option-label">Size</label>
            <select
              className="custom-select"
              ref={priceRef}
              onChange={(e) => setSize(e.target.value)}
              value={size}
            >
              {priceOptions.map((data) => (
                <option key={data} value={data}>
                  {data}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button className="add-to-cart-btn" onClick={handleAddToCart}>
          Add to Cart <span>+</span>
        </button>
      </div>
    </div>
  );
};

export default MenuPageCard;
