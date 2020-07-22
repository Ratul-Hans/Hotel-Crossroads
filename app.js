var express=require("express");
var app=express();
var port=process.env.PORT || 3000;
var bodyParser=require("body-parser");
var passport=require("passport");
var methodOverride=require("method-override");
var User=require("./models/user"); 
var LocalStrategy=require("passport-local");
var passportLocalMongoose=require("passport-local-mongoose");  
var Campground=require("./models/hotel");
var Comment=require("./models/comment");
var Review=require("./models/review");
var flash=require("connect-flash");
var request=require("request");
var mongoose=require("mongoose");

mongoose.connect(process.env.DATABASEURL,{useNewUrlParser: true, useUnifiedTopology: true});
//var seedDB=require("./seed"); 
//seedDB();

var commentRoutes         = require("./routes/comments"),
    reviewRoutes          = require("./routes/reviews"),
    hotelsRoutes     = require("./routes/hotels"),
    indexRoutes           = require("./routes/index")

app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Ratul is awesome!!",
    resave: false,
    saveUninitialized: false
 }))
 
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req,res,next){
   res.locals.currentUser=req.user;
   if(req.user){
      User.findById(req.user._id).populate('notifications',null, {isRead: false }).exec(function(err,user){
        if(err){
            console.log(err.message);
        }
        else
        res.locals.notifications = user.notifications.reverse();
      });
    }
   res.locals.error=req.flash("error");
   res.locals.success=req.flash("success");
   next();
});


app.use(indexRoutes);
app.use("/hotels",hotelsRoutes);
app.use("/hotels/:id/comments",commentRoutes);
app.use("/hotels/:id/reviews", reviewRoutes);

app.listen(port,function(){
    console.log("Hotel Crossroads Server has started!!");
   });