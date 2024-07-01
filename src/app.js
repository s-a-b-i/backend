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

export { app };