const mongoose = require('mongoose');

const ModelSchema = mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    },
    endpoint: {
        type: String,
        required: true,
        trim: true
    },
    expirationTime: {
        type: mongoose.Schema.Types.Mixed
    },
    keys: {
        auth: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            sparse: true
        },
        p256dh: {
            type: String,
            required: true,
            trim: true
        }
    }
}, {
    timestamps: true
});

ModelSchema.plugin(require('mongoose-beautiful-unique-validation'));

ModelSchema.pre('remove', { query: true }, async function (next) {

    next();
});

module.exports = mongoose.model('NotificationSubscription', ModelSchema);