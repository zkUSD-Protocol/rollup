import { Bool, Field, Struct } from "o1js";


export class GlobalParametersState extends Struct({
    emergencyStop: Bool,
}){
    toFields(): Field[] {
        return [
            this.emergencyStop.toField(),
        ];
    }
}