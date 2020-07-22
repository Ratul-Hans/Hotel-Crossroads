//COMMENT ROUTES
var express=require("express");
var router=express.Router({mergeParams: true});
var Comment=require("../models/comment");
var Hotel=require("../models/hotel");
var middleware=require("../middleware/index.js");

router.get("/new", middleware.isLoggedIn, function(req,res){
    Hotel.findById(req.params.id,function(err,hotel){
      if(err)
      console.log(err)
      else
      res.render("comments/new",{hotel:hotel});
    });
    
  });
  router.post("/", middleware.isLoggedIn, function(req,res){
             Hotel.findById(req.params.id,function(err,hotel){
                 if(err)
                 console.log(err);
                 else
                 {
                     Comment.create(req.body.comment,function(err,comment){
                          if(err)
                          req.flash("error","Something went wrong");
                          else
                          {
                            comment.author.username=req.user.username;
                            comment.author.id=req.user._id;
                            comment.save();
                            hotel.comments.push(comment);
                            hotel.save();
                              req.flash("success","Successfully added comment");
                              res.redirect("/hotels/"+req.params.id);
  
                          }
                     });
                 }
             });
  });
  //EDIT COMMENTS
  router.get("/:comment_id/edit",middleware.checkCommentOwnership,function(req,res){
     Comment.findById(req.params.comment_id,function(err,foundComment){
                if(err)
                res.redirect("back");
                else
                res.render("comments/edit",{hotel_id: req.params.id,comment:foundComment});
     });    
  });
  //PUT COMMENTS(UPDATE)
  router.put("/:comment_id",middleware.checkCommentOwnership,function(req,res){
      Comment.findByIdAndUpdate(req.params.comment_id,req.body.comment,function(err,updatedComment){
      if(err)
      res.redirect("back");
      else
      res.redirect("/hotels/"+req.params.id);
      });
  });
  //DESTROY ROUTE
  router.delete("/:comment_id",middleware.checkCommentOwnership,function(req,res){
         Comment.findByIdAndRemove(req.params.comment_id,function(err){
            if(err)
            res.redirect("back");
            else{
              req.flash("error","Comment deleted");               
              res.redirect("/hotels/"+req.params.id);
            }
          });
  });
  
  module.exports=router;
  