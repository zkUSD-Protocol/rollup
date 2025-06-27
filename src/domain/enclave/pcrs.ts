import { Field, Struct } from "o1js";

export class Pcrs extends Struct( {
    //for now
    pcrs: [Field,Field,Field,Field,Field,Field]
}){
    toFields() {
        return this.pcrs;
    }
}
    
