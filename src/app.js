import expreess from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = expreess(); 

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));  

app.use(expreess.json({limit: '16kb'}));

app.use(expreess.urlencoded({extended: true, limit: '16kb'}));

app.use(expreess.static('public'));

app.use(cookieParser());


//import routes
import { router } from "./routes/user.routes.js";//http://localhost:8000/api/v1/users/register


//routes declaration
app.use("/api/v1/users", router);

export { app };