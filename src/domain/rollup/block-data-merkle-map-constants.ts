import { Field } from 'o1js';

export namespace BlockDataMap{
  export const Height = 8;
  export const RollupVkhKey = new Field(1);
  export const SettlementContractAddressKey = new Field(2);
  export const SettlementAdminPublicKeyMapKey= new Field(3);
  export const DirectSettlementProgramVKH =  new Field(4);
}