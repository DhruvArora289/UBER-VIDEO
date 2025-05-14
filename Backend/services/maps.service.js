const axios = require("axios");
const captainModel = require("../models/captain.model");
require("dotenv").config();

// ✅ 1. Get Coordinates from Address using GraphHopper Geocoding API
module.exports.getAddressCoordinate = async (address) => {
  const apiKey = process.env.GRAPHHOPPER_API_KEY;
  const url = `https://graphhopper.com/api/1/geocode?q=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  try {
    console.log("Fetching coordinates for address:", address); // Debug log
    console.log("GraphHopper Geocoding API URL:", url); // Debug log

    const { data } = await axios.get(url);
    console.log("GraphHopper Geocoding Response:", data); // Debug log

    if (!data.hits || data.hits.length === 0) {
      console.warn("No geocoding results for address:", address);
      throw new Error(`No geocoding results for address: ${address}`);
    }

    const { point } = data.hits[0];
    return {
      ltd: point.lat,
      lng: point.lng,
    };
  } catch (err) {
    console.error("Geocoding Error:", err.response?.data || err.message); // Debug log
    throw new Error(`Unable to fetch coordinates for address: ${address}`);
  }
};

// ✅ 2. Get Distance and Time using GraphHopper API
module.exports.getDistanceTime = async (origin, destination) => {
  const apiKey = process.env.GRAPHHOPPER_API_KEY;
  const url = `https://graphhopper.com/api/1/route?point=${origin.ltd},${origin.lng}&point=${destination.ltd},${destination.lng}&vehicle=car&locale=en&calc_points=false&key=${apiKey}`;

  try {
    console.log("GraphHopper API URL:", url); // Debug log

    const response = await axios.get(url);
    console.log("GraphHopper Response:", response.data); // Debug log

    const path = response.data.paths[0];
    return {
      distance: (path.distance / 1000).toFixed(2), // Convert meters to kilometers
      duration: (path.time / 60000).toFixed(2), // Convert milliseconds to minutes
    };
  } catch (err) {
    console.error("GraphHopper Error:", err.response?.data || err.message); // Debug log
    throw new Error(`Unable to fetch distance and time for coordinates: ${JSON.stringify(origin)} to ${JSON.stringify(destination)}`);
  }
};

// ❌ 3. Autocomplete not supported in GraphHopper Free
// ✅ 2. Autocomplete using Nominatim
module.exports.getAutoCompleteSuggestions = async (input) => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    input
  )}&addressdetails=1`;

  try {
    console.log("Autocomplete Input:", input); // Debug log
    const { data } = await axios.get(url, {
      headers: { "User-Agent": "YourAppName/1.0" }, // Required by Nominatim
    });

    if (!data || data.length === 0) {
      console.warn("No autocomplete results for input:", input); // Log warning
      return []; // Return an empty array instead of throwing an error
    }

    // Return the first 5 suggestions
    return data.slice(0, 5).map((location) => ({
      label: location.display_name,
      latitude: location.lat,
      longitude: location.lon,
    }));
  } catch (err) {
    console.error("Autocomplete Error:", err.response?.data || err.message);
    throw new Error("Failed to fetch autocomplete suggestions");
  }
};

// ✅ 4. Get Captains in Radius (No changes needed)
module.exports.getCaptainsInTheRadius = async (ltd, lng, radius) => {
  if (
    typeof ltd !== "number" ||
    typeof lng !== "number" ||
    typeof radius !== "number"
  ) {
    throw new Error("Invalid parameters provided to getCaptainsInTheRadius");
  }

  console.log("Searching for captains near:", { ltd, lng, radius });

  const captains = await captainModel.find({
    location: {
      $geoWithin: {
        $centerSphere: [[lng, ltd], radius / 6371], // GeoJSON expects [lng, lat]
      },
    },
    isAvailable: true,
    status: "active", // Ensure only active captains are included
  });

  console.log(
    "Found captains:",
    captains.map((c) => ({
      id: c._id,
      location: c.location,
      socketId: c.socketId,
    }))
  );

  return captains;
};
