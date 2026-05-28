const firebase = require("firebase/app");
require("firebase/firestore");
require("firebase/auth");
require("firebase/storage");

export class Firebase {
    constructor() {
        this._config = {
            apiKey: "AIzaSyD--yKs3F53VYSkI2I9oRhYCAaqWjM0F1Q",
            authDomain: "whatsapp-clone-78124.firebaseapp.com",
            projectId: "whatsapp-clone-78124",
            messagingSenderId: "589551792845",
            appId: "1:589551792845:web:ea5dc143257f4b40e12f84",
            measurementId: "G-H5GQJCDPH6"
        };

        this.init();
    }

    init(){

        if (!window._initializedFirebase) {

            firebase.initializeApp(this._config);

            window._initializedFirebase = true;
        }
    }

    static db() {
        return firebase.firestore();
    }

    static storage() {
        return firebase.storage();
    }

    initAuth() {
        return new Promise((s, f) => {
            let provider = new firebase.auth.GoogleAuthProvider();

            firebase.auth().signInWithPopup(provider)
                .then(result => {
                    let token = result.credential.accessToken;
                    let user = result.user;

                    s({user, 
                        token});
                })
                .catch(err => {
                    f(err);
                });
        });
    }
}
