import "./App.css";
import Home from "./Screens/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Screens/auth/Login";
import Signup from "./Screens/auth/Signup";
import Foodcards from "./Screens/FoodMenuPage";
import { CartProvider } from "./Component/ContextReducer";
import MyOrders from "./Screens/MyOrders";
import YourRestaurent from "./Screens/auth/YourRestaurent";
import RestaurentOrders from "./Screens/RestaurentOrders";
import FoodMenu from "./Screens/FoodMenuPage";
import RestaurantDashboard from "./Screens/restaurant/RestaurantDashboard";

function App() {
  return (
    <CartProvider>
      <Router>
        <div>
          <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/login" element={<Login />} />
            <Route exact path="/Signup" element={<Signup />} />
            <Route exact path="/RagisterResturent" element={<YourRestaurent />}/>
            <Route exact path="/RestOrder" element={<RestaurentOrders />} />
            <Route exact path="/foodcards" element={<Foodcards />} />
            <Route exact path="/myOrder" element={<MyOrders />} />
            <Route exact path="/menu" element={<FoodMenu />} />
            <Route exact path="/restaurant/dashboard" element={<RestaurantDashboard />} />

          </Routes>
        </div>
      </Router>
    </CartProvider>
  );
}

export default App;
