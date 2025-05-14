const rideService = require("../services/ride.service");
const { validationResult } = require("express-validator");
const mapService = require("../services/maps.service");
const { sendMessageToSocketId } = require("../socket");
const rideModel = require("../models/ride.model");
const { getCaptainsInTheRadius } = require("../services/maps.service");

module.exports.createRide = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        console.log("Creating ride request:", req.body);

        const ride = await rideService.createRide({
            user: req.user._id,
            pickup: req.body.pickup,
            destination: req.body.destination,
            vehicleType: req.body.vehicleType,
        });

        console.log("Ride created:", ride);

        const pickupCoordinates = await mapService.getAddressCoordinate(req.body.pickup);
        console.log("Pickup coordinates:", pickupCoordinates);

        const captainsInRadius = await getCaptainsInTheRadius(
            pickupCoordinates.ltd,
            pickupCoordinates.lng,
            5 // Default radius in kilometers
        );
        console.log("🚖 Captains in radius:", captainsInRadius);

        if (captainsInRadius.length === 0) {
            console.log("No captains found in radius!");
            return res
                .status(201)
                .json({ ...ride.toObject(), warning: "No nearby captains found" });
        }

        const rideWithUser = await rideModel
            .findOne({ _id: ride._id })
            .populate("user");

        console.log("📩 Ride data being sent to captain:", rideWithUser);

        captainsInRadius.forEach((captain) => {
            if (!captain.socketId) {
                console.log(`❌ Captain ${captain._id} does not have a valid socketId`);
            } else {
                console.log(
                    `📤 Emitting 'new-ride' to captain ${captain._id} via socket ${captain.socketId}`
                );
                sendMessageToSocketId(captain.socketId, {
                    event: "new-ride",
                    data: rideWithUser,
                });
            }
        });

        res.status(201).json(ride);
    } catch (error) {
        console.error("Error in createRide:", error);
        res.status(500).json({ message: error.message });
    }
};

module.exports.getFare = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { pickup, destination } = req.query;

  try {
    const fare = await rideService.getFare(pickup, destination);
    console.log("Pickup:", pickup); // Debug log
    console.log("Destination:", destination);
    return res.status(200).json(fare);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports.confirmRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.confirmRide({
      rideId,
      captain: req.captain,
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-confirmed",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.startRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId, otp } = req.query;

  try {
    console.log("Received rideId:", rideId);
    console.log("Received OTP:", otp);

    const ride = await rideService.startRide({
      rideId,
      otp,
      captain: req.captain,
    });

    console.log("Ride started successfully:", ride);

    // Fetch the ride with populated captain and user details
    const populatedRide = await rideModel.findById(rideId).populate('captain').populate('user');
    if (!populatedRide) {
      throw new Error("Ride not found");
    }

    // Emit the ride-started event with all required fields
    sendMessageToSocketId(populatedRide.user.socketId, {
      event: "ride-started",
      data: {
        captain: populatedRide.captain,
        destination: populatedRide.destination,
        fare: populatedRide.fare,
      },
    });

    return res.status(200).json(populatedRide);
  } catch (err) {
    console.error("Error in startRide:", err.message);
    return res.status(500).json({ message: err.message });
  }
};

module.exports.endRide = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { rideId } = req.body;

  try {
    const ride = await rideService.endRide({ rideId, captain: req.captain });

    sendMessageToSocketId(ride.user.socketId, {
      event: "ride-ended",
      data: ride,
    });

    return res.status(200).json(ride);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
