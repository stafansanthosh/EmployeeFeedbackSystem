/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const chaincode = require('./lib/chaincode');

module.exports.ChainCode = chaincode;
module.exports.contracts = [chaincode];
