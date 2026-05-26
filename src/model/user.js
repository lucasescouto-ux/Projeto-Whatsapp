import { ClassEvent } from "../utils/classevent";
import { Firebase, firebase } from "./../utils/firebase";

export class User extends ClassEvent {

    static getRef(){

        return Firebase.db().collection('/users');
    }

    static findbyEmail(email){

        return User.getRef().doc(email);
    }
}