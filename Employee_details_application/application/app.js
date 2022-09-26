'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');
const readline = require("readline");
const prompt = require('prompt');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main() {
	try {
		// build an in memory object with the network configuration (also known as a connection profile)
		const ccp = buildCCPOrg1();

		// build an instance of the fabric ca services client based on
		// the information in the network configuration
		const caClient = buildCAClient(FabricCAServices, ccp, 'ca.org1.example.com');

		// setup the wallet to hold the credentials of the application user
		const wallet = await buildWallet(Wallets, walletPath);

		// in a real application this would be done on an administrative flow, and only once
		await enrollAdmin(caClient, wallet, mspOrg1);

		// in a real application this would be done only when a new user was required to be added
		// and would be part of an administrative flow
		await registerAndEnrollUser(caClient, wallet, mspOrg1, org1UserId, 'org1.department1');

		// Create a new gateway instance for interacting with the fabric network.
		// In a real application this would be done as the backend server session is setup for
		// a user that has been verified.
		const gateway = new Gateway();

		try {
			// setup the gateway instance
			// The user will now be able to create connections to the fabric network and be able to
			// submit transactions and query. All transactions submitted by this gateway will be
			// signed by this user using the credentials stored in the wallet.
			await gateway.connect(ccp, {
				wallet,
				identity: org1UserId,
				discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
			});

			// Build a network instance based on the channel where the smart contract is deployed
			const network = await gateway.getNetwork(channelName);

			// Get the contract from the network.
			const contract = network.getContract(chaincodeName);

			await contract.submitTransaction('InitLedger');
			console.log('The ledger has been initialized')

			rl.question("\n\n\n\n\n\n\nChoose a query :\n 1 : read all employees\n 2 : read a particular employee\n 3 : create a new employee\n 4 : Update an employee\n 5 : Delete an employee\n\n\n\nYour preference : ", async function(type){
				console.log(`\n\n\n${type} is your preference\n`);
				rl.close();

				// To read all the employees
				if(type == '1') {
					try {
						console.log('\n--> Evaluate Transaction: GetAllEmployees, function returns all the current Employees on the ledger');
						let result = await contract.evaluateTransaction('GetAllCustomers');
						console.log(`*** Result: ${prettyJSONString(result.toString())}`);	
					} catch (error) {
						console.error(`error : ${error}`);
					}
					gateway.disconnect();
				}

				// To read a specific employee
				if(type == '2') {
					prompt.start();
					prompt.get(['id'], async function (err, result) {
						if (err) { return onErr(err); }
						console.log('Command-line input received:');
						console.log('  ID: ' + result.id);
						if(result.id) {
							try {
								console.log('\n--> Evaluate Transaction: ReadEmployee, function returns an employee with a given ID');
								let ans = await contract.evaluateTransaction('ReadCustomer', result.id);
								console.log(`*** Result: ${prettyJSONString(ans.toString())}`);
							} catch (error) {
								console.error(`error : ${error}`);
							}
						}
						else {
							console.log('Please fill all the details.')
						}
						gateway.disconnect();
					});
				}

				// To create a new employee
				if(type == '3') {
					prompt.start();
					prompt.get(['id', 'name', 'gender', 'pan_no', 'aadhar_no'], async function (err, result) {
						if (err) { return onErr(err); }
						console.log('Command-line input received:');
						console.log('  ID: ' + result.id);
						console.log('  Name: ' + result.name);
						console.log('  Gender: ' + result.gender);
						console.log('  Pan no: ' + result.pan_no);
						console.log('  Aadhar no: ' + result.aadhar_no);
						if(result.id && result.name || result.gender || result.pan_no || result.aadhar_no ) {
							try {
								console.log('\n--> Submit Transaction: CreateAsset, creates new Employee');
								let ans = await contract.submitTransaction('CreateCustomer', result.id, result.name, result.gender, result.pan_no, result.aadhar_no);
								console.log(`*** Result committed: ${prettyJSONString(ans.toString())}`);
							} catch (error) {
								console.error(`error : ${error}`);
							}
						}
						else {
							console.log('Please fill all the details.')
						}
						gateway.disconnect();
					});
				}

				// To update an employee
				if(type == '4') {
					prompt.start();
					prompt.get(['id', 'name', 'gender', 'pan_no', 'aadhar_no'], async function (err, result) {
						if (err) { return onErr(err); }
						console.log('Command-line input received:');
						console.log('  ID: ' + result.id);
						console.log('  Name: ' + result.name);
						console.log('  Gender: ' + result.gender);
						console.log('  Pan no: ' + result.pan_no);
						console.log('  Aadhar no: ' + result.aadhar_no);
						if(result.id && result.name || result.gender || result.pan_no || result.aadhar_no) {
							try {
								console.log('\n--> Submit Transaction: UpdateAsset, updates the info of an already existing client');
								await contract.submitTransaction('UpdateCustomer', result.id, result.name, result.gender, result.pan_no, result.aadhar_no);
								console.log('*** Result: committed');
							} catch (error) {
								console.error(`error : ${error}`);
							}
						}
						else {
							console.log('Please fill all the details.')
						}
						gateway.disconnect();
					});
				}

				// To delete a client
				if(type == '5') {
					prompt.start();
					prompt.get(['id'], async function (err, result) {
						if (err) { return onErr(err); }
						console.log('Command-line input received:');
						console.log('  ID: ' + result.id);
						if(result.id) {
							try {
								console.log('\n--> Evaluate Transaction: DeleteCustomer, deletes the client with the given assetID');
								await contract.submitTransaction('DeleteCustomer', result.id);
								console.log('*** Result: committed');
							} catch (error) {
								console.error(`error : ${error}`);
							}
						}
						else {
							console.log('Please fill all the details.')
						}
						gateway.disconnect();
					});
				}
			});
		} catch(error) {
			console.error(`error : ${error}`);
		}
	} catch (error) {
		console.error(`******** FAILED to run the application: ${error}`);
	}
}

main();