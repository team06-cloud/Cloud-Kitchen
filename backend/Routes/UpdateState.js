const express = require("express");
const router = express.Router();
const order = require('../models/Order4rest');

router.put("/UpdateState", async (req, res) => {
    try {
        const { id, Selected_State } = req.body; 
        console.log(req.body);


        const updatedOrder = await order.findOneAndUpdate(
            { _id: id },
            { $set: { Order_State: Selected_State } }, 
            { new: true } 
        );
        if (updatedOrder) {
            // console.log("Order updated successfully:", updatedOrder);
            res.status(200).json({ success: true, message: "Order updated successfully" });
        } else {
            // console.log("Order not found or could not be updated");
            res.status(404).json({ success: false, message: "Order not found or could not be updated" });
        }
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
});

module.exports = router;
