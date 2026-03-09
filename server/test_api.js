
import axios from 'axios';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const testApi = async () => {
    try {
        // Create a fake token for testing (using the same secret as the server)
        const payload = { id: '67bd29b3506450f380ae0910', role: 'student' }; // Just use some ID
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        console.log("Testing API with token...");
        const response = await axios.get('http://localhost:5000/api/events', {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log("Status:", response.status);
        console.log("Data length:", response.data.length);
        console.log("First event:", response.data[0]?.title);
    } catch (error) {
        console.error("API Error:", error.response?.status, error.response?.data || error.message);
    }
};

testApi();
