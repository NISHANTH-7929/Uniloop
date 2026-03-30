import React, { createContext, useReducer, useEffect, useContext } from "react";
import { useDormDashSocket } from "../hooks/useDormDashSocket";
// We might need to import useAuth from the actual location, so using AuthContext directly if possible.
// Wait, we can expect the pages to pass userId or we can fetch it. Let's make the context generic and we can provide userId to the provider.

const DormDashContext = createContext();

const initialState = {
  activeOrder: null,
  myOrders: [],
  orderFeed: [],
  canteenItems: [],
  dasherMode: false,
  otpData: null, // { otp, orderId }
  userId: null,
  lastUpdate: 0, // Used to trigger re-fetches in components
};

function dormDashReducer(state, action) {
  switch (action.type) {
    case "SET_MY_ORDERS":
      return { ...state, myOrders: action.payload, lastUpdate: state.lastUpdate + 1 };
    case "SET_ORDER_FEED":
      return { ...state, orderFeed: action.payload, lastUpdate: state.lastUpdate + 1 };
    case "SET_CANTEEN_ITEMS":
      return { ...state, canteenItems: action.payload };
    case "SET_DASHER_MODE":
      return { ...state, dasherMode: action.payload };
    case "SET_ACTIVE_ORDER":
      return { ...state, activeOrder: action.payload, lastUpdate: state.lastUpdate + 1 };
      
    case "ORDER_NEW":
      return { 
        ...state, 
        orderFeed: [action.payload, ...state.orderFeed],
        lastUpdate: state.lastUpdate + 1
      };
      
    case "ORDER_UPDATED":
      return {
        ...state,
        myOrders: state.myOrders.map(o => o._id === action.payload._id ? action.payload : o),
        orderFeed: state.orderFeed.map(o => o._id === action.payload._id ? action.payload : o).filter(o => o.status === "open"),
        activeOrder: state.activeOrder?._id === action.payload._id ? action.payload : state.activeOrder,
        lastUpdate: state.lastUpdate + 1
      };
      
    case "OTP_RECEIVED":
      return { ...state, otpData: action.payload, lastUpdate: state.lastUpdate + 1 };
      
    case "REVIEW_REVEALED":
      // update the specific order with revealed reviews
      const updatedOrder = state.activeOrder?._id === action.payload.orderId 
        ? { 
            ...state.activeOrder, 
            reviewsRevealed: true, 
            dasherReview: action.payload.dasherReview, 
            requesterReview: action.payload.requesterReview 
          }
        : state.activeOrder;
      
      return {
        ...state,
        activeOrder: updatedOrder,
        myOrders: state.myOrders.map(o => o._id === action.payload.orderId ? { ...o, reviewsRevealed: true, dasherReview: action.payload.dasherReview, requesterReview: action.payload.requesterReview } : o),
        lastUpdate: state.lastUpdate + 1
      };
      
    case "DASHER_ONLINE":
      // Optional: Handle when a dasher comes online
      return state;
      
    case "SET_USER_ID":
      return { ...state, userId: action.payload };
      
    default:
      return state;
  }
}

export const DormDashProvider = ({ children, userId }) => {
  const [state, dispatch] = useReducer(dormDashReducer, initialState);

  useEffect(() => {
    if (userId) {
      dispatch({ type: "SET_USER_ID", payload: userId });
    }
  }, [userId]);

  useDormDashSocket(userId, dispatch);

  return (
    <DormDashContext.Provider value={{ state, dispatch }}>
      {children}
    </DormDashContext.Provider>
  );
};

export const useDormDash = () => useContext(DormDashContext);
