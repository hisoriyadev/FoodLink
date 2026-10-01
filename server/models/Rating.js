import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    raterRole: {
      type: String,
      enum: ['ngo', 'donor'],
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    review: {
      type: String,
      maxlength: 500,
    },
    // Volunteer's own feedback on the assignment
    volunteerFeedback: {
      type: String,
      maxlength: 1000,
    },
    tags: [
      {
        type: String,
        enum: [
          'On Time',
          'Careful Handling',
          'Friendly',
          'Professional',
          'Excellent Communication',
          'Needs Improvement',
          'Late',
          'Poor Handling',
        ],
      },
    ],
  },
  { timestamps: true }
);

// Prevent duplicate ratings per rater per donation
ratingSchema.index({ donation: 1, ratedBy: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);
export default Rating;
