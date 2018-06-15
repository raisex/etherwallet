'use strict';
var ethFuncs = function () {
}
ethFuncs.gasAdjustment = 21;
ethFuncs.validateEtherAddress = function (address) {
    if (address.substring(0, 2) !== "0x") return false;
    else if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) return false;
    else if (/^(0x)?[0-9a-f]{40}$/.test(address) || /^(0x)?[0-9A-F]{40}$/.test(address)) return true;
    else
        return this.isChecksumAddress(address);
}
ethFuncs.isChecksumAddress = function (address) {
    return address === ethUtil.toChecksumAddress(address);
}
ethFuncs.validateHexString = function (str) {
    if (str == "") return true;
    str = str.substring(0, 2) == '0x' ? str.substring(2).toUpperCase() : str.toUpperCase();
    var re = /^[0-9A-F]+$/g;
    return re.test(str);
}
ethFuncs.sanitizeHex = function (hex) {
    hex = hex.substring(0, 2) == '0x' ? hex.substring(2) : hex;
    if (hex == "") return "";
    return '0x' + this.padLeftEven(hex);
}
ethFuncs.trimHexZero = function (hex) {
    if (hex == "0x00" || hex == "0x0") return "0x0";
    hex = this.sanitizeHex(hex);
    hex = hex.substring(2).replace(/^0+/, '');
    return '0x' + hex;
}
ethFuncs.padLeftEven = function (hex) {
    hex = hex.length % 2 != 0 ? '0' + hex : hex;
    return hex;
}
ethFuncs.addTinyMoreToGas = function (hex) {
    hex = this.sanitizeHex(hex);
    //if (parseInt(ethFuncs.gasAdjustment) >= 80) {
    //uiFuncs.notifier.danger("We are currently trying to debug a weird issue. Please contact support@myetherwallet.com w/ subject line WEIRD ISSUE to help.");
    //throw "error";
    //}
    return new BigNumber(ethFuncs.gasAdjustment * etherUnits.getValueOfUnit('gwei')).toString(16);
}
ethFuncs.decimalToHex = function (dec) {
    return new BigNumber(dec).toString(16);
}
ethFuncs.hexToDecimal = function (hex) {
    return new BigNumber(this.sanitizeHex(hex)).toString();
}
ethFuncs.contractOutToArray = function (hex) {
    hex = hex.replace('0x', '').match(/.{64}/g);
    for (var i = 0; i < hex.length; i++) {
        hex[i] = hex[i].replace(/^0+/, '');
        hex[i] = hex[i] == "" ? "0" : hex[i];
    }
    return hex;
}
ethFuncs.getNakedAddress = function (address) {
    return address.toLowerCase().replace('0x', '');
}
ethFuncs.getDeteministicContractAddress = function (address, nonce) {
    nonce = new BigNumber(nonce).toString();
    address = address.substring(0, 2) == '0x' ? address : '0x' + address;
    return '0x' + ethUtil.generateAddress(address, nonce).toString('hex');
}
ethFuncs.padLeft = function (n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}
ethFuncs.getDataObj = function (to, func, arrVals) {
    var val = "";
    for (var i = 0; i < arrVals.length; i++) val += this.padLeft(arrVals[i], 64);
    return {
        to: to,
        data: func + val
    };
}
ethFuncs.getFunctionSignature = function (name) {
    return ethUtil.sha3(name).toString('hex').slice(0, 8);
};
ethFuncs.estimateGas = function (dataObj, callback) {
    var adjustGas = function (gasLimit) {
        if (gasLimit == "0x5209") return "21000";
        if (new BigNumber(gasLimit).gt(3500000)) return "-1";
        return new BigNumber(gasLimit).toString();
    }
    ajaxReq.getEstimatedGas(dataObj, function (data) {
        if (data.error) {
            callback(data);
            return;
        } else {
            callback({
                "error": false,
                "msg": "",
                "data": adjustGas(data.data)
            });
        }
    });
};


/*

    Given functionName, contract, and tx data, generates tx data and sends call, returns decoded outputs
    @param string functionName
    @param Contract contract
    @param Transaction tx
    @param callback function
    @returns {error: bool, data: []any}
 */


ethFuncs.handleContractCall = function (functionName, contract, {inputs = null, from = null, value = 0, unit = 'ether'} = {}, callback_ = console.log) {


    const foundFunction = contract.abi.find(itm => itm.type === 'function' && itm.name === functionName);


    if (!foundFunction) {

        console.error('error locating function:', functionName, 'in', contract);

        callback_({error: true, data: null});
    }

    const transObj = ethFuncs.prepContractData(functionName, contract, {inputs, from, value, unit});

    if (transObj.error) {

        callback_({error: transObj, data: null});

    } else {



        // if reading from contract, no need to estimate gas
        if (!from) {

            const testing = false;


            if (functionName === 'staker_info') {

                if (testing) {

                    const to = '0xa45083107ae67636cd9b93ad13c15b939dbdce31';

                    console.log(angular.equals(to, transObj.to), to, transObj.to);

                    const dater = "0x3f5e8ff400000000000000000000000001000b5fe61411c466b70631d7ff070187179bbf";
                    console.log(transObj.data, dater, angular.equals(transObj.data, dater));
                    transObj.data = dater;
                }

            }


            ajaxReq.getEthCall({to: transObj.to, data: transObj.data}, function (data) {


                if (functionName === 'staker_info') {

                    if (testing) {

                        const result = "0x00000000000000000000000000000000000000000000002b5e3af16b18800000000000000000000000000000000000000000000000000000000000000000089b0000000000000000000000000000000000000000000000000000000000000d100000000000000000000000000000000000000000000000000000000000000000";


                        console.log(angular.equals(result, data.data));
                        console.log('result', result);
                        console.log('data.data', data.data);
                        console.log('data', data);
                    }
                    console.log('staker info', data.data);

                }

                callback_(Object.assign({}, data, {data: ethFuncs.decodeOutputs(foundFunction, data)}));

            })

        } else {


            ethFuncs.estimateGas(transObj, function (data) {

                if (data.error || parseInt(data.data) === -1) {

                    console.error('error estimating gas', data);

                    callback_({error: data, data: null});

                } else {


                    Object.assign(transObj, {
                        gasLimit: data.data,

                    });


                    ajaxReq.getEthCall(transObj, function (data) {

                        callback_(Object.assign({}, data, {data: ethFuncs.decodeOutputs(foundFunction, data)}));

                    })

                }


            });
        }

    }

}


/*

    Estimate gasPrice of tx to contract

    @param string functionName
    @param Contract contract
    @param Tx transaction
    @param callback_ function

 */

ethFuncs.handleContractGasEstimation = function (functionName, contract, tx, callback_) {

    const result = ethFuncs.prepContractData(functionName, contract, tx);


    if (!result.error) {

        ethFuncs.estimateGas(result, function (data) {
            if (data.error || parseInt(data.data) === -1) {

                console.error('error estimating gas', data);


                callback_(Object.assign({}, data, {error: true}));


            } else {

                callback_(Object.assign({}, tx, {
                    gasLimit: data.data,
                }))
            }
        });
    } else {

        callback_(result);
    }
}


ethFuncs.encodeInputs = function encodeInputs({inputs}) {


    const types = inputs.map(i => i.type);

    const values = inputs.map(i => i.value || '');


    return ethUtil.solidityCoder.encodeParams(types, values);


};
/*

    Decode outputs from contract abi

    @param contractFunction
    @param data eth_call response

    @returns []any | data

 */
ethFuncs.decodeOutputs = function decodeOutputs(contractFunction, data) {


    const {outputs} = contractFunction;

    const output = ethUtil.solidityCoder.decodeParams(outputs.map(o => o.type), data.data.replace('0x', ''));


    return output.map(i => {
        if (i instanceof BigNumber) {

            return i.toFixed(0);
        }

        return i;
    });
};

/*


    Encode inputs if any and tx data

    @param string functionName
    @param Contract contract
    @param Tx {}
    @returns {error: bool | error, tx: Tx } if cannot estimate gas

 */

ethFuncs.prepContractData = function (functionName, contract, {inputs = [], from, value = 0}) {


    if (!(contract.hasOwnProperty('abi') && contract.hasOwnProperty('address') && Array.isArray(contract.abi))) {


        console.error('Invalid Request');

        return {error: true};

    }

    const foundFunction = contract.abi.find(itm => itm.type === 'function' && itm.name === functionName);


    if (!foundFunction) {

        console.error('error locating function:', functionName, 'in', contract);

        return {error: true};
    }


    let data = ethFuncs.encodeFunctionName(foundFunction.name, contract);

    if (!data) {

        return {error: true};

    }


    foundFunction.inputs.forEach((item, i) => item.value = inputs[i] || "");

    var inputs__ = ethFuncs.encodeInputs(foundFunction);


    return {
        to: contract.address,
        data: ethFuncs.sanitizeHex(data + inputs__),
        value
    };


};


/*

    given a function name and contract, returns function signature

    @param string functionName

    @param Contract contract

    @returns string functionSig
 */

ethFuncs.encodeFunctionName = function (functionName, contract) {

    const foundFunction = contract.abi.find(function_ => function_.type === 'function' && function_.name === functionName);

    if (foundFunction) {


        return ethFuncs.getFunctionSignature(ethUtil.solidityUtils.transformToFullName(foundFunction));


    } else {

        console.error('error locating', functionName, 'in', contract);

        return false;
    }


};


module.exports = ethFuncs;
