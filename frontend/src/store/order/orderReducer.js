import orderActionTypes from "./orderActionTypes"

const initialState={
    orderStatus:"chaman",
    myAllOrders:[],
    resturentOrders:[]
}




const orderReducer=(state=initialState,action)=>{
    switch(action.type){

        case orderActionTypes.SET_ORDER_STATUS:
            return{
                ...state,
                orderStatus:action.payload
            }

        default:
            return state
    }
}

export default orderReducer;