'use strict';
var sha256 = require('js-sha256');

const { Contract } = require('fabric-contract-api');

class ChainCode extends Contract {

    async InitLedger(ctx) {
        const customers = [
        ];

        for (const customer of customers) {
            customer.docType = 'customer';
            await ctx.stub.putState(customer.ID, Buffer.from(JSON.stringify(customer)));
            console.info(`Customer ${customer.ID} initialized`);
        }
    }

    async ReadCustomer(ctx, id) {
        const customerJSON = await ctx.stub.getState(id);
        if (!customerJSON || customerJSON.length === 0) {
            throw new Error(`The customer with ID = ${id} does not exist`);
        }
        return customerJSON.toString();
    }

    async CreateCustomer(ctx, id, name, gender, pan, aadarNo) {

        var hash1 = sha256.hmac.create(id);
        hash1.update(name);
        var hexhashname = hash1.hex(id);

        var hash2 = sha256.hmac.create(id);
        hash2.update(gender);
        var hexhashgender = hash2.hex();

        var hash3 = sha256.hmac.create(id);
        hash3.update(pan);
        var hexhashpan = hash3.hex();

        var hash4 = sha256.hmac.create(id);
        hash4.update(aadarNo);
        var hexhashaadar = hash4.hex();

        const customer = {
            ID : id,
            Name : hexhashname,
            Gender : hexhashgender,
            Pan : hexhashpan,
            Aadhar : hexhashaadar
        };

        ctx.stub.putState(id, Buffer.from(JSON.stringify(customer)));
        return JSON.stringify(customer);
    }
    
    async UpdateCustomer(ctx, id, name, gender, pan, aadarNo) {
        const exists = await this.CustomerExists(ctx, id);
        if (!exists) {
            throw new Error(`The customer with ID = ${id} does not exist`);
        }
        
        var hash1 = sha256.hmac.create(id);
        hash1.update(name);
        var hexhashname = hash1.hex();

        var hash2 = sha256.hmac.create(id);
        hash2.update(gender);
        var hexhashgender = hash2.hex();

        var hash3 = sha256.hmac.create(id);
        hash3.update(pan);
        var hexhashpan = hash3.hex();

        var hash4 = sha256.hmac.create(id);
        hash4.update(aadarNo);
        var hexhashaadar = hash4.hex();

        const updatedCustomer = {
            ID : id,
            Name : hexhashname,
            Gender : hexhashgender,
            Pan : hexhashpan,
            Aadhar : hexhashaadar
        };
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(updatedCustomer)));
    }
    
    async DeleteCustomer(ctx, id) {
        const exists = await this.CustomerExists(ctx, id);
        if (!exists) {
            throw new Error(`The customer with ID = ${id} does not exist`);
        }
        return ctx.stub.deleteState(id);
    }

    async CustomerExists(ctx, id) {
        const customerJSON = await ctx.stub.getState(id);
        return customerJSON && customerJSON.length > 0;
    }

    async TransferCustomer(ctx, id, newPan) {
        const customerString = await this.ReadCustomer(ctx, id);
        const customer = JSON.parse(customerString);
        customer.Pan = newPan;
        return ctx.stub.putState(id, Buffer.from(JSON.stringify(customer)));
    }

    async GetAllCustomers(ctx) {
        const allCustomers = [];
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allCustomers.push({ Key: result.value.key, Record: record });
            result = await iterator.next();
        }
        return JSON.stringify(allCustomers);
    }


}

module.exports = ChainCode;
