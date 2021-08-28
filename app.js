//jshint esversion:6
require("dotenv").config(); // encrypt variables from .env file
const express = require("express");
const ejs = require("ejs");
const mongoose = require("mongoose");
var md5 = require("md5"); // encryption

const app = express();

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
        if (foundUser.password === password) {
          console.log("Successfully Login");
          res.render("secrets"); // rendering secrets.ejs
        } else {
          console.log("Password Invalid");
        }
      } else {
        console.log("Email not exist");
      }
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post("/register", (req, res) => {
  const newUser = new User({
    email: req.body.username, // get the username data from register.ejs
    password: md5(req.body.password), // get the password data from register.ejs - hash the password
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

app.listen(3000, () => {
  console.log("Server Running in port 3000");
});
