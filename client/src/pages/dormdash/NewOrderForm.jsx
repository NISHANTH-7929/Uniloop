import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/dormdashApi';
import { campusZonesList } from '../../data/campusZones';

const NewOrderForm = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  
  const initialItems = state?.predefinedItems || [{ name: '', quantity: 1, type: 'custom' }];
  
  const [formData, setFormData] = useState({
    pickupLocation: '',
    dropLocation: '',
    charge: '',
    instructions: '',
    items: initialItems
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { name: '', quantity: 1, type: 'custom' }]
    });
  };

  const removeItem = (idx) => {
    const newItems = formData.items.filter((_, i) => i !== idx);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.items.length === 0 || !formData.items[0].name) {
      setError('At least one item is required');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/dormdash/orders', {
        ...formData,
        charge: Number(formData.charge)
      });
      navigate(`/dormdash/order/${data.data?._id || data.order?._id || data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "40px" }}>
      <h1 className="text-gradient" style={{ fontSize: "2rem", marginBottom: "20px" }}>Request a Delivery</h1>
      
      {error && (
        <div style={{ padding: "15px", background: "rgba(255, 68, 68, 0.1)", border: "1px solid rgba(255, 68, 68, 0.3)", borderRadius: "8px", color: "#ff4444", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: "30px", display: "flex", flexDirection: "column", gap: "25px" }}>
        
        <div>
          <h3 style={{ color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px", fontSize: "1.2rem" }}>What do you need?</h3>
          {formData.items.map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: "10px", marginBottom: "15px", alignItems: "center" }}>
              <input
                type="text"
                placeholder="Item name (e.g. 2 Redbulls)"
                className="neon-input"
                style={{ flex: 1 }}
                value={item.name}
                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                required
                disabled={item.type === 'canteen_item'}
              />
              <input
                type="number"
                min="1"
                className="neon-input"
                style={{ width: "80px" }}
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                required
                disabled={item.type === 'canteen_item'}
              />
              {item.type !== 'canteen_item' && formData.items.length > 1 && (
                <button type="button" onClick={() => removeItem(idx)} style={{ background: "none", border: "none", color: "#ff4444", cursor: "pointer", fontSize: "1.5rem", padding: "0 10px" }}>
                  &times;
                </button>
              )}
            </div>
          ))}
          {!state?.predefinedItems && (
            <button type="button" onClick={addItem} style={{ color: "var(--accent-cyan)", background: "none", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold" }}>
              + Add another item
            </button>
          )}
        </div>

        <div>
          <h3 style={{ color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px", fontSize: "1.2rem" }}>Location Details</h3>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem" }}>Pickup From</label>
            <input
              list="campus-zones"
              className="neon-input"
              placeholder="e.g. A Block Canteen"
              value={formData.pickupLocation}
              onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem" }}>Dropoff To</label>
            <input
              list="campus-zones"
              className="neon-input"
              placeholder="e.g. Hostel B, Room 214"
              value={formData.dropLocation}
              onChange={(e) => setFormData({ ...formData, dropLocation: e.target.value })}
              required
            />
            
            <datalist id="campus-zones">
              {campusZonesList.map(zone => <option key={zone} value={zone} />)}
            </datalist>
          </div>
        </div>

        <div>
          <h3 style={{ color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px", fontSize: "1.2rem" }}>Logistics</h3>
          
          <div style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem" }}>Dasher Fee (₹)</label>
            <input
              type="number"
              min="0"
              placeholder="What you will pay the dasher upon delivery"
              className="neon-input"
              value={formData.charge}
              onChange={(e) => setFormData({ ...formData, charge: e.target.value })}
              required
            />
            <p style={{ color: "var(--accent-cyan)", fontSize: "0.8rem", marginTop: "5px", fontStyle: "italic" }}>
              *This is paid in person. UniLoop takes no cut!
            </p>
          </div>

          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem" }}>Instructions (Optional)</label>
            <textarea
              className="neon-input"
              style={{ resize: "none" }}
              rows={3}
              placeholder="e.g. Leave at the front desk, call me when you arrive..."
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-neon primary"
          style={{ padding: "15px", fontSize: "1.1rem" }}
        >
          {loading ? 'Posting...' : 'Post Request'}
        </button>
      </form>
    </div>
  );
};

export default NewOrderForm;
