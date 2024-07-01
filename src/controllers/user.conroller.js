import { asynchandler } from "../utils/asynchandler.js";

const registerUser = asynchandler(async (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "Register User",
    });
});


export { registerUser }