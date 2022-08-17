const UserModel = require('../models/users.model');
const SystemModel = require('../models/systems.model');
const fs = require('fs');
const zipFolder = require('zip-folder');

module.exports = {
    seed: async () => {
        console.log("> Running seeder ...");
        ///////////////////////////////////////
        console.log("> Creating acl ...");
        try {
            if (process.env.SEED || !await SystemModel.findOne({ 'key': 'acl' })) {
                await SystemModel.findOneAndUpdate({ 'key': 'acl' }, ACL_DATA, { upsert: true });
                console.log(`> ACL seed written! process.env.SEED: ${process.env.SEED}`);
            } else {
                console.log(`> ACL seed skipped, already present`)
            }
        } catch (err) {
            console.log(`> ACL seed skipped`, err);
        }

        ///////////////////////////////////////
        console.log("> Creating admin / accounts ...");
        let users = [
            {
                "name": "admin",
                "phone": "000000000000",
                "email": "admin@test.com",
                "cnic": "1234567891234",
                "password": "12345678",
                "accountStatus": "approved",
                "role": {
                    "_id": "5da635754bfd75273d779e87",
                    "name": "admin"
                }
            }
        ];
        try {
            for (let i = 0; i < users.length; i++) {
                let user = users[i];
                await UserModel.findOneAndUpdate({ "email": user.email }, user, { upsert: true });
                console.log(`> New ${user.name} account created/upserted`)
            }
        } catch (err) { console.log("> Admin account creation skipped, Already present or could be error transaction!", err) }
        console.log("> Seed Done!");
    },
    saveFile: (file, relativePath, filename) => {
        let basePath = `${process.cwd()}/private/${relativePath}`;
        try { fs.mkdirSync(basePath, { recursive: true }); } catch (err) { }
        let fileAbsolutePath = `${basePath}/${filename}`;
        fs.writeFileSync(fileAbsolutePath, file);
        return { avatarSrc: `private/${relativePath}/${filename}`, fileAbsolutePath };
    },
    saveBase64AsImage: (avatarBase64, relativePath, filename) => {
        let basePath = `${process.cwd()}/private/${relativePath}`;
        try { fs.mkdirSync(basePath, { recursive: true }); } catch (err) { }
        let fileAbsolutePath = `${basePath}/${filename}`;
        avatarBase64 = avatarBase64.replace(/^data:image\/png;base64,/, "");
        fs.writeFileSync(fileAbsolutePath, avatarBase64, 'base64');
        return { avatarSrc: `private/${relativePath}/${filename}`, fileAbsolutePath };
    },
    saveAvatar: (avatarBase64, relativePath, appId) => {
        if (!avatarBase64 || !appId) {
            return;
        }
        let filename = `${appId}.png`;
        // let relativePath = 'personal/photos';

        return module.exports.saveBase64AsImage(avatarBase64, relativePath, filename);
    },
    getImageBase64FromApplication: (application) => {

        try {
            // function to encode file data to base64 encoded string
            var bitmap = fs.readFileSync(application.personal.avatarSrc);
            // convert binary data to base64 encoded string
            return new Buffer(bitmap).toString('base64');
        } catch (err) {
            throw err
        }
    },

    censorWord: (str) => {
        return str[0] + "*".repeat(str.length - 2) + str.slice(-1);
    },

    censorEmail: (email) => {
        var arr = email.split("@");
        return (
            module.exports.censorWord(arr[0]) +
            "@" +
            module.exports.censorWord(arr[1])
        );
    },

    maskPhone: (phone) => {
        
        //for data export e.g. convert ""923039593992"" to "92-303-9593992"
        return `${phone.substring(0, 2)}-${phone.substring(2, 5)}-${phone.substring(5, 15)}`;
    }
}


var ACL_DATA = {
    "key": "acl",
    "roles": [{
        "_id": "5da635754bfd75273d779e87",
        "name": "admin",
        "permissions": [
            { "_id": "5e0b45c77b1e7229992afab3", "module": "acl", "code": "conf_view", "name": "View Configurations" },
            { "_id": "5e0b45c77b1e7229992afab2", "module": "acl", "code": "acl_view", "name": "View ACL" },
            { "_id": "5e0b45c77b1e7229992afab1", "module": "acl", "code": "role_add", "name": "Add role" },
            { "_id": "5e0b45c77b1e7229992afab0", "module": "acl", "code": "role_edit", "name": "Edit role" },
            { "_id": "5e0b45c77b1e7229992afaaf", "module": "acl", "code": "role_delete", "name": "Delete role" },
            { "_id": "5e0b45c77b1e7229992afaae", "module": "users", "code": "user_view_sec", "name": "View users section" },
            { "_id": "5e0b45c77b1e7229992afaad", "module": "users", "code": "user_add", "name": "Add users" },
            { "_id": "5e0b45c77b1e7229992afaac", "module": "users", "code": "user_add_bulk", "name": "Bulk Add users" },
            { "_id": "5e0b45c77b1e7229992afaab", "module": "users", "code": "user_edit", "name": "Edit users" },
            { "_id": "5e0b45c77b1e7229992afaaa", "module": "users", "code": "user_delete", "name": "Delete users" },
            { "_id": "5e0b45c77b1e7229992afaa9", "module": "users", "code": "user_approve", "name": "Approve users" },
            { "_id": "5e0b45c77b1e7229992afaa9", "module": "users", "code": "user_view_all", "name": "" },
            { "_id": "5e0b45c77b1e7229992afaa8", "module": "users", "code": "user_assign_other_dpt", "name": "" },
            { "_id": "5e16086e00189e153d78012d", "module": "release", "code": "release_add", "name": "Add release notes" }, { "_id": "5e16086e00189e153d78012c", "module": "release", "code": "release_edit", "name": "Edit release notes" }, { "_id": "5e16086e00189e153d78012b", "module": "release", "code": "release_delete", "name": "Delete release notes" },

            { "_id": "5e0b45c77b1e7229992afac8", "module": "general", "code": "manage_companies", "name": "" },
            { "_id": "5e0b45c77b1e7229992afad8", "module": "general", "code": "manage_tweets", "name": "Manage Tweets" },
        ]
    },
    { "_id": "5da635754bfd75273d779e86", "name": "user", "permissions": [] },
    ],
};
module.exports.ACL_DATA = ACL_DATA;