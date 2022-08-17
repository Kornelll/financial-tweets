const webpush = require('web-push');
const SubscriptionModel = require('./subscription.model');

module.exports = {
    init: (app) => {

        const PUBLIC_VAPID =
            'BJijYMqvbKAAOWITtsy_rxwH8_WXiwG3U1OA8hBusf-9ip_Z9wIYehjyAuzi_eTjoxxkM4jm45zoMgoNOkKEkE0'
        const PRIVATE_VAPID = 'QE7LtbYMNobsh84m5wUGW6nwd-T0Fz0EJjPoSIOPszw'

        webpush.setVapidDetails('mailto:Kornell.olteanu@gmail.com', PUBLIC_VAPID, PRIVATE_VAPID);
        app.post('/api/v1/subscription/:userId', async (req, res) => {
            const subscription = req.body
            subscription.user = req.params.userId;
            if (subscription) {
                let record = await SubscriptionModel.findOneAndUpdate({ "keys.auth": subscription.keys.auth }, {
                    $set: subscription
                }, { upsert: true });
                try {
                    console.log(subscription, " is subscribed for notifications")
                    res.send(record);
                } catch (err) {
                    console.log(`Tried saving notification subscription but duplicate`);
                    res.send({ message: `Tried saving notification subscription but duplicate` });
                }
            }
        })
    },

    notifyAll: async (title, body, icon, link) => {
        try {
            let allSubscriptions = await SubscriptionModel.find().lean();
            return module.exports.sendToSubscriptions(allSubscriptions, title, body, icon);
        } catch (err) {
            console.warn("error in notifyAll ", err);
        }
    },

    notifyMulticast: async (userIds, title, body, link, icon) => {

        let allSubscriptions = await SubscriptionModel.find({ "user": { $in: userIds } }).lean();
        return module.exports.sendToSubscriptions(allSubscriptions, title, body, link, icon);
    },

    removeSubscription: async (subscription) => {
        if (subscription && subscription.keys) {
            let response = await SubscriptionModel.remove({ "keys.auth": subscription.keys.auth });
            console.log("remove subscription", subscription, response);
        }
    },

    sendToSubscriptions: async (subscriptions, title, body, link, icon) => {
        try {
            let notificationPayload = {
                notification: {
                    title,
                    body,
                    icon: icon || 'assets/icons/icon-512x512.png',
                    data: { url: link }
                },
            };

            let promises = [];

            console.log("> Sending notifications to ", subscriptions.length);
            const reflect = p => p.then(v => ({ v, status: "resolved" }),
                e => ({ e, status: "rejected" }));

            subscriptions.forEach(subscription => {
                promises.push(webpush.sendNotification(
                    subscription,
                    JSON.stringify(notificationPayload)
                ));
            })

            Promise.all(promises.map(reflect)).then(async function (results) {
                var rejected = results.filter(x => x.status === "rejected");
                if (rejected && rejected.length) {
                    console.log(`subscriptions deleted due to rejection: ${rejected.length}`)
                    await SubscriptionModel.remove({ endpoint: { $in: rejected.map(r => r.e.endpoint) } })
                }
                console.warn("notification all results", rejected);
            });

        } catch (err) {
            console.error("error in push-notification-manager notifyAll", err);
        }
    }

}