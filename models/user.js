var mongoose=require("mongoose");
var passportLocalMongoose=require("passport-local-mongoose");
var user_schema=new mongoose.Schema({
   username:{type:String, unique:true,required:true},
   followers:
   [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      }
   ],
      notifications: [
         {
             type: mongoose.Schema.Types.ObjectId,
             ref: "Notification"
          }
       ],
   password:String,
   isAdmin: {type: Boolean,
             default: false 
            },
   profileimage: String,
   profileimageid: String,
   firstName: String,
   lastName: String,
   email: {type:String, unique:true, required: true},
   resetPasswordToken: String,
   resetPasswordExpires: Date
});
user_schema.plugin(passportLocalMongoose);
module.exports=mongoose.model("User",user_schema);