import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { upLoadOnCloudinary } from "../utils/cloudnary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { emit } from "nodemon";

const generateAccessTokenandRefreshToken = async (userId) => {
  const user = await User.findById(userId);

  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

// register user

const registerUser = asynchandler(async (req, res, next) => {
  // get user details from frontend
  //validate user details
  //check if user exists : username or email
  //check for image,check for avatar
  //upload to cloudinary,avatar
  //create user object - create entry in database
  //remove password and refresh token field from response
  //check for user creation

  const { username, email, password, fullName } = req.body;
  if ([username, email, password, fullName].some((feild) => feild?.trim === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (existUser) {
    throw new ApiError(409, "User already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await upLoadOnCloudinary(avatarLocalPath);
  const coverImage = await upLoadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Error uploading avatar");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  });
  const createdUser = await User.findById(user._id).select(" -password -refreshToken ");
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  return res.status(201).json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

//login

const loginUser = asynchandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and referesh token
  //send cookie

  const { email, username, password } = req.body;
  console.log(email);

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } = await generateAccessTokenandRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

//logout

const logoutUser = asynchandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

//referesh token
const refereshAccessToken = asynchandler(async (req, res) => {
  const IncomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!IncomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(IncomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(404, "Invalid refresh token");
    }

    if (user?.refreshToken !== IncomingRefreshToken) {
      throw new ApiError(401, "Refresh token expired please login again");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };
    const { newAccessToken, newRefreshToken } = await user.generateAccessTokenandRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", newAccessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(new ApiResponse(200, { newAccessToken, newRefreshToken }, "Access token refresh successfully"));
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

//change password

const changeCurrentPassword = asynchandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old password is incorrect");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

//get current user

const getCurrentUser = asynchandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "User details fetched successfully"));
});


//update user profile

const updateUserProfile = asynchandler(async (req, res) => {
  const { username, email, fullName } = req.body;

  if (!fullName || !username || !email) {
    throw new ApiError(400, "All fields are required");
  }


  const user = await User.findByIdAndUpdate
    (req.user?._id, {
      $set: {
        username,
        email,
        fullName
      }
    }, { new: true }).select("-password ");


  return res.status(200).json(new ApiResponse(200,
    user, "User details updated successfully"));

})

//upadate file (avatar)
const updateUserAvatar = asynchandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  };


  const avatar = await upLoadOnCloudinary(avatarLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Error while uploading avatar");
  };

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      avatar: avatar.url
    }
  }, { new: true }).select("-password ");


  return res.status(200).json(new ApiResponse(200, user,
    "Avatar updated successfully"));

})

//update file (coverImage)

const updateUserCoverImage = asynchandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "CoverImage  file is missing");
  };


  const coverImage = await upLoadOnCloudinary(avatarLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, "Error while uploading avatar");
  };

  const user = await User.findByIdAndUpdate(req.user?._id, {
    $set: {
      coverImage: coverImage.url
    }
  }, { new: true }).select("-password ");


  return res.status(200).json(new ApiResponse(200, user,
    "Cover image updated successfully"));

})

// how much subscribers a channel have and how much  channel are subscribed by a channel

const getUserChannelProfile = asynchandler(async (req, res) => {

  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "username is required")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribedBy"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedto"
      }
    },
    {
      $addFields: {
        subscribedby: {
          $size: "$subscribedBy"
        },
        subscribedto: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribedBy.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        username: 1,
        fullName: 1,
        subscribedto: 1,
        subscribedby: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email,


      }
    }
  ])

  if (!channel?.length) {
    throw new ApiError(404, "Channel not found")
  }



  return res.status(200).json(new ApiResponse(200, channel[0],
    "Channel profile fetched successfully"))


})





export {
  loginUser, registerUser, logoutUser,
  refereshAccessToken, changeCurrentPassword,
  getCurrentUser, updateUserProfile
  , updateUserAvatar, updateUserCoverImage
};
