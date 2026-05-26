import { Firebase } from "./../utils/firebase";
import { Model } from "./model";

export class User extends Model {

    constructor(id){

        super();

        this._data = {};

        if (id) this.getById(id);
    }

    get name(){ return this._data.name; }
    set name(value){ this._data.name = value; }

    get email(){ return this._data.email; }
    set email(value){ this._data.email = value; }

    get photo(){ return this._data.photo; }
    set photo(value){ this._data.photo = value; }

    getById(id){

        return new Promise((s, f)=>{

            User.findbyEmail(id).onSnapshot(doc=>{

                this.fromJSON(doc.data());

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

    static findbyEmail(email){

        return User.getRef().doc(email);
    }
}