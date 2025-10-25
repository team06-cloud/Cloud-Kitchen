import orderActionTypes from "./orderActionTypes";



const orderActions={
    setOrderStatus:(value)=>{
        return{
            type:orderActionTypes.SET_ORDER_STATUS,
            payload:value
        }
    },
    
    
}

export default orderActions;