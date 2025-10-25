import "./styles/FoodMenuPage.css";
import React, { useState, useEffect, useCallback } from "react";
import Navbar from "../Component/Navbar";
import MenuPageCard from "./components/menuPage/Newcard";

const FoodMenu = () => {
  const [search, setSearch] = useState("");
  const [foodCat, setFoodCat] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      let response = await fetch("https://foodiii.onrender.com/api/foodData", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      setLoading(false);

      if (data && data.length >= 2) {
        setFoodItems(data[0] || []); 
        setFoodCat(data[1] || []); 
        
        if (data[1] && data[1].length > 0) {
          setActiveCategory(data[1][0].CategoryName);
        }
      } else {
        console.error("Unexpected data format:", data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const regexFilter = useCallback(() => {
    if (!search.trim()) return foodItems;

    const fuzzyPattern = search.split("").join(".*");
    const regex = new RegExp(`.*${fuzzyPattern}.*`, "i");
    return (foodItems || []).filter((item) => regex.test(item.name));
  }, [search, foodItems]);

  const filteredItems = regexFilter();

  const handleCategoryClick = (categoryName) => {
    setActiveCategory(categoryName);
  };

  return (
    <div className="food-menu">
      <div className="food-menu-header">
        <Navbar />

        <div className="search-container">
          <div className="search-box">
            <img
              className="search-icon"
              src="../Images/search.png"
              alt="Search"
            />
            <input
              type="search"
              className="search-input"
              placeholder="Search for a dish"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {!loading && foodCat.length > 0 && (
          <div className="category-tabs">
            {foodCat.map((category) => (
              <button
                key={category._id}
                className={`category-tab ${
                  activeCategory === category.CategoryName ? "active" : ""
                }`}
                onClick={() => handleCategoryClick(category.CategoryName)}
              >
                {category.CategoryName}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loader-ring"></div>
          <h2>Loading delicious food...</h2>
        </div>
      ) : (
        <div className="food-menu-content">
          {foodCat.length > 0 ? (
            <div className="food-categories">
              {activeCategory && (
                <div className="food-category" key={activeCategory}>
                  <h2 className="category-title">{activeCategory}</h2>

                  <div className="food-items-grid">
                    {filteredItems.length > 0 ? (
                      filteredItems
                        .filter((item) => item.CategoryName === activeCategory)
                        .map((filterItem) => (
                          <div key={filterItem._id} className="food-item-card">
                            <MenuPageCard
                              foodItems={filterItem}
                              options={filterItem.options[0]}
                            />
                          </div>
                        ))
                    ) : (
                      <div className="no-results">
                        <div className="no-results-icon">🍽️</div>
                        <p>No dishes found matching your search</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-data">
              <div className="no-data-icon">📋</div>
              <p>Our menu is currently unavailable</p>
              <p>Please check back later</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FoodMenu;
