var express=require("express");
var router=express.Router();
var Hotel=require("../models/hotel");
var Review = require("../models/review");
var User=require("../models/user");
var Notification=require("../models/notifications");
var middleware=require("../middleware/index.js");
var request=require("request");
const url =require("url");
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
    var noMatch=null;
    var perPage = 8;
    var pageQuery = parseInt(req.query.page);
    var pageNumber = pageQuery ? pageQuery : 1;
   if(req.query.search){
        const regex=new RegExp(escapeRegex(req.query.search),"gi");
        Hotel.find({name: regex}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function(err,allHotels){
            Hotel.count().exec(function (err, count) {
            if(err){
                console.log(err);
            } 
            else{
                if(allHotels.length<1)
                noMatch="No hotels match that query, please try again";
                res.render("hotels/index",{hotels:allHotels,noMatch:noMatch,current:pageNumber,
                    pages: Math.ceil(count / perPage)});
            }
        });
        });
   }
   else{
     Hotel.find({}).skip((perPage * pageNumber) - perPage).limit(perPage).exec(function (err, all_hotels) {
        Hotel.count().exec(function (err, count) {
        if(err)
        console.log(err);
        else
        res.render("hotels/index",{hotels:all_hotels,currentUser:req.user,noMatch:noMatch,current: pageNumber,
            pages: Math.ceil(count / perPage)});
        });

    });
  }
});
router.post("/",middleware.isLoggedIn, upload.single('image'),function(req,res){
    cloudinary.v2.uploader.upload(req.file.path, function(err, result) {
        if(err) {
          req.flash("error", err.message);
          return res.redirect("back");
        }
      // add cloudinary url for the image to the campground object under image property
      req.body.image = result.secure_url;
      // add image's public_id to campground object
      req.body.imageId = result.public_id;
    var name=req.body.name;
    var image=req.body.image;
    var imageId=req.body.imageId;
    var description=req.body.description;
    var price=req.body.price;
    var placename=req.body.placename;
    var author={
        id: req.user._id,
        username: req.user.username
    }
 Hotel.create({
        name:name,
        image:image,
        imageId:imageId,
        description:description,
        price: price,
        placename:placename,
        author: author
    } ,function(err,hotel){
        if(err){
            req.flash("error", err.message);
            res.redirect("back");
        }
        else{   
            User.findById(req.user._id).populate('followers').exec(function(err,user){
                if(err)
                {
                    req.flash("error", err.message);
                    res.redirect("back");
                  }
                  else{
                  /*{
               var newNotification = {
                    username: req.user.username,
                    campgroundId: campground.id
                };
                user.followers.forEach(function(follower){
                    var notification = Object.assign({},newNotification);
                   // const notification = Object.create(newNotification);
                    follower.notifications.push(notification);
                    follower.save();
                });
                
                res.redirect("/campgrounds");
            }
            });*/
           /* try {
                let campground = await Campground.create(newCampground);
                let user = await User.findById(req.user._id).populate('followers').exec();
                let newNotification = {
                  username: req.user.username,
                  campgroundId: campground.id
                }
                for(const follower of user.followers) {
                  let notification = await Notification.create(newNotification);
                  follower.notifications.push(notification);
                  follower.save();
                }

                res.redirect("/campgrounds");
            } catch(err) {
              req.flash('error', err.message);
              res.redirect('back');
            }
          */
        
             res.redirect("/hotels");
        }
      }); 
 }
   
});
    });
});

    router.get("/new",middleware.isLoggedIn,function(req,res){
 res.render("hotels/new");
});
// Shows more Info About a Particular Hotel
router.get("/:id",function(req,res){
    Hotel.findById(req.params.id).populate("comments likes").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}
    }).exec(function(err,Hotelfound){
        if(err)
        console.log(err);
        else{
        request("https://api.opencagedata.com/geocode/v1/json?q="+Hotelfound.placename+"&key=869a04d47a2e418384f106d4b7352b8c&language=en&pretty=1",function(error,response,body){
            if(!error&&res.statusCode==200){
                var parse=JSON.parse(body);
                const current_url= new URL(parse.results[0].annotations.OSM.url);
                const search_params = current_url.searchParams;
                var lon=search_params.get('mlon');
                var lat=search_params.get('mlat');
                 
                //FOR WEATHER
                request("http://api.openweathermap.org/data/2.5/weather?lat="+lat+"&lon="+lon+"&units=metric&appid=42aef709c5ed8bffbb47d570d6c09d8f",function(error,response,body){
                    if(!error&&res.statusCode==200){
                        var parses=JSON.parse(body);
                        var date = require('dateformat');
                        var now = new Date();
                        var formatted = date(now,'dS,mmmm');
                        res.render("hotels/show",{hotel:Hotelfound,lon:lon,lat:lat,result:parses,date:formatted});
                }
            });
            }  
            });
        }
    });
    });    
    //EDIT ROUTE
router.get("/:id/edit",middleware.checkHotelOwnership,function(req,res){
                Hotel.findById(req.params.id,function(err,foundHotel){
                    if(err)
                    req.flash("error","Hotel not found");
                    else
                    res.render("hotels/edit",{hotel: foundHotel});
                });    
        });
           
//PUT ROUTE
router.put("/:id",middleware.checkHotelOwnership,upload.single("image"),function(req,res){
   
    Hotel.findById(req.params.id, async function(err, hotel){
        if(err){
            req.flash("error",err.message);
            res.redirect("back");
        } 
        else{
            if(req.file){
                try{
                    await cloudinary.v2.uploader.destroy(hotel.imageId);    
                    var result=await cloudinary.v2.uploader.upload(req.file.path);
                    hotel.imageId = result.public_id;
                    hotel.image = result.secure_url;
                }
                catch(err){
                   req.flash("error",err.message);
                   return res.redirect("back");
                }            
                    }
            
            hotel.name = req.body.name;
            hotel.placename = req.body.placename;
            hotel.price = req.body.price;
            hotel.description = req.body.description;
            hotel.save();    
            req.flash("success","Successfully Updated!");
            res.redirect("/hotels/"+req.params.id);
    }
    /*Campground.findByIdAndUpdate(req.params.id,req.body.campground,function(err,updatedCampground){
        if(err)
        console.log(err)
        else
        res.redirect("/campgrounds/"+req.params.id);*/

    });
    
});
//Destroy Route
router.delete("/:id",middleware.checkHotelOwnership,function(req,res){
    Hotel.findById(req.params.id,async function(err,hotel){
          if(err){
             req.flash("error",err.message);
             return res.redirect("back");
          }
          else{
              try{
              await cloudinary.v2.uploader.destroy(hotel.imageId); 
              hotel.remove();
              req.flash("success",hotel.name+" "+"deleted successfully!");
              res.redirect("/hotels");
              }
              catch(err){
                req.flash("error",err.message);
                return res.redirect("back");
            
              }          
            }    
        });
});
//LIKE ROUTE
router.post("/:id/like",function(req,res){
    Hotel.findById(req.params.id,function (err, foundHotel) {
   if(err){
    console.log(err);
    return res.redirect("/hotels");
}
var foundUserLike=foundHotel.likes.some(function(like){
    return like.equals(req.user._id);
});
if (foundUserLike) {
    // user already liked, removing like
    foundHotel.likes.pull(req.user._id);
} else {
    // adding the new user like
    foundHotel.likes.push(req.user._id);
}

foundHotel.save(function (err) {
    if (err) {
        console.log(err);
        return res.redirect("/hotels");
    }
    return res.redirect("/hotels/" + foundHotel._id);

    }); 
});
});
//FUZZY SEARCH FUNCTION
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
module.exports=router;