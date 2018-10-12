const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load Profile Model
const Profile = require('../../models/Profile');
// Load User Model
const User = require('../../models/User');

// @route   GET api/profile/test
// @desc    Tests the profile route, returning json
// @access  Public
router.get('/test', (req, res) => res.json({msg: "Profile Works!"}));

// @route   GET api/profile
// @desc    Gets the profile of the current user, using auth token for user details
// @access  Private
router.get('/', passport.authenticate('jwt', { session: false }, null), (req,res) => {

    const errors = {};

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'User has no profile';
                return res.status(404).json(errors)
            }
            res.json(profile);
        })
        .catch(e => res.status(404).json(e));
});

// @route   POST api/profile
// @desc    Create a user profile
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }, null), (req,res) => {
    //Get fields

    const profileFields = {};
    profileFields.user = req.user.id;

    res.send('Some Text to be replaced')
});

module.exports = router;