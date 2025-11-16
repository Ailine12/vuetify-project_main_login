var admin = require("firebase-admin");

var serviceAccount = require("./notificaciones-6a125-firebase-adminsdk-fbsvc-c285331bf7.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const registrationToken 'f5qYGQYcpPiFz3Addlu_BS:APA91bGSaY70bXdOW8N1QlCksV86bWXgrXlDmb6zpep_nb8zYE1uW2yIEfeSjk2c4GuyAPkWN4AVnPBnUMe6cB0AfNC5Rp5tb7MnLPSq86pLGd6ufDzKQYY';

const message = {
    notification: {
        title: "Profe saqueme AU",
        body: "No le entiendo a la tarea"
    },
    webpush: {
        fcmOptions: {
            link: 'breakingews'
        }
    },
    token: registrationToken
};

admin.messaging().send(message)
    .then((response) => {
        console.log(Successfully sent message, response);
    })
    .catch((error) => {
        console.log('Error sending message', error);
    });

