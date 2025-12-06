import { FoodModel } from "../../model/food/model.js";
import { UserModel } from "../../model/user/model.js";

const GetLikedAndSavedReels = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Fetch full user to get liked and saved lists
    const User = await UserModel.findById(user._id);

    if (!User) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Fetch liked reels
    const likedReels =
      User.liked && User.liked.length > 0
        ? await FoodModel.find({ _id: { $in: User.liked } })
        : [];

    const finalLikedReels = likedReels.map((reel) => {
      const hasLiked = User._id
        ? reel.likes?.some((id) => id.toString() === User._id.toString())
        : false;

      const hasSaved = User.saved.some(
        (id) => id.toString() === reel._id.toString()
      );

      return {
        ...reel._doc,
        hasLiked,
        hasSaved,
        like: reel.likes?.length || 0,
      };
    });

    // Fetch saved reels
    const savedReels =
      User.saved && User.saved.length > 0
        ? await FoodModel.find({ _id: { $in: User.saved } })
        : [];

    const finalSavedReels = savedReels.map((reel) => {
      const hasLiked = User._id
        ? reel.likes?.some((id) => id.toString() === User._id.toString())
        : false;

      const hasSaved = User.saved.some(
        (id) => id.toString() === reel._id.toString()
      );

      return {
        ...reel._doc,
        hasLiked,
        hasSaved,
        like: reel.likes?.length || 0,
      };
    });

    return res.status(200).json({
      success: true,
      likedReels:finalLikedReels,
      savedReels:finalSavedReels,
    });
  } catch (error) {
    console.log("GetLikedAndSavedReels error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default {
  likedAndSaved: GetLikedAndSavedReels,
};
