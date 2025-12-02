import { UserModel } from "../../model/user/model.js";
import { FoodPartnerModel } from "../../model/food-partner/model.js"
import { Hash, Verify } from "../../utils/bcrypt.js";
import { Decode, Token } from "../../utils/jwt.js";
import { IsEmail } from "../../utils/validator.js";

const Register = async (req, res) => {
  try {

    const { fullname, email, password } = req.body;


    if (!fullname || !email || !password || !IsEmail(email)) {
      return res.status(400).json({
        message: "!Please Provide Full Data",
        success: false,
      });
    }

    const ExistingUser = await UserModel.findOne({ email });

    if (ExistingUser) {
      return res.status(400).json({
        message: "!User Already Exist",
        success: false,
      });
    }

    const HashedPassword = await Hash(password);

    const User = await UserModel.create({
      fullname,
      email,
      password: HashedPassword,
    });

    const JWT_TOKEN = Token({
      id: User._id,
      email,
      fullname,
    });

    return res.cookie("token", JWT_TOKEN).status(201).json({
      message: "User Registeration Successfull",
      data:{
        email,fullname
      },
      success: true,
    });
  } catch (error) {
     return res.status(401).json({
      message:error.json,
      success:false
    })
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || !IsEmail(email)) {
      return res.status(400).json({
        message: "!Please Provide Full Data",
        success: false,
      });
    }

    const User = await UserModel.findOne({ email });

    if (!User) {
      return res.status(400).json({
        message: "Invalid Email Or Password",
        success: false,
      });
    }

    const IsPasswordMatch = await Verify(password, User.password);

    if (!IsPasswordMatch) {
      return res.cookie("token", "").status(400).json({
        message: "Invalid Email Or Password",
        success: false,
      });
    }

    const JWT_TOKEN = Token({
      id: User._id,
      email,
      fullname:User.fullname,
    });

    return res.cookie("token", JWT_TOKEN).status(201).json({
      message: "User Logged In Successfull",
      data:{
        email,fullname:User.fullname
      },
      success: true,
    });
  } catch (error) {
     return res.status(401).json({
      message:error.json,
      success:false
    })
  }
};

const Logout = async (req,res) => {
    try {
        res.clearCookie('token')
        return res.status(200).json({
            message:"Logout Successfull",
            success:true
        })
    } catch (error) {
        
    }
}
const FoodPartnerRegister = async (req, res) => {
  try {
    const { fullname, email, password, address, mobile } = req.body;


    if (!fullname || !email || !password || !IsEmail(email) || !address || !mobile) {
      return res.status(400).json({
        message: "!Please Provide Full Data",
        success: false,
      });
    }
    
    if(mobile.length !== 10) {
      return res.status(400).json({
        message: "Invalid Mobile Number",
        success: false,
      });
    }

    const ExistingUser = await FoodPartnerModel.findOne({ email });

    if (ExistingUser) {
      return res.status(400).json({
        message: "!Foodpartner Already Exist",
        success: false,
      });
    }

    const HashedPassword = await Hash(password);

    const User = await FoodPartnerModel.create({
      fullname,
      email,
      password: HashedPassword,
      address,
      mobile
    });

    const JWT_TOKEN = Token({
      id: User._id,
      email,
      fullname,
    });

    return res.cookie("token", JWT_TOKEN).status(201).json({
      message: "Foodpartner Registeration Successfull",
      data:{
        email,
        fullname
      },
      success: true,
    });
  } catch (error) {
    return res.status(401).json({
      message:error.json,
      success:false
    })
  }
};

const FoodPartnerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password || !IsEmail(email)) {
      return res.status(400).json({
        message: "!Please Provide Full Data",
        success: false,
      });
    }

    const User = await FoodPartnerModel.findOne({ email });

    if (!User) {
      return res.status(400).json({
        message: "Invalid Email Or Password",
        success: false,
      });
    }

    const IsPasswordMatch = await Verify(password, User.password);


    if (!IsPasswordMatch) {
      return res.cookie("token", "").status(400).json({
        message: "Invalid Email Or Password",
        success: false,
      });
    }

    const JWT_TOKEN = Token({
      id: User._id,
      email,
      fullname:User.fullname,
    });


    return res.cookie("token", JWT_TOKEN,{httpOnly:true}).status(201).json({
      message: "Foodpartner Logged In Successfull",
      data:{
        email,
        fullname:User.fullname
      },
      success: true,
    });
  } catch (error) {
    console.log(error)
     return res.status(401).json({
      message:error.json,
      success:false
    })
  }
};

const FoodPartnerLogout = async (req,res) => {
    try {
        res.clearCookie('token')
        return res.status(200).json({
            message:"Logout Successfull",
            success:true
        })
    } catch (error) {
        
    }
}



export default {
  user:{
    register: Register,
    login: Login,
    logout: Logout,
},
partner: {
      register: FoodPartnerRegister,
      login: FoodPartnerLogin,
      logout: FoodPartnerLogout,
  }
};
