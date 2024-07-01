import mongoose , { Schema } from "mongoose";
import mongooseAggregatePaginate from
 "mongoose-aggregate-paginate-v2";

const vidioSchema = new Schema(
    {
        vidiofile: {
            type: String, //cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        duration: {
            type : number, //cloudinary url
            required: true,
        },
        views: {
            type: number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true, 
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
    },
    {
        timestamps: true
    }
);


vidioSchema.plugin(mongooseAggregatePaginate);


export const Vidio = mongoose.model('Vidio', vidioSchema)