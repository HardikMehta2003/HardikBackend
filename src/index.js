import dotenv from "dotenv"

import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.on("error",()=>{
        console.log("OOPS",err);
        throw error;
    });
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server connected at port ${process.env.PORT}`);
    });
})
.catch((err)=>{
    console.log(`DATABAES CONNECTION FAILED ${err}`);
})













/*
import express from "express"
const app = express();

;(async ()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        app.on("error",()=>{
            console.error("ERROR :",error);
            throw err
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App listening at port ${process.env.PORT}`);
        })
    }catch(error){
        console.error("ERROR :",error);
        throw err
    }
})()
*/