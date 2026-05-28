import { Firebase } from "./../utils/firebase";
import { Model } from "./model";

export class User extends Model {

    constructor(id){

        super();

        this._data = {};

        this._loadPromise = id ? this.getById(id) : Promise.resolve();
    }

    get name(){ return this._data.name; }
    set name(value){ this._data.name = value; }

    get email(){ return this._data.email; }
    set email(value){ this._data.email = value; }

    get photo(){ return this._data.photo; }
    set photo(value){ this._data.photo = value; }

    get chatId(){ return this._data.chatId; }
    set chatId(value){ this._data.chatId = value; }

    ready(){

        return this._loadPromise;
    }

    getById(id){

        return new Promise((s, f)=>{

            User.findbyEmail(id).onSnapshot(doc=>{

                let data = doc.exists ? doc.data() : {};

                data.email = data.email || id;

                this.fromJSON(data);

                    s(doc);
            });
        });
    }

    save(){

        return User.findbyEmail(this.email).set(this.toJSON());
    }

    static getRef(){

        return Firebase.db().collection('/users');
    }

    static getContactsRef(id){

        return User.getRef()
            .doc(id)
            .collection('contacts');
    }

    static findbyEmail(email){

        return User.getRef().doc(email);
    }

    addContact(contact) {
        return User.getContactsRef(this.email)
            .doc(btoa(contact.email))
            .set(contact.toJSON());
    }

    getContacts(filter = ''){

        return new Promise((s, f)=>{

           User.getContactsRef(this.email).where('name', '>=', filter).onSnapshot(docs => {

            let contacts = [];

            docs.forEach(doc =>{

                let data = doc.data();

                data.id = doc.id;

                contacts.push(data);
            });

            this.trigger('contactschange', docs);

            s(contacts);
           });
        });

    }

    updateContact(email, data) {
        return User.getContactsRef(this.email)
            .doc(btoa(email))
            .set(data, { merge: true });
    }
}
