const mongoose = require('mongoose')

const { Schema } = mongoose;

const OrderSchema = new Schema({
    email: {
        type: String,
        required: true,
    },
    order: {
        type: Object,
        required: true,
    },
    Order_State:{
        type: String,
        required:false,
        default:"Ordered",
    },
    MobileNo:{
        type: Number,
        required:true
    },
    date:{
        type:Date,
        default:Date.now
    }

});

module.exports = mongoose.model('order4r', OrderSchema)