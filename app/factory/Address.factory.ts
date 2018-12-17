import {address} from "faker";

import {Address} from "../models/embedded";

export class AddressFactory {
    public static default(): Address {
        return {
            addressOne: address.streetAddress(),
            addressTwo: address.secondaryAddress(),
            city: address.city(),
            country: address.country(),
            state: address.state(),
            zip: address.zipCode(),
        };
    }
}
