//jshint esversion:6
require("dotenv").config(); // encrypt variables from .env file
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-find-or-create");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

// logged out users
app.use(function (req, res, next) {
  if (!req.user)
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  next();
});

// using sessions for cookies
app.use(
  session({
    secret: "SampleSecret",
    resave: false,
    saveUninitialized: false,
  })
);

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// connect database
mongoose.connect("mongodb://localhost:27017/userAccountDB", {
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secret: String,
});

userSchema.plugin(passportLocalMongoose); // hashing passwords
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema, "User");

// Passport.js
passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets", // this is from authorized redirect url created in google console
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      console.log(profile);
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return cb(err, user);
      });
    }
  )
);

// home.ejs
app.get("/", (req, res) => {
  res.render("home");
});

// Sign in with google
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);

app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  }
);

// login.ejs
app.get("/login", (req, res) => {
  res.render("login");
});

// register.ejs
app.get("/register", (req, res) => {
  res.render("register");
});

// secrets.ejs
app.get("/secrets", (req, res) => {
  // autheticate before accessing secrets.ejs
  if (req.isAuthenticated()) {
    User.find({ secret: { $ne: null } }, (err, foundUser) => {
      if (err) {
        console.log(err);
      } else {
        if (foundUser) {
          res.render("secrets", { usersWithSecrets: foundUser });
        }
      }
    });
  } else {
    console.log("Failed to Access Secrets: User not Authenticated");
    res.redirect("/login"); // redirect to app.get('/login')
  }
});

// submit.ejs
app.get("/submit", (req, res) => {
  // autheticate before accessing secrets.ejs
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    console.log("Failed to Access Secrets: User not Authenticated");
    res.redirect("/login"); // redirect to app.get('/login')
  }
});

app.post("/submit", (req, res) => {
  const submittedSecret = req.body.secret;

  User.findById(req.user.id, (err, foundUser) => {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret; // change the user secret schema to value of submittedSecret
        foundUser.save().then((data) => {
          res.redirect("/secrets"); // redirect to app.get('/secrets')
        });
      }
    }
  });
});

// Login user
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

  // passport.js login aithenticate
  req.login(user, function (err) {
    if (err) {
      console.log("Login Failed");
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        console.log("Successfully Login");
        res.redirect("/secrets"); // redirect to app.get('/secrets')
      });
    }
  });
});

// Register user
// authenticate users using passport
app.post("/register", (req, res) => {
  User.register(
    { username: req.body.username },
    req.body.password,
    (err, user) => {
      if (err) {
        console.log(err);
        res.redirect("/register"); // redirect to app.get('/register')
      } else {
        passport.authenticate("local")(req, res, function () {
          console.log("Successfully Registered");
          res.redirect("/secrets"); // redirect to app.get('/secrets')
        });
      }
    }
  );
});

// logout user from secret.ejs
app.get("/logout", function (req, res) {
  req.logout();
  console.log("Logged Out");
  res.redirect("/");
});

// Server Runinnig
app.listen(3000, () => {
  console.log("Server Running in port 3000");
});
