//ROUTES
var express=require("express");
var router=express.Router();
var passport=require("passport");
var User=require("../models/user"); 
var Hotel=require("../models/hotel"); 
var Notification=require("../models/notifications"); 
var middleware=require("../middleware/index.js"); 
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");
//IMAGE UPLOAD
var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'daeqwemkc', 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});


router.get("/",function(req,res){
    res.render("landing");
   });
   
   //AUTH ROUTES
   router.get("/register",function(req,res){
    res.render("users/register"); 
  });
   router.post("/register",upload.single('profileimage'),function(req,res){
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
      if(err) {
        req.flash("error", err.message);
        return res.redirect("back");
      }
       // add cloudinary url for the image to the user object under image property
       req.body.profileimage = result.secure_url;
       // add image's public_id to user object
       req.body.profileimageid = result.public_id;
    
       var username=req.body.username;
       var password=req.body.password;
       var firstName=req.body.firstName;
       var lastName=req.body.lastName;
       var email= req.body.email;
       var profileimage=req.body.profileimage;
       var profileimageid=req.body.profileimageid;
   

         var newUser=new User({username: username,
          password:password,
          firstName:firstName,
          lastName:lastName,
          email:email,
          profileimage:profileimage,
          profileimageid:profileimageid
        });
        
         //FOR ADMIN
         if(req.body.adminCode === 'secretcode123') {
          newUser.isAdmin = true;
          req.flash("success","Signed in as Admin");
        }

         User.register(newUser,password,function(err,user){
                 if(err)
                 {
                  req.flash("error",err.message);   
                      res.redirect("register");
                 }
                 else{
                     passport.authenticate("local")(req,res,function(){
                      req.flash("success","Welcome to Hotel Crossroads!"+" "+"Nice to meet you"+" "+user.username);   
                      res.redirect("/hotels");
   
                     });
                   }
         });
        });
       });
       //LOGIN ROUTES
       router.get("/login",function(req,res){
        res.render("users/login");
         });
         //LOGIN LOGIC
         //MIDDLEWARE
         router.post("/login",passport.authenticate("local",{
                successRedirect:"/hotels",
                failureRedirect:"/login",
                successFlash: "Welcome to Hotel Crossroads!",
                failureFlash: "No user found"
         }),function(req,res){   
         
       });
       router.get("/logout",function(req,res){
              req.logout();
              req.flash("success","See You Later!")
              res.redirect("/hotels");
         });
  
         //USER PROFILE
         router.get("/users/:id",function(req,res){
          User.findById(req.params.id,function(err,user){
            if(err){
              req.flash("err", err.message);
              return res.redirect("back");
            }
            else{
                Hotel.find().where("author.id").equals(user._id).exec(function(err, hotels) {
                    if(err) {
                      req.flash("error", "Something went wrong.");
                      return res.redirect("/");
                    }
                    else
                    res.render("users/profile", {user:user, hotels: hotels});
                  });
                }
              });
            });
    
    //EDIT USER
router.get("/users/:id/edit",middleware.isLoggedIn,function(req,res){
  User.findById(req.params.id,function(err,user){
      if(err){
          req.flash("error","Sorry No User Found");
          res.redirect("back");
      }
      else{
      res.render("users/edit",{user:user});
      }
});
});
//PUT ROUTE
router.put("/users/:id",middleware.isLoggedIn,upload.single("profileimage"),function(req,res){
  User.findById(req.params.id, async function(err, user){
      if(err){
          req.flash("error",err.message);
          res.redirect("back");
      } 
      else{
          if(req.file){
              try{
                  var result=await cloudinary.v2.uploader.upload(req.file.path);
                  user.profileimageid = result.public_id;
                  user.profileimage = result.secure_url;
              }
              catch(err){
                 req.flash("error",err.message);
                 return res.redirect("back");
              }            
                  }
          
          user.username = req.body.username;
          user.firstName = req.body.first_name;
          user.lastName = req.body.last_name;
          user.email = req.body.email;
          user.save();    
          req.flash("success","Successfully Updated!");
          res.redirect("/users/"+req.params.id);
  }
});
});
           /* //FOLLOW USER
            router.get("/follow/:id",middleware.isLoggedIn,function(req,res){
              User.findByIdAndUpdate(req.params.id,function(err,user){
                eval(require("locus"));
               if(err)
               {
                req.flash("error", err.message);
                res.redirect("back");
               }
               else{
                   user.followers.push(req.user._id);//req.user._id is current user logged in
                   user.save();
                   req.flash("success", "Successfully followed " + user.username + "!");
                   res.redirect("/users/" + req.params.id);
                }
               });
            });*/

           /* router.get('/follow/:id', middleware.isLoggedIn, async function(req, res) {
              try {
                let user = await User.findById(req.params.id);
                user.followers.push(req.user._id);
                user.save();
                req.flash('success', 'Successfully followed ' + user.username + '!');
                res.redirect('/users/' + req.params.id);
              } catch(err) {
                req.flash('error', err.message);
                res.redirect('back');
              }
            }); */
       /*   //VIEW ALL NOTIFICATIONS
          router.get("/notifications", middleware.isLoggedIn,function(req, res) {
            User.findByIdAndUpdate(req.user._id).populate("currentUser.notifications.reverse()").exec(function(err,user){
      if(err){
    req.flash("error", err.message);
    res.redirect("back");
      }
      else{
      var allNotifications = user.notifications;
      res.render("notifications/index", {allNotifications:allNotifications});
      }
    });
  });*/

 /* router.get('/notifications', middleware.isLoggedIn, async function(req, res) {
    try {
      let user = await User.findById(req.user._id).populate({
        path: 'notifications',
        options: { sort: { "_id": -1 } }
      }).exec();
      let allNotifications = user.notifications;
      res.render('notifications/index', { allNotifications });
    } catch(err) {
      req.flash('error', err.message);
      res.redirect('back');
    }
  });*/
  /*  //HANDLE NOTIFICATIONS
router.get("/notifications/:id", middleware.isLoggedIn,function(req, res) {  
  Notification.findById(req.params.id,function(err,notification){
    if(err){
      req.flash('error', err.message);
      res.redirect('back');
    }
    else{   
            notification.isRead = true;
            notification.save();
            res.redirect("/campgrounds/"+notification.campgroundId); 
    }   
          });          
}); */

/*router.get('/notifications/:id', middleware.isLoggedIn, async function(req, res) {
  try {
    let notification = await Notification.findById(req.params.id);
    notification.isRead = true;
    notification.save();
    res.redirect("/campgrounds/"+notification.campgroundId);
  } catch(err) {
    req.flash('error', err.message);
    res.redirect('back');
  }
});*/

    //FORGOT PASSWORD
    router.get("/forgot",function(req,res){
      res.render("users/forgot");
  });
  router.post("/forgot",function(req,res,next){
        async.waterfall([
            function(done){
              crypto.randomBytes(20,function(err,buf){
                var token=buf.toString("hex");
                done(err,token);
              });
            },
            function(token, done) {
              User.findOne({email: req.body.email}, function(err, user) {
                if (!user) {
                  req.flash('error', 'No account with that email address exists.');
                  return res.redirect('/forgot');
                }
        
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        
                user.save(function(err) {
                  done(err, token, user);
                });
              });
            },
            function(token, user, done) {
              var smtpTransport = nodemailer.createTransport({
                service: 'Gmail', 
                auth: {
                  user: 'hotel.crossroadshelpdesk@gmail.com',
                  pass: process.env.GMAILPW
                }
              });
              var mailOptions = {
                to: user.email,
                from: 'hotel.crossroadshelpdesk@gmail.com',
                subject: 'Hotel Crossroads Password Reset Request',
                text: 'You are receiving this because you have requested the reset of the password for your account.\n\n' +
                  'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                  'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                  'If you did not request this, please ignore this email and your password will remain unchanged.\n'
              };
              smtpTransport.sendMail(mailOptions, function(err) {
                console.log('mail sent');
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
              });
            }

        ],function(err) {
          if (err) return next(err);
          res.redirect('/forgot');
        });
    });
    router.get('/reset/:token', function(req, res) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('users/reset', {token:req.params.token});
      });
    });
    
    router.post('/reset/:token', function(req, res) {
      async.waterfall([
        function(done) {
          User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }
            if(req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function(err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;
    
                user.save(function(err) {
                  req.logIn(user, function(err) {
                    done(err, user);
                  });
                });
              })
            } else {
                req.flash("error", "Passwords do not match.");
                return res.redirect('back');
            }
          });
        },
        function(user, done) {
          var smtpTransport = nodemailer.createTransport({
            service: 'Gmail', 
            auth: {
              user: 'hotel.crossroadshelpdesk@gmail.com',
              pass: process.env.GMAILPW
            }
          });
          var mailOptions = {
            to: user.email,
            from: 'hotel.crossroadshelpdesk@gmail.com',
            subject: 'Your password has been changed',
            text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
          });
        }
      ], function(err) {
        res.redirect('/hotels');
      });
    });
    //GET CONTACT FORM
    router.get("/contact", middleware.isLoggedIn, function(req,res){
       res.render("contact");
    });
    //POST CONTACT FORM
    router.post("/contact",function(req,res){
      
        let mailTransporter = nodemailer.createTransport({ 
          service: 'gmail', 
          auth: { 
              user: 'hotel.crossroadshelpdesk@gmail.com', 
              pass: process.env.GMAILPW
          } 
      });  
      let mailDetails = { 
          from: `${req.body.name}<${req.body.email}>`, 
          to: 'hotel.crossroadshelpdesk@gmail.com',  
          subject: 'Hotel Crossroads Contact Form', 
          text: req.body.message,
          html: '<strong>'+req.body.message+'</strong>',
      };  
      mailTransporter.sendMail(mailDetails, function(err, msg) { 
          if(err) { 
            console.log(err);
            req.flash("error","Sorry,something went wrong, please contact yelpcamp.helpdesk@gmail.com");
            res.redirect("back"); 
          } else { 
            req.flash("success","Thank you for your email , we will get back to you shortly.");
            res.redirect("back");
            console.log(body);
          } 
      });
  });
   module.exports=router;