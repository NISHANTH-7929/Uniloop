import React, { useState, useEffect } from 'react';
import api from '../../api/dormdashApi';
import GroupOrderBuilder from '../../components/dormdash/GroupOrderBuilder';
import { useNavigate } from 'react-router-dom';
import { campusZonesList } from '../../data/campusZones';

const GroupOrderForm = () => {
  const navigate = useNavigate();
  const [totalFee, setTotalFee] = useState(0);
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [members, setMembers] = useState([{ id: 1, name: 'You', items: [], localCharge: 0 }]);
  const [loading, setLoading] = useState(false);

  // Auto-tally the charge whenever a member updates their contribution
  useEffect(() => {
    const sum = members.reduce((acc, current) => acc + current.localCharge, 0);
    setTotalFee(sum);
  }, [members]);

  const handleUpdateShareCharge = (memberIndex, value) => {
    const updated = [...members];
    updated[memberIndex].localCharge = value;
    setMembers(updated);
  };

  const handleAddItem = (memberIndex, item) => {
    const updated = [...members];
    updated[memberIndex].items.push(item);
    setMembers(updated);
  };

  const addMember = () => {
    setMembers([...members, { id: Date.now(), name: `Member ${members.length + 1}`, items: [], localCharge: 0 }]);
  };

  const handleSubmit = async () => {
    const flatItems = members.reduce((acc, member) => {
      // Annotate whose item it is in the name for simplicity without complex backend mapping
      const mItems = member.items.map(it => ({ ...it, name: `[${member.name}] ${it.name}`, type: 'custom' }));
      return [...acc, ...mItems];
    }, []);

    if (flatItems.length === 0) {
      alert("No items added. Add some items first.");
      return;
    }

    if (!pickup || !dropoff) {
      alert("Location missing.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        pickupLocation: pickup,
        dropLocation: dropoff,
        charge: Number(totalFee),
        items: flatItems,
        isGroupOrder: true
      };
      
      const { data } = await api.post('/dormdash/orders/group', payload);
      navigate(`/dormdash/order/${data.data?._id || data.order?._id || data._id}`);
    } catch (error) {
      alert("Failed to submit group order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "10px" }}>Group Cart</h1>
      <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", marginBottom: "30px" }}>
        Consolidate requests from your floor/dorm. Pool dasher fees together so it's cheaper for everyone.
      </p>

      <div className="glass-panel" style={{ padding: "30px", marginBottom: "30px" }}>
        <h3 style={{ color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "15px", fontSize: "1.2rem" }}>Route</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem" }}>Pickup Zone</label>
            <input 
              list="campus-zones"
              className="neon-input" 
              placeholder="e.g. A Block Canteen"
              value={pickup} 
              onChange={e => setPickup(e.target.value)} 
            />
          </div>
          <div>
            <label style={{ display: "block", color: "var(--text-secondary)", marginBottom: "5px", fontSize: "0.9rem" }}>Dropoff Dorm</label>
            <input 
              list="campus-zones"
              className="neon-input" 
              placeholder="e.g. Hostel B, Room 214"
              value={dropoff} 
              onChange={e => setDropoff(e.target.value)} 
            />
            <datalist id="campus-zones">
              {campusZonesList.map(z => <option key={z} value={z} />)}
            </datalist>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "30px" }}>
        <h3 style={{ color: "#fff", fontSize: "1.3rem", marginBottom: "20px" }}>Participants</h3>
        {members.map((member, idx) => (
          <div key={member.id} style={{ marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
               <h4 style={{ color: "var(--accent-cyan)", margin: 0, fontSize: "1.1rem" }}>{member.name}</h4>
               {idx !== 0 && (
                 <button 
                  onClick={() => setMembers(members.filter((_, i) => i !== idx))} 
                  style={{ background: "none", border: "none", color: "#ff4444", fontSize: "0.85rem", cursor: "pointer" }}
                 >
                   Remove
                 </button>
               )}
            </div>
            <GroupOrderBuilder 
              items={member.items}
              onAddItem={(item) => handleAddItem(idx, item)}
              shareCharge={member.localCharge}
              onUpdateShareCharge={(val) => handleUpdateShareCharge(idx, val)}
            />
          </div>
        ))}
        
        <button onClick={addMember} className="btn-neon" style={{ width: "100%", borderStyle: "dashed", borderColor: "var(--accent-purple)", color: "var(--accent-purple)" }}>
          + Add another person's list
        </button>
      </div>

      <div className="glass-panel" style={{ padding: "20px", background: "rgba(112,0,255,0.05)", border: "1px solid rgba(112,0,255,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.9rem" }}>Total Dasher Fee Pool</span>
          <span style={{ fontSize: "1.8rem", fontWeight: "bold", color: "#fff" }}>₹{totalFee}</span>
        </div>
        <button onClick={handleSubmit} disabled={loading || totalFee <= 0} className="btn-neon primary" style={{ padding: "12px 24px" }}>
          {loading ? 'Posting...' : 'Post Group Order'}
        </button>
      </div>
    </div>
  );
};

export default GroupOrderForm;
