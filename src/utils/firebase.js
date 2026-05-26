const firebase = require('firebase');
require('firebase/firestore');

export class Firebase {

    constructor(){

        this._config = {
            apiKey: "AIzaSyD--yKs3F53VYSkI2I9oRhYCAaqWjM0F1Q",
            authDomain: "whatsapp-clone-78124.firebaseapp.com",
            projectId: "whatsapp-clone-78124",
            storageBucket: "whatsapp-clone-78124.firebasestorage.app",
            messagingSenderId: "589551792845",
            appId: "1:589551792845:web:ea5dc143257f4b40e12f84",
            measurementId: "G-H5GQJCDPH6"

        };

        this.init();
    }

    init(){

        if(!this._initialized) {

            firebase.initializeApp(this._config);

            this._initialized = true;
        }
    }

    static db(){

        return firebase.firestore();
    }

    static hd(){

        return firebase.storage();
    }
}