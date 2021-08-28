//jshint esversion:6
require("dotenv").config(); // encrypt variables from .env file
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt"); // hashing encryption

const app = express();
const saltRounds = 10;

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/userAccountDB", {
  useNewUrlParser: true,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

const User = mongoose.model("User", userSchema, "User");

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

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  User.findOne({ email: username })
    .then((foundUser) => {
      if (foundUser) {
        console.log("Email Exist");
        bcrypt.compare(password, foundUser.password, function (err, result) {
          if (result === true) {
            console.log("Successfully Login");
            res.render("secrets");
          } else {
            console.log("Invalid Password");
            res.redirect("/login");
          }
        });
      } else {
        console.log("Email not exist");
        res.redirect("/login");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/register", (req, res) => {
  bcrypt.hash(req.body.password, saltRounds, function (err, hash) {
    const newUser = new User({
      email: req.body.username, // get the username data from register.ejs
      password: hash, // get the password data from register.ejs - hash the password
    });
    newUser
      .save()
      .then((data) => {
        console.log("Registered Successfully");
        res.render("secrets"); // rendering secrets.ejs
      })
      .catch((err) => {
        console.log("Register Failed");
        console.log(err);
      });
  });
});

app.listen(3000, () => {
  console.log("Server Running in port 3000");
});
