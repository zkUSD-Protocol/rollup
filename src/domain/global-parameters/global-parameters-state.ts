import { Bool, Struct } from "o1js";


class GlobalParametersMap {}

class GlobalParametersState extends Struct({
    emergencyStop: Bool,
}){}