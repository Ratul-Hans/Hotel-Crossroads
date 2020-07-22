var mongoose=require("mongoose");
//SCHEMA SET-UP
var comment_schema=new mongoose.Schema({
    text: String,

   createdAt: { 
       type: Date, 
       default: Date.now 
           },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});
var Comment= mongoose.model("Comment",comment_schema);
module.exports=Comment;