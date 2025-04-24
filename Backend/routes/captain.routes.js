const express = require('express');
const router = express.Router();
const {body} = require('express-validator')
const captainController = require('../controllers/captain.controller');
const authMiddleware = require('../middlewares/auth.middleware');
router.post('/register', [
    body('email').isEmail().withMessage('Invalid message'),
    body('fullname.firstname').isLength({min: 3}).withMessage('First name must be atleast 3 chars long'),
    body('password').isLength({min : 6}).withMessage('Password must be atleast 6 chars long'),
    body('vehicle.color').isLength({min: 3}).withMessage('color must be atleast 3 characters long'),
    body('vehicle.model').isLength({min: 3}).withMessage('model must be atleast 3 characters long'),
    body('vehicle.plate').isLength({min: 3}).withMessage('plate must be atleast 3 characters long'),
    body('vehicle.vehicleType').isIn(['car', 'motorcycle', 'auto']).withMessage('invalid vehicle type'),
    body('vehicle.capacity').isInt({min: 1}).withMessage('capacity must be atleast 1'),
],
    captainController.registerCaptain
)
router.post('/login', [
    body('email').isEmail().withMessage('Invalid message'),
    body('password').isLength({min : 6}).withMessage('Password must be atleast 6 chars long')
],
    captainController.loginCaptain
)

router.get('/profile', authMiddleware.authCaptain, captainController.getCaptainProfile)
router.get('/logout', authMiddleware.authCaptain, captainController.logoutCaptain)
module.exports = router