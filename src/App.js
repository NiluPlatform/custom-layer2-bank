import React, {useState, useRef} from "react";
import loading from './assets/ajax-loader.gif';
import CreationBTN from "./component/CreationBTN";
import './App.css';
import * as Nilu from "./const";

let Web3 = require('web3');
let Tx = require('ethereumjs-tx');
let EthUtil = require('ethereumjs-util');

function App() {

    let privateKeyInitial, addressInitial, BankAddressInitial, BankAdminAddressInitial, roundDurationInitial,
        IngressAddressInitial, tokenNameInitial, tokenSymbolInitial;

    const addressRef = useRef(null);
    const privateKeyRef = useRef(null);
    const roundDurationRef = useRef(null);
    const tokenNameRef = useRef(null);
    const tokenSymbolRef = useRef(null);

    const web3 = new Web3(new Web3.providers.HttpProvider("https://walletapi.nilu.tech", 5));
    const bank = new web3.eth.Contract(Nilu.bank_abi);
    const bank_admin = new web3.eth.Contract(Nilu.admin_abi);
    const ingress = new web3.eth.Contract(Nilu.ingress_abi);

    let initialState = JSON.parse(localStorage.getItem('initialState'));

    if (initialState) {
        privateKeyInitial = initialState.privateKey === undefined ? null : initialState.privateKey;
        addressInitial = initialState.address === undefined ? null : initialState.address;
        BankAddressInitial = initialState.BankAddress === undefined ? null : initialState.BankAddress;
        roundDurationInitial = initialState.roundDuration === undefined ? null : initialState.roundDuration;
        BankAdminAddressInitial = initialState.BankAdminAddress === undefined ? null : initialState.BankAdminAddress;
        IngressAddressInitial = initialState.IngressAddress === undefined ? null : initialState.IngressAddress;
        tokenNameInitial = initialState.tokenName === undefined ? null : initialState.tokenName;
        tokenSymbolInitial = initialState.tokenSymbol === undefined ? null : initialState.tokenSymbol;
    }

    const [privateKey, privateKeyStateHandler] = useState(privateKeyInitial);
    const [address, addressStateHandler] = useState(addressInitial);
    const [BankAddress, BankAddressStateHandler] = useState(BankAddressInitial);
    const [roundDuration, roundDurationStateHandler] = useState(roundDurationInitial);
    const [BankAdminAddress, BankAdminAddressStateHandler] = useState(BankAdminAddressInitial);
    const [tokenName, tokenNameStateHandler] = useState(tokenNameInitial);
    const [tokenSymbol, tokenSymbolStateHandler] = useState(tokenSymbolInitial);
    const [IngressAddress, IngressAddressStateHandler] = useState(IngressAddressInitial);
    const [output, outputStateHandler] = useState("");
    const [addressIsValid, addressIsValidStateHandler] = useState(true);
    const [privateKeyIsValid, privateKeyIsValidStateHandler] = useState(true);

    const [BankAdminBTN, BankAdminBTNStateHandler] = useState("");
    const [BankBTN, BankBTNStateHandler] = useState("");
    const [IngressBTN, IngressBTNStateHandler] = useState("");

    const privateKeyInputHandler = (event) => {
        privateKeyStateHandler(event.target.value)
    };
    const addressInputHandler = (event) => {
        addressStateHandler(event.target.value)
    };
    const BankAddressInputHandler = (event) => {
        BankAddressStateHandler(event.target.value)
    };
    const roundDurationInputHandler = (event) => {
        const newRound = event.target.value.replace(/\D/g, '');
        roundDurationStateHandler(newRound)
    };
    const BankAdminAddressInputHandler = (event) => {
        BankAdminAddressStateHandler(event.target.value)
    };
    const IngressAddressInputHandler = (event) => {
        IngressAddressStateHandler(event.target.value)
    };
    const tokenNameInputHandler = (event) => {
        tokenNameStateHandler(event.target.value)
    };
    const tokenSymbolInputHandler = (event) => {
        tokenSymbolStateHandler(event.target.value.slice(0,3))
    };
    const saveData = () => {
        initialState = {
            "privateKey": privateKey,
            "address": address,
            "BankAddress": BankAddress,
            "BankAdminAddress": BankAdminAddress,
            "IngressAddress": IngressAddress,
            "tokenName": tokenName,
            "tokenSymbol": tokenSymbol,
            "roundDuration": roundDuration
        };
        localStorage.setItem('initialState', JSON.stringify(initialState));
    };

    const addressValidation = address => {
        if (!EthUtil.isValidAddress(address)) {
            addressIsValidStateHandler(false);
            addressRef.current.focus();
            return false
        }
        return true;
    };
    const privateKeyValidation = (privateKey) => {
        try {
            if (!EthUtil.isValidPrivate(EthUtil.toBuffer(privateKey))) {
                privateKeyIsValidStateHandler(false);
                privateKeyRef.current.focus();
                return false;
            }
        } catch (e) {
            privateKeyIsValidStateHandler(false);
            privateKeyRef.current.focus();
            return false;
        }
        return true
    };

    const createBank = () => {
        let newOutput = output;
        BankBTNStateHandler("loading");
        if (!privateKeyValidation(privateKey) || !addressValidation(address)) {
            BankBTNStateHandler(false);
            return
        }
        if (!roundDuration) {
            BankBTNStateHandler(false);
            roundDurationRef.current.focus();
            return
        }
        newOutput = newOutput + "\n*Start creating bank contract...* \n";
        const privateKeyToBuffer = EthUtil.toBuffer(privateKey);
        const my_bank_data = bank.deploy({
            data: Nilu.bank_data,
            arguments: [roundDuration]
        }).encodeABI();

        web3.eth.getGasPrice().then((gasPrice) => {
            web3.eth.getTransactionCount(address, (err, txCount) => {
                const myTx = {
                    nonce: web3.utils.toHex(txCount),
                    from: address,
                    gasLimit: web3.utils.toHex(4000000),
                    gasPrice: web3.utils.toHex(gasPrice),
                    data: my_bank_data
                };
                const chargeTx = new Tx(myTx);
                chargeTx.sign(privateKeyToBuffer);

                const raw_Tx = '0x' + chargeTx.serialize().toString('hex');
                web3.eth.sendSignedTransaction(raw_Tx, (err, txHash) => {
                    newOutput = txHash ? newOutput + `Transaction Hash is : ${txHash} \n` : newOutput;
                    newOutput = err ? newOutput + `Error on send transaction Hash is : ${err} \n * End creating bank *` : newOutput;
                    console.log('Transaction Hash is :', txHash);
                    console.log('error:', err);
                    outputStateHandler(newOutput)
                }).then((instance) => {
                    console.log(instance);
                    newOutput = `Bank Address :${instance.contractAddress}\n BlockHash : ${instance.blockHash} \n Block blockHash Number ${instance.blockblockHashNumber}\n * End creating bank *`
                    BankAddressStateHandler(instance.contractAddress);
                    outputStateHandler(newOutput);
                    BankBTNStateHandler("done")
                }).catch(error => {
                    console.log(error);
                    newOutput = newOutput + error;
                    outputStateHandler(newOutput);
                    BankBTNStateHandler(false)

                })
            })

        }).catch(error => {
            console.log(error);
            newOutput = newOutput + error;
            outputStateHandler(newOutput)
        });
    };

    const createBankAdmin = () => {
        BankAdminBTNStateHandler("loading");
        let newOutput = output;
        if (!privateKeyValidation(privateKey) || !addressValidation(address)) {
            BankAdminBTNStateHandler(false);
            return
        }
        newOutput = newOutput + `\n ${Date(Date.now()).toString()} * Start creating bank admin contract... *\n`;
        const privateKeyToBuffer = EthUtil.toBuffer(privateKey);

        const data = bank_admin.deploy({
            data: Nilu.bank_admin_data,
        }).encodeABI();

        web3.eth.getGasPrice().then((gasPrice) => {
            web3.eth.getTransactionCount(address, (err, txCount) => {
                console.log(txCount);
                const myTx = {
                    nonce: web3.utils.toHex(txCount),
                    from: address,
                    gasLimit: web3.utils.toHex(4000000),
                    gasPrice: web3.utils.toHex(gasPrice),
                    data: data
                };
                const chargeTx = new Tx(myTx);
                chargeTx.sign(privateKeyToBuffer);

                const raw_Tx = '0x' + chargeTx.serialize().toString('hex');
                web3.eth.sendSignedTransaction(raw_Tx, (err, txHash) => {
                    newOutput = txHash ? newOutput + `Transaction Hash is : ${txHash} \n` : newOutput;
                    newOutput = err ? newOutput + `Error on send transaction Hash is : ${err} \n* End creating bank admin *` : newOutput;
                    console.log('Transaction Hash is :', txHash);
                    console.log('error:', err);
                    outputStateHandler(newOutput);
                    //txHash ? BankAdminBTNStateHandler("done") : BankAdminBTNStateHandler(false);
                }).then((instance) => {
                    console.log(instance);
                    newOutput = `Bank Admin Address :${instance.contractAddress}\n BlockHash : ${instance.blockHash} \n Block blockHash Number ${instance.blockblockHashNumber}\n * End creating bank *`
                    BankAdminAddressStateHandler(instance.contractAddress);
                    outputStateHandler(newOutput);
                    BankAdminBTNStateHandler("done")
                }).catch(error => {
                    console.log(error);
                    newOutput = newOutput + error;
                    outputStateHandler(newOutput);
                    BankAdminBTNStateHandler(false)
                })
            })

        }).catch(error => {
            console.log(error);
            newOutput = newOutput + error;
            outputStateHandler(newOutput)
        });
    };

    const createIngress = () => {
        IngressBTNStateHandler("loading");
        if (!tokenName) {
            IngressBTNStateHandler(false);
            tokenNameRef.current.focus();
            return
        }

        if (!tokenSymbol) {
            IngressBTNStateHandler(false);
            tokenSymbolRef.current.focus();
            return
        }
        let newOutput = output;
        newOutput = newOutput + `\n ${Date(Date.now()).toString()} * Start creating ingress contract... *\n`;
        const privateKeyToBuffer = EthUtil.toBuffer(privateKey);
        const data = ingress.deploy({
            data: Nilu.ingress_data,
            arguments: [tokenName, tokenSymbol]
        }).encodeABI();

        web3.eth.getGasPrice().then((gasPrice) => {
            web3.eth.getTransactionCount(address, (err, txCount) => {
                const myTx = {
                    nonce: web3.utils.toHex(txCount),
                    from: address,
                    gasLimit: web3.utils.toHex(4000000),
                    gasPrice: web3.utils.toHex(gasPrice),
                    data: data
                };
                const chargeTx = new Tx(myTx);
                chargeTx.sign(privateKeyToBuffer);

                const raw_Tx = '0x' + chargeTx.serialize().toString('hex');
                web3.eth.sendSignedTransaction(raw_Tx, (err, txHash) => {
                    newOutput = txHash ? newOutput + `Transaction Hash is : ${txHash} \n` : newOutput;
                    newOutput = err ? newOutput + `Error on send transaction Hash is : ${err} \n* End creating ingress *` : newOutput;
                    console.log('Transaction Hash is :', txHash);
                    console.log('error:', err);
                    outputStateHandler(newOutput)
                }).then((instance) => {
                    console.log(instance);
                    newOutput = `Ingress Address :${instance.contractAddress}\n BlockHash : ${instance.blockHash} \nBlock blockHash Number ${instance.blockblockHashNumber}\n* End creating bank *`
                    BankAdminAddressStateHandler(instance.contractAddress);
                    outputStateHandler(newOutput);
                    IngressBTNStateHandler("done");
                }).catch(error => {
                    console.log(error);
                    newOutput = newOutput + error;
                    outputStateHandler(newOutput);
                    IngressBTNStateHandler(false);
                })
            })

        }).catch(error => {
            console.log(error);
            newOutput = newOutput + error;
            outputStateHandler(newOutput);
            IngressBTNStateHandler(false);
        });
    };

    return (
        <div>
            <h1 className="text-center">Bank Engine</h1>
            <div className="container">
                <div className="row display-flex">
                    <div className="col-12">
                        <div className="form-group">
                            <label htmlFor="private_key">Private Key:</label>
                            <input type="text" className={`form-control ${privateKeyIsValid ? "" : "is-invalid"}`}
                                   id="privateKey" defaultValue={privateKey} ref={privateKeyRef}
                                   onChange={(event) => privateKeyInputHandler(event)}/>
                            <small className="form-text text-muted">This key is safe and will not send to
                                any server</small>
                        </div>
                    </div>

                    <div className="col-12">
                        <div className="form-group">
                            <label htmlFor="Address">Address:</label>
                            <input type="text" ref={addressRef} value={address || ""}
                                   className={`form-control ${addressIsValid ? "" : "is-invalid"}`}
                                   onChange={(event) => addressInputHandler(event)}/>
                        </div>
                    </div>
                </div>

                <div className="row display-flex">
                    <div className="col-xs-12 col-md-4">
                        <div className="card">
                            <div className="card-header">Step 1: Bank Admin Contract</div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label htmlFor="BankAdminAddress">Bank Admin Address :</label>
                                    <input type="text" className="form-control" id="BankAdminAddress"
                                           placeholder="Optional" defaultValue={BankAdminAddress}
                                           onChange={(event) => BankAdminAddressInputHandler(event)}/>
                                    <small className="form-text text-muted">You can deploy this smart
                                        contract by yourself and put the smart contract's address here. Otherwise, left
                                        this field empty, and the bank engine will do it automatically.</small>
                                </div>
                                <CreationBTN text="Create Bank Admin" state={BankAdminBTN} click={createBankAdmin}/>
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12 col-md-4">
                        <div className="card">
                            <div className="card-header">Step 2: Bank Contract</div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label htmlFor="BankAddress">Bank Address :</label>
                                    <input type="text" className="form-control" id="BankAddress"
                                           placeholder="Optional" defaultValue={BankAddress}
                                           onChange={(event) => BankAddressInputHandler(event)}/>
                                    <small className="form-text text-muted">You can deploy this smart
                                        contract by yourself and put the smart contract's address here. Otherwise, left
                                        this field empty, and the bank engine will do it automatically.</small>
                                </div>
                                <div
                                    className={`${BankAddress === undefined || BankAddress === "" || BankAddress === null ? "d-block" : "d-none"}`}>
                                    <div className="form-group">
                                        <label htmlFor="roundDuration">Round duration :</label>
                                        <input type="text" className="form-control" ref={roundDurationRef} id="roundDuration"
                                               value={roundDuration || ""}
                                               onChange={(event) => roundDurationInputHandler(event)}/>
                                        <small className="form-text text-muted">Round duration is a number</small>
                                    </div>
                                    <CreationBTN text="Create Bank" state={BankBTN} click={createBank}/>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-xs-12 col-md-4">
                        <div className="card">
                            <div className="card-header">Step 3: ingress Contract</div>
                            <div className="card-body">
                                <div className="form-group">
                                    <label htmlFor="IngressAddress">Ingress Address :</label>
                                    <input type="text" className="form-control" id="IngressAddress"
                                           placeholder="Optional" defaultValue={IngressAddress}
                                           onChange={(event) => IngressAddressInputHandler(event)}/>
                                    <small className="form-text text-muted">You can deploy this smart
                                        contract by yourself and put the smart contract's address here. Otherwise,
                                        left this field empty, and the bank engine will do it automatically.</small>
                                </div>
                                <div
                                    className={`${IngressAddress === undefined || IngressAddress === "" || IngressAddress === null ? "d-block" : "d-none"}`}>
                                    <div className="form-group">
                                        <label htmlFor="tokenName">Token Name :</label>
                                        <input type="text" className="form-control" ref={tokenNameRef}
                                               placeholder="Optional" value={tokenName || ""}
                                               onChange={(event) => tokenNameInputHandler(event)}/>
                                        <small className="form-text text-muted">token name
                                            help</small>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="tokenSymbol">Token Symbol :</label>
                                        <input type="text" className="form-control" ref={tokenSymbolRef}
                                               placeholder="Optional" value={tokenSymbol || ""}
                                               onChange={(event) => tokenSymbolInputHandler(event)}/>
                                        <small className="form-text text-muted">token symbol</small>
                                    </div>
                                    <CreationBTN text="Create Ingress" state={IngressBTN} click={createIngress}/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    <button type="button" onClick={saveData} style={{width: "50%", margin: "10px auto"}}
                            className="btn btn-primary">Save
                    </button>
                </div>

                <div className="row">
                    <div className="col-12" style={{marginTop: "10px"}}>
                        <div className="card">
                            <div className="card-header">Activity log :</div>
                            <div className="card-body">
                                <pre>{output}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
}

export default App;
