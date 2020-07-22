var mongoose=require("mongoose");
var Campground=require("./models/campground");
var Comment=require("./models/comment");
var data = [
    {
        name: "Cloud's Rest", 
        image: "https://farm4.staticflickr.com/3795/10131087094_c1c0a1c859.jpg",
        description: "blah blah blah"
    },
    {
        name: "Lake Rudolph", 
        image: "https://q-cf.bstatic.com/images/hotel/max1024x768/229/229567284.jpg",
        description: "blah blah blah"
    },
    {
        name: "Canyon Floor", 
        image: "https://farm1.staticflickr.com/189/493046463_841a18169e.jpg",
        description: "blah blah blah"
    }
]
function seedDB(){
Campground.remove({},function(err){
  if(err)
  console.log(err)
  else
  {
      Comment.remove({},function(err){
          if(err)
          console.log(err)
          else
          {
            console.log("removed campground!!");  
            data.forEach(function(campground){
                 Campground.create(campground,function(err,cground){
                      if(err)
                      console.log(err)
                      else
                      {
                          console.log("added campground!!");
                          Comment.create({
                           text: "This place is great, but I wish there was internet",
                           author: "Homer"
                          },function(err,comment){
                              if(err)
                              console.log(err);
                              else{
                               cground.comments.push(comment);
                               cground.save();
                               console.log("Crerated new comment"); 
                           }
                               });
                      }
                      
                 });
            });
         }
       });
          }
      });
}
module.exports=seedDB;