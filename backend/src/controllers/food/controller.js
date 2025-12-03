import { FoodModel } from "../../model/food/model.js";
import { UserModel } from "../../model/user/model.js";
import { UploadFile } from "../../services/storage.service.js";
import { Decode } from "../../utils/jwt.js";

const createFood = async (req, res) => {
  try {
    const foodPartner = req.foodpartner;
    const { title, description } = req.body;
    const video = req.file;

    if (!title || !description) {
      throw new Error("Title and Description Must Be Provided");
    }

    if (!video) {
      throw new Error("No File Provided");
    }

    const uploaded = await UploadFile({
      file: video.buffer,
      fileName: video.originalname,
    });

    const food = await FoodModel.create({
      title,
      description,
      video: uploaded.url,
      partner: foodPartner._id,
    });

    return res.status(201).json({
      message: "Food Added Successfully",
      food,
      success: true,
    });
  } catch (error) {
    console.log(error);

    return res.status(401).json({
      message: error.message,
      success: false,
    });
  }
};

const likeFood = async (req, res) => {
  try {
    const token = req.cookies.token;
    const reelId = req.body.reel;

    if (!token) {
      return res.status(401).json({ success: false, message: "Token missing" });
    }

    const decoded = Decode(token);
    if (!decoded.id) {
      return res
        .status(401)
        .json({ success: false, message: "User unauthorized" });
    }

    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const foodReel = await FoodModel.findById(reelId);
    if (!foodReel) {
      return res
        .status(404)
        .json({ success: false, message: "Food reel not found" });
    }

    // Toggle Like (Better UX)
    const alreadyLiked = foodReel.likes.includes(user._id);

    if (alreadyLiked) {
      foodReel.likes.pull(user._id);
      await foodReel.save();
      return res.json({
        success: true,
        message: "Unliked successfully",
        liked: false,
      });
    }

    foodReel.likes.push(user._id);
    await foodReel.save();

    return res.json({
      success: true,
      message: "Liked successfully",
      liked: true,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const GetReels = async (req, res) => {
  try {

    const current = req.body?.current;
    const direction = req.body?.direction
    const threshold = req.body?.threshold || 5;

    console.log(req.body)

    let filter = {};

    // If current reel exists, fetch its details first
    if (current) {
      const currentReel = await FoodModel.findById(current).select("createdAt");

      if (!currentReel) {
        return res.status(404).json({ message: "Current reel not found" });
      }

      if (direction === "next") {
        // fetch OLDER reels
        filter = { createdAt: { $lt: currentReel.createdAt } };
      } else if (direction === "prev") {
        // fetch NEWER reels
        filter = { createdAt: { $gt: currentReel.createdAt } };
      }
    }

    // Main fetch logic
    let reels = await FoodModel
      .find(filter)
      .sort({ createdAt: -1 }) // always newest → oldest
      .limit(threshold);

    // Extra safety: sort again in JS (just to guarantee perfect order)
    reels = reels.sort((a, b) => b.createdAt - a.createdAt);

    return res.json(reels);

  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};



export default {
  food: {
    create: createFood,
    like: likeFood,
    getAll: GetReels,
  },
};
