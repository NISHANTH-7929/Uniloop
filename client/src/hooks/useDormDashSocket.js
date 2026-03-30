import { useEffect } from "react";
import { useSocket } from "../context/SocketContext";

export const useDormDashSocket = (userId, dispatch) => {
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket || !connected || !userId) return;

    console.log("DormDash socket events attached for user:", userId);

    // Server -> Client events
    socket.on("order:new", (order) => {
      dispatch({ type: "ORDER_NEW", payload: order });
    });

    socket.on("order:accepted", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("order:pickedup", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("order:intransit", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("order:delivered", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("order:cancelled", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("order:confirmed", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("order:declined", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("order:completed", (order) => {
      dispatch({ type: "ORDER_UPDATED", payload: order });
    });

    socket.on("otp:generated", (data) => {
      // payload: { otp, orderId }
      dispatch({ type: "OTP_RECEIVED", payload: data });
    });

    socket.on("review:revealed", (payload) => {
      // payload: { orderId, dasherReview, requesterReview }
      dispatch({ type: "REVIEW_REVEALED", payload });
    });

    socket.on("dasher:online", (data) => {
      // data: { dasherId, name }
      // Could be used to show a toast or update local active orders
      dispatch({ type: "DASHER_ONLINE", payload: data });
    });

    return () => {
      socket.off("order:new");
      socket.off("order:accepted");
      socket.off("order:pickedup");
      socket.off("order:intransit");
      socket.off("order:delivered");
      socket.off("order:cancelled");
      socket.off("otp:generated");
      socket.off("review:revealed");
      socket.off("dasher:online");
    };
  }, [socket, connected, userId, dispatch]);
};
