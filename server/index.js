const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;
const secp = require("ethereum-cryptography/secp256k1");
const {toHex, utf8ToBytes} = require("ethereum-cryptography/utils");
const {keccak256} = require("ethereum-cryptography/keccak");

app.use(cors());
app.use(express.json());

const balances = {
    "0xe26943bbe7103ae50966dc7d0a8d0c1e8482dcf7a72f72cebaa017d6af643a99": 101,
    "0x293b4ffe086b75dbf6877a72bbeab5aaaa28b3efa1de3b8bcb4724f5445336a2": 50,
    "0xd1d6041ac3091555e35d050906efa6572dd8604a2316949874dafe8f36b27dd3": 75,
};
let address;

app.get("/balance/:address", (req, res) => {
    address = req.params.address;
    const balance = balances[address] || 0;
    res.send({balance});
});

app.post("/send", (req, res) => {
    if (address == undefined || address == null) {
        res.status(400).send({message: "No address provided, need to get balance first !"});
    }
    const {recipient, amount, signature, recoveryBit, publicKey} = req.body;
    console.log("Sender : ", address);
    console.log("Recipient : ", recipient);
    console.log("Amount : ", amount);
    console.log("Signature : ", signature);
    console.log("Recovery Bit : ", recoveryBit);

    let message = {
        from: address,
        to: recipient,
        amount: amount,
    };
    const messageHash = keccak256(utf8ToBytes(JSON.stringify(message)));
    const recoverKey = secp.recoverPublicKey(messageHash, signature, recoveryBit);
    setInitialBalance(address);
    setInitialBalance(recipient);
    if (toHex(recoverKey) === publicKey) {
        if (balances[address] < amount) {
            res.status(400).send({message: "Not enough funds in " + address + " wallet !"});
        } else {
            balances[address] -= amount;
            balances[recipient] += amount;
            res.send({balance: balances[address]});
        }
    } else {
        res.status(400).send({message: "Not the right signature !"});
    }
});

app.listen(port, () => {
    console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
    if (!balances[address]) {
        balances[address] = 0;
    }
}
