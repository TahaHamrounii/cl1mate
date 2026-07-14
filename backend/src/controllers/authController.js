const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretjwtkeyforwastecollectionsystem123!', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400);
      return next(new Error('User already exists'));
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
    });

    if (user) {
      res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar || '',
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400);
      return next(new Error('Invalid user data'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Auth user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user by email and select password explicitly
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      if (user.role !== 'admin' && user.status && user.status !== 'active') {
        res.status(403);
        const errMsg = user.status === 'rejected'
          ? 'Your account has been rejected by the Admin'
          : 'Your account is pending activation by the Admin';
        return next(new Error(errMsg));
      }

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar || '',
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(401);
      return next(new Error('Invalid email or password'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 * @access  Private
 */
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        success: true,
        data: user,
      });
    } else {
      res.status(404);
      return next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile avatar
 * @route   PUT /api/auth/profile/avatar
 * @access  Private
 */
const updateUserAvatar = async (req, res, next) => {
  try {
    const { avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.avatar = avatar;
      await user.save();

      res.json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
        },
      });
    } else {
      res.status(404);
      return next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateUserProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phoneNumber, birthday, gender, streetAddress, city, country, zipCode } = req.body;
    const user = await User.findById(req.user._id);

    if (user) {
      user.firstName = firstName !== undefined ? firstName : user.firstName;
      user.lastName = lastName !== undefined ? lastName : user.lastName;
      user.name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name;
      user.phone = phoneNumber !== undefined ? phoneNumber : user.phone;
      user.birthday = birthday !== undefined ? birthday : user.birthday;
      user.gender = gender !== undefined ? gender : user.gender;
      user.streetAddress = streetAddress !== undefined ? streetAddress : user.streetAddress;
      user.city = city !== undefined ? city : user.city;
      user.country = country !== undefined ? country : user.country;
      user.zipCode = zipCode !== undefined ? zipCode : user.zipCode;

      await user.save();

      res.json({
        success: true,
        data: user,
      });
    } else {
      res.status(404);
      return next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update user live location coordinates
 * @route   PUT /api/auth/current-location
 * @access  Private
 */
const updateUserLocation = async (req, res, next) => {
  try {
    const { lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          currentLocation: {
            lat: Number(lat),
            lng: Number(lng),
            updatedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: false }
    );

    if (user) {
      res.json({
        success: true,
        message: 'Location updated successfully',
      });
    } else {
      res.status(404);
      return next(new Error('User not found'));
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserAvatar,
  updateUserProfile,
  updateUserLocation,
};
