import React, { useEffect, useState } from 'react';
import api from '../../api/dormdashApi';
import OrderCard from '../../components/dormdash/OrderCard';
import DasherToggle from '../../components/dormdash/DasherToggle';
import { useDormDash } from '../../context/DormDashContext';
import { campusZonesList } from '../../data/campusZones';

const DasherDashboard = () => {
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [pickupFilter, setPickupFilter] = useState('');
  const [dropoffFilter, setDropoffFilter] = useState('');
  
  const { state, dispatch } = useDormDash();

  const handleToggle = (status) => {
    dispatch({ type: 'SET_DASHER_MODE', payload: status });
  };

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const { data } = await api.get('/dormdash/orders/feed');
        setActiveOrders(data.data || []);
      } catch (error) {
        console.error("Failed to load feed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [state.dasherMode]);

  // If a dasher has an order they accepted, they shouldn't just toggle offline and disappear
  const hasActiveOrder = activeOrders.some(o => o.status !== 'open' && o.status !== 'delivered');

  const filteredOrders = activeOrders.filter(o => {
    const matchesSearch = !searchQuery || o.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesPickup = !pickupFilter || o.pickupLocation.toLowerCase().includes(pickupFilter.toLowerCase());
    const matchesDropoff = !dropoffFilter || o.dropLocation.toLowerCase().includes(dropoffFilter.toLowerCase());
    return matchesSearch && matchesPickup && matchesDropoff;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "40px" }}>
      <h1 className="text-gradient" style={{ fontSize: "2.5rem", marginBottom: "20px" }}>Dasher Hub</h1>
      
      <div style={{ marginBottom: "25px" }}>
        <DasherToggle 
          isOnline={state.dasherMode} 
          onToggle={handleToggle} 
          hasActiveOrder={hasActiveOrder} 
        />
      </div>

      {state.dasherMode && (
        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by Item Name..." 
            className="neon-input" 
            style={{ flex: '1 1 200px' }}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <input 
            list="campus-zones-list"
            placeholder="Pickup Location" 
            className="neon-input" 
            style={{ flex: '1 1 150px' }}
            value={pickupFilter}
            onChange={e => setPickupFilter(e.target.value)}
          />
          <input 
            list="campus-zones-list"
            placeholder="Dropoff Location" 
            className="neon-input" 
            style={{ flex: '1 1 150px' }}
            value={dropoffFilter}
            onChange={e => setDropoffFilter(e.target.value)}
          />
          <datalist id="campus-zones-list">
            {campusZonesList.map(z => <option key={z} value={z} />)}
          </datalist>
        </div>
      )}

      <div className="glass-panel" style={{ padding: "30px", minHeight: "400px" }}>
        <h2 style={{ color: "#fff", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px", marginBottom: "20px", fontSize: "1.3rem" }}>
          Available Requests Near You
        </h2>
        
        {!state.dasherMode ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "15px", opacity: 0.5 }}>📴</div>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>Go online to see delivery requests flowing in real-time.</p>
          </div>
        ) : loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Searching for requests...</div>
        ) : filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: "40px", marginBottom: "15px", opacity: 0.5 }}>💨</div>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>No open requests match your filters right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 lg:grid-cols-5 gap-6">
            {filteredOrders.map(order => (
              <OrderCard key={order._id} order={order} isDasherFeed={true} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DasherDashboard;
