const express = require("express")
const router = express.Router();
const Order4r=require('../models/Order4rest');

// router.get('/getOrderOfMyresturant',async (req,res,next)=>{
//     try{

//         console.log("heyy bith")
//       const data=await Order4r.find({order:{ $exists: true }}).sort({ date: -1 });
      
//       // console.log(data)
//       res.status(200).json({data:data});
      

      
//     }
//     catch(err){
//       console.log(err)
//       res.status(500).json({data:null,error:"internal server errror /getOrderOfMyresturant"});
//     }
//   })

  module.exports = router;
