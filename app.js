//jshint esversion:6
require("dotenv").config(); // encrypt variables from .env file
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(function (req, res, next) {
  if (!req.user)
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  next();
}); // logged out users

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

mongoose.connect("mongodb://localhost:27017/userAccountDB", {
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose); // hashing passwords

const User = mongoose.model("User", userSchema, "User");

// Passport.js
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// home.ejs
app.get("/", (req, res) => {
  res.render("home");
});

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
    res.render("secrets");
  } else {
    console.log("Failed to Access Secrets: User not Authenticated");
    res.redirect("login"); // redirect to app.get('/login')
  }
});

// login user
app.post("/login", (req, res) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });

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
