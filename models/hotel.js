var mongoose=require("mongoose");

//SCHEMA SET-UP
var hotel_schema=new mongoose.Schema({
    name: String,
    image: String ,
    imageId: String,
    description: String,
    price: String,
    placename: String,
   createdAt: { 
       type: Date, 
       default: Date.now 
    },
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    reviews: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review"
        }
    ],
    rating: {
        type: Number,
        default: 0
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    }
});

var Hotel= mongoose.model("Hotel",hotel_schema);
module.exports=Hotel;