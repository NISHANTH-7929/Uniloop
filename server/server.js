import dotenv from "dotenv";
dotenv.config();

import app from "./src/app.js";
import connectDB from "./src/config/db.js";

connectDB();

const PORT = process.env.PORT;

app.listen(PORT,"0.0.0.0",(req,res)=>{
    console.log(`Server running on port ${PORT}`);
});
