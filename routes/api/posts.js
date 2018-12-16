const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');

// Models
const Post = require('../../models/Posts');
const Profile = require('../../models/Profile');

// Post validation
const validatePostInput = require('../../validation/post');

// @route   GET api/posts/test
// @desc    Tests the posts route, returning json
// @access  Public
router.get('/test', (req, res) => res.json({msg: "Posts Works!"}));

// @route   GET api/posts
// @desc    Get posts
// @access  Public
router.get('/', (req,res) => {
    Post.find()
        .sort({date: -1})
        .then(posts => res.json(posts))
        .catch(e => res.status(404).json({noposts: e}));
});

// @route   GET api/posts/:id
// @desc    Get single post by id
// @access  Public
router.get('/:id', (req,res) => {
    Post.findById(req.params.id)
        .then(post => res.json(post))
        .catch(e => res.status(404).json({nopostfound: e}));
});

// @route   POST api/posts
// @desc    Create post
// @access  Private
router.post('/', passport.authenticate('jwt', { session: false }, null), (req, res) => {

    const {errors, isValid} = validatePostInput(req.body);

    //check validation
    if (!isValid) {
        return res.status(400).json(errors);
    }

    const newPost = new Post({
        text: req.body.text,
        name: req.body.name,
        avatar: req.body.avatar,
        user: req.user.id
    });

    newPost.save()
        .then(post => res.json(post));

});

// @route   DELETE api/posts/:id
// @desc    delete post by id
// @access  Private
router.delete('/:id', passport.authenticate('jwt', { session: false }, null), (req, res) => {

    Profile.findOne({ user: req.user.id })
        .then(() => {
            Post.findById(req.params.id)
                .then(post => {
                    // Check for post owner
                    if(post.user.toString() !== req.user.id) {
                        return res.status(401).json({ auth: 'user not authorised '});
                    }

                    // Delete
                    post.remove()
                        .then(() => res.json({ success: true }));
                })
                .catch(e => res.status(404).json({ nopost: e }));
        })
});

// @route   POST api/posts/like/:id
// @desc    Add a like to a post
// @access  Private
router.post('/like/:id', passport.authenticate('jwt', { session: false }, null), (req, res) => {

    Profile.findOne({ user: req.user.id })
        .then(() => {
            Post.findById(req.params.id)
                .then(post => {
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
                        return res.status(400).json({ alreadyliked: 'user already liked this post' });
                    }

                    // Add user id to likes array
                    post.likes.unshift({ user: req.user.id });

                    post.save()
                        .then(post => res.json(post));
                })
                .catch(e => res.status(404).json({ nopost: e }));
        })
});

// @route   POST api/posts/unlike/:id
// @desc    Remove a like from a post
// @access  Private
router.post('/unlike/:id', passport.authenticate('jwt', { session: false }, null), (req, res) => {

    Profile.findOne({ user: req.user.id })
        .then(() => {
            Post.findById(req.params.id)
                .then(post => {
                    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
                        return res.status(400).json({ notliked: 'You have not yet liked this post' });
                    }

                    // Get remove index
                    const removeIndex = post.likes
                        .map(item => item.user.toString())
                        .indexOf(req.user.id);

                    post.likes.splice(removeIndex, 1);

                    post.save()
                        .then(post => res.json(post));
                })
                .catch(e => res.status(404).json({ nolike: e }));
        })
});

module.exports = router;