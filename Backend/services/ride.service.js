const rideModel = require('../models/ride.model');
const mapService = require('./maps.service');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

async function getFare(pickup, destination) {
    if (!pickup || !destination) {
        throw new Error('Pickup and destination are required');
    }

    console.log('Calculating fare for:', { pickup, destination }); // Debug log

    // Fetch coordinates for pickup and destination
    const pickupCoordinates = await mapService.getAddressCoordinate(pickup);
    const destinationCoordinates = await mapService.getAddressCoordinate(destination);

    console.log('Pickup Coordinates:', pickupCoordinates); // Debug log
    console.log('Destination Coordinates:', destinationCoordinates); // Debug log

    // Fetch distance and time using coordinates
    const distanceTime = await mapService.getDistanceTime(pickupCoordinates, destinationCoordinates);

    console.log('Distance and Time:', distanceTime); // Debug log

    // Fare calculation parameters
    const baseFare = {
        auto: 40, // Base fare for auto
        car: 60,  // Base fare for car
        moto: 30  // Base fare for moto
    };

    const perKmRate = {
        auto: 12, // Per kilometer rate for auto
        car: 18,  // Per kilometer rate for car
        moto: 10  // Per kilometer rate for moto
    };

    const perMinuteRate = {
        auto: 2.5, // Per minute rate for auto
        car: 3.5,  // Per minute rate for car
        moto: 2    // Per minute rate for moto
    };

    const minimumFare = {
        auto: 50, // Minimum fare for auto
        car: 80,  // Minimum fare for car
        moto: 40  // Minimum fare for moto
    };

    // Calculate fare for each vehicle type and round to two decimal places
    const fare = {
        auto: Math.max(
            baseFare.auto + (distanceTime.distance * perKmRate.auto) + (distanceTime.duration * perMinuteRate.auto),
            minimumFare.auto
        ).toFixed(2),
        car: Math.max(
            baseFare.car + (distanceTime.distance * perKmRate.car) + (distanceTime.duration * perMinuteRate.car),
            minimumFare.car
        ).toFixed(2),
        moto: Math.max(
            baseFare.moto + (distanceTime.distance * perKmRate.moto) + (distanceTime.duration * perMinuteRate.moto),
            minimumFare.moto
        ).toFixed(2)
    };

    console.log('Calculated Fare:', fare); // Debug log
    return fare;
}

module.exports.getFare = getFare;

function getOtp(num) {
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}

module.exports.createRide = async ({
    user, pickup, destination, vehicleType
}) => {
    if (!user || !pickup || !destination || !vehicleType) {
        throw new Error('All fields are required');
    }

    const fare = await getFare(pickup, destination);

    const ride = await rideModel.create({
        user,
        pickup,
        destination,
        otp: getOtp(6),
        fare: fare[vehicleType],
        status: 'pending',  // Set the initial status to 'pending'
    });

    return ride;
}

module.exports.confirmRide = async ({
    rideId, captain
}) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',  // Update status to 'accepted'
        captain: captain._id
    });

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    return ride;
}

module.exports.startRide = async ({ rideId, otp, captain }) => {
    console.log("Fetching ride with rideId:", rideId);

    const ride = await rideModel.findById(rideId).select('+otp');
    console.log("Fetched ride:", ride);

    if (!ride) {
        throw new Error("Ride not found");
    }

    console.log("Stored OTP:", ride.otp);
    console.log("Received OTP:", otp);

    // Ensure both OTPs are strings for comparison
    if (ride.otp.toString() !== otp.toString()) {
        throw new Error("Invalid OTP");
    }

    if (ride.captain.toString() !== captain._id.toString()) {
        throw new Error("You are not authorized to start this ride");
    }

    ride.status = "ongoing";
    await ride.save();

    return ride;
};

module.exports.endRide = async ({ rideId, captain }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('user').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'  // Update status to 'completed'
    });

    return ride;
}

module.exports.cancelRide = async ({ rideId }) => {
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'cancelled'  // Update status to 'cancelled'
    });

    return ride;
}
