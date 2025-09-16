import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
  process.env.NODE_ENV==="production" ?{rejectedUnauthorized:false} : false,
});

(async () =>{
    try {
        await pool.query("Selected NOW()");
        console.log("Database Connected Succesfully")
    } catch (err) {
        console.log("Database connection error :",err)
    }
})
export default pool;
