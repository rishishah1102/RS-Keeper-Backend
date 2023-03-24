const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../Models/userModel');
const verifyToken = require('../MiddleWare/auth');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

let token;

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback",
}, async function (accessToken, refreshToken, profile, done) {
        const user = new User({
            email: profile.emails[0].value,
        });

        try {
            const foundUser = await User.findOne({ email: user.email });
            if (foundUser) {
                done(null, foundUser);
            } else {
                const saveUser = await user.save();
                done(null, saveUser);
            }
        } catch (err) {
            console.log(err);
        }
    }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_ID,
    clientSecret: process.env.FACEBOOK_SECRET,
    callbackURL: "/auth/facebook/callback"
}, async function (accessToken, refreshToken, profile, done) {
        const user = new User({
            email: profile.emails[0].value,
        });

        try {
            const foundUser = await User.findOne({ email: user.email });
            if (foundUser) {
                done(null, foundUser);
            } else {
                const saveUser = await user.save();
                done(null, saveUser);
            }
        } catch (err) {
            console.log(err);
        }
    }
));

router.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));

router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/', session: false }), (req, res) => {
    // Redirect user to frontend application after successful authentication
    token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.TOKEN_KEY,
        {expiresIn: '5d'}
    );
    res.redirect(`https://rs-keep.netlify.app/notes?token=${token}`);
});

router.get('/auth/facebook', passport.authenticate('facebook', { scope: ['profile', 'email'], session: false }));

router.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/', session: false }), (req, res) => {
    // Successful authentication, redirect home.
    token = jwt.sign(
        { id: req.user._id, email: req.user.email },
        process.env.TOKEN_KEY,
        {expiresIn: '5d'}
    );
    res.redirect(`https://rs-keep.netlify.app/notes?token=${token}`);
});

router.get('/notes', verifyToken, async (req, res) => {
    const email = req.user.email;
    try {
        const findNotes = await User.findOne({ email: email }, { notes: 1 });
        res.status(200).send({ notes: findNotes.notes });
    } catch (err) {
        res.status(500).send({ message: "Server Error" });
    }
});

router.post('/notes', verifyToken, async (req, res) => {
    const notes = req.body;
    const email = req.user.email;
    try {
        const finduser = await User.updateOne({ email: email }, { $push: { notes: notes } });
        res.status(200).send({ message: "The note is successfully stored in db" });
    } catch (err) {
        res.status(500).send({ message: "Server Error" });
    }
});

router.post('/deletenote', verifyToken, async (req, res) => {
    const email = req.user.email;
    const { index } = req.body;
    try {
        const update = await User.updateOne({ email: email }, { $unset: { [`notes.${index}`]: 1 } });
        const update2 = await User.updateOne({ email: email }, { $pull: { notes: null } });
        res.status(200).send({ message: "The note is successfully upadated in db" });
    } catch (err) {
        res.status(500).send({ message: "Server Error" });
    }
});

module.exports = router;