import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../api/dormdashApi';
import ProfileScoreCard from '../../components/dormdash/ProfileScoreCard';

const PublicDashProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get(`/dormdash/profile/${userId}`);
        setProfile(data.data || data);
      } catch (err) {
        setError('User not found or has no DormDash profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) return <div style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>Loading profile...</div>;
  if (error || !profile) return <div style={{ textAlign: "center", padding: "40px", color: "#ff4444" }}>{error}</div>;

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", paddingBottom: "40px" }}>
      <ProfileScoreCard user={profile} />
    </div>
  );
};

export default PublicDashProfile;
