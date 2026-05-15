
import mongoose from "mongoose";



const dbConfig = () =>{
    mongoose
        .connect(process.env.DB_URL)
        .then((conn) => {
            console.log(`Database connected on ${conn.connection.host}`);
        }).catch((err) => {
            console.log(`Error: ${err.message}`);
            process.exit(1); // 1 means exit with failure
        });
}
export default dbConfig;