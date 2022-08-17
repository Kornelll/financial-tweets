const mongoose = require('mongoose');
const appConfig = require('../config/appConfig');
const cryptojsUtil = require('../utils/crypto');

const PersonalInformationSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    fatherName: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
        required: true,
        validate: {
            validator: function (v) {
                return v.length == 12;
            },
            message: props => `${props.value} is not a valid 12 digits phone`
        }
    },
    dateOfBirth: {
        type: Date
    },
    gender: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        unique: '{VALUE} is already regisered',
        sparse: true,
        required: [true, 'Email is required'],
        validate: {
            validator: function (v) {
                return /[^@]+@[^@]+\.[a-zA-Z]{2,6}/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        }
    },
    cnic: {
        type: String,
        trim: true,
        unique: '{VALUE} is already regisered',
        sparse: true,
        required: [true, 'CNIC is required'],
        validate: {
            validator: function (v) {
                return v && v.length == 13;
            },
            message: props => `${props.value} is not a valid cnic!`
        }
    },
    accountStatus: {
        type: String,
        default: 'auto-approved'
        // default: 'waiting'
    },
    approvedAt: {
        type: Date
    },
    approvedBy: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: 'String'

    },
    password: { type: String, set: encrypt, select: false },
    resetToken: { type: String },
    activation: { 
        select: false,
        code: String,
        last: Date,
        tries: Number,
        lastResendTimestamp: Number
     },
    role: {
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'System.role._id'
        },
        name: String
    },
    college: {
        type: mongoose.Types.ObjectId,
        ref: 'College'
    },
    avatarSrc: String,

    address: {
        type: String
    },
    skillCategories: [{
        category: String,
        types: [String]
    }],

    configurations: {
        notifications: {
            viaSms: {
                type: Boolean,
                default: true
            },
            viaEmail: {
                type: Boolean,
                default: true
            },
            viaPushNotifications: {
                type: Boolean,
                default: true
            }
        }
    },
    

}, {
    timestamps: true
});

function encrypt(p) {
    return cryptojsUtil.encrypt(p, appConfig.PWD_SECRET);
}

PersonalInformationSchema.plugin(require('mongoose-beautiful-unique-validation'));

module.exports = mongoose.model('User', PersonalInformationSchema);