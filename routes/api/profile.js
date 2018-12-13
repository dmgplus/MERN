const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Load validation
const validateProfileInput = require('../../validation/profile');
const validateExpInput = require('../../validation/experience');
const validateEduInput = require('../../validation/education');

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

// @route   GET api/profile/handle/:handle
// @desc    Get profile by a specific handle
// @access  Public
router.get('/handle/:handle', (req,res) => {

    const errors = {};

    Profile.findOne({ handle: req.params.handle })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'There is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(e => res.status(404).json(e));
});

// @route   GET api/profile/user/:user_id
// @desc    Get profile by a specific user id
// @access  Public
router.get('/user/:user_id', (req,res) => {

    const errors = {};

    Profile.findOne({ user: req.params.user_id })
        .populate('user', ['name', 'avatar'])
        .then(profile => {
            if (!profile) {
                errors.noprofile = 'There is no profile for this user';
                return res.status(404).json(errors);
            }
            res.json(profile);
        })
        .catch(e => res.status(404).json(e));
});

// @route   GET api/profile/all
// @desc    Get all profiles in json object
// @access  Public
router.get('/all', (req,res) => {

    const errors = {};

    Profile.find()
        .populate('user', ['name', 'avatar'])
        .then(profiles => {
            if (!profiles) {
                errors.noprofile = 'There are no profiles!';
                return res.status(404).json(errors);
            }
            res.json(profiles);
        })
        .catch(e => res.status(404).json(e));
});

// @route   POST api/profile
// @desc    Create or Edit/Update a user profile
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }, null), (req,res) => {

    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    //Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if(req.body.handle) profileFields.handle = req.body.handle;
    if(req.body.company) profileFields.company = req.body.company;
    if(req.body.website) profileFields.website = req.body.website;
    if(req.body.location) profileFields.location = req.body.location;
    if(req.body.bio) profileFields.bio = req.body.bio;
    if(req.body.status) profileFields.status = req.body.status;
    if(req.body.githubusername) profileFields.githubusername = req.body.githubusername;

    // Skills - split into array
    if (typeof req.body.skills !== 'undefined') {
        profileFields.skills = req.body.skills.split(',');
    }

    // Social
    profileFields.social = {};
    if(req.body.youtube) profileFields.social.youtube = req.body.youtube;
    if(req.body.twitter) profileFields.social.twitter = req.body.twitter;
    if(req.body.facebook) profileFields.social.facebook = req.body.facebook;
    if(req.body.linkedin) profileFields.social.linkedin = req.body.linkedin;
    if(req.body.instagram) profileFields.social.instagram = req.body.instagram;

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            if(profile) {
                // This is a profile Update!
                console.log("Updating profile");
                Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                )
                    .then(profile => res.json(profile));
            } else {
                // This is a New Profile!
                // Check if the handle exists
                console.log("Creating new profile");
                Profile.findOne({ handle: profileFields.handle })
                    .then(profile => {
                        if(profile) {
                            errors.handle = 'That handle already exists';
                            res.status(404).json(errors);
                        }
                        //Save Profile
                        new Profile(profileFields).save()
                            .then(profile => res.json(profile));
                    });
            }
        });
    }
);

// @route   POST api/profile/experience
// @desc    Add experience to profile
// @access  Private
router.post('/experience', passport.authenticate('jwt', { session: false }, null), (req, res) => {

    const { errors, isValid } = validateExpInput(req.body);

    // Check Validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const newExp = {
                title: req.body.title,
                company: req.body.company,
                location: req.body.location,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description
            };

            // Add to Experience array
            profile.experience.unshift(newExp);
            profile.save()
                .then(profile => res.json(profile));
        })
        .catch(e => res.status(404).json(e));
});

// @route   POST api/profile/education
// @desc    Add experience to profile
// @access  Private
router.post('/education', passport.authenticate('jwt', { session: false }, null), (req, res) => {

    const { errors, isValid } = validateEduInput(req.body);

    // Check Validation
    if(!isValid) {
        return res.status(400).json(errors);
    }

    Profile.findOne({ user: req.user.id })
        .then(profile => {
            const newEdu = {
                school: req.body.school,
                degree: req.body.degree,
                fieldofstudy: req.body.fieldofstudy,
                from: req.body.from,
                to: req.body.to,
                current: req.body.current,
                description: req.body.description
            };

            // Add to Experience array
            profile.education.unshift(newEdu);
            profile.save()
                .then(profile => res.json(profile));
        })
        .catch(e => res.status(404).json(e));
});

module.exports = router;