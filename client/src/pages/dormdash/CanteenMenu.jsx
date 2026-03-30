import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/dormdashApi';
import CanteenItemCard from '../../components/dormdash/CanteenItemCard';

const CanteenMenu = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const { data } = await api.get('/dormdash/canteen/items');
        setItems(data.data || data || []);
      } catch (error) {
        console.error("Failed to load canteens", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.itemId === item._id);
      if (existing) {
        return prev.map(i => i.itemId === item._id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { itemId: item._id, name: item.name, price: item.price, quantity: 1, type: 'canteen_item' }];
    });
  };

  const canteens = [...new Set(items.map(i => i.canteenName))];

  return (
    <div style={{ paddingBottom: "100px" }}>
      <div style={{ marginBottom: "30px" }}>
        <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "10px" }}>Campus Canteens</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Browse items ready for delivery.</p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "1.1rem" }}>Loading menus...</div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
          No items are currently available for delivery. Check back later!
        </div>
      ) : (
        canteens.map(canteen => (
          <div key={canteen} style={{ marginBottom: "40px" }}>
            <h2 style={{ color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "20px", fontSize: "1.5rem" }}>
              {canteen}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
              {items.filter(i => i.canteenName === canteen).map(item => (
                <CanteenItemCard key={item._id} item={item} onAdd={addToCart} />
              ))}
            </div>
          </div>
        ))
      )}

      {cart.length > 0 && (
        <div className="glass-panel" style={{ position: "fixed", bottom: "30px", left: "50%", transform: "translateX(-50%)", width: "90%", maxWidth: "600px", padding: "15px 25px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 50, background: "rgba(10, 17, 40, 0.9)" }}>
          <div>
            <span style={{ display: "block", color: "var(--accent-cyan)", fontWeight: "bold", fontSize: "0.9rem", textTransform: "uppercase" }}>Cart Summary</span>
            <span style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "bold" }}>
               {cart.reduce((acc, i) => acc + i.quantity, 0)} items | ₹{cart.reduce((acc, i) => acc + (i.price * i.quantity), 0)}
            </span>
          </div>
          <button 
            onClick={() => navigate('/dormdash/new-order', { state: { predefinedItems: cart } })}
            className="btn-neon primary"
            style={{ padding: "10px 20px" }}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );
};

export default CanteenMenu;
