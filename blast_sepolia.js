const {ethers} = require('ethers') // ethers V6
require('dotenv').config()
// https://sepolia.blast.io
const blastProvider = new ethers.JsonRpcProvider(process.env.BlastRPC)
const sepoliaProvider = new ethers.JsonRpcProvider(process.env.SepoliaRPC)
const explore = 'https://testnet.blastscan.io/tx/'

const swallet1 = new ethers.Wallet(process.env.KEY1,sepoliaProvider)
const bwallet1 = new ethers.Wallet(process.env.KEY1,blastProvider)

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve,ms))
}
// bridge ETH from sepolia to blast
async function bridgeETH(_wallet,_value) {
    const BlastBridgeAddress = "0xc644cc19d2A9388b71dd1dEde07cFFC73237Dca8";
    const tx = {
        to: BlastBridgeAddress,
        value: ethers.parseUnits(_value.toString(),'ether')
    }
    const result = await _wallet.sendTransaction(tx)
    console.log(explore+result.hash)
    
}
// balanceOf multi-wallets on blast
async function balance() {
    const wallets = []
    wallets.push(bwallet1,bwallet2,bwallet3)
    const balances = await Promise.all(wallets.map(wallet => blastProvider.getBalance(wallet.address)))
    balances.map((balance,index) => {
        console.log(`${wallets[index].address}: ${ethers.formatUnits(balance,'ether')}`)
    })
}
// interact with contract on blast
async function interact(_wallet) {
    const contractAddr = ''
    const calldata = ''
    const value = '0.00045'
    const tx = {
        to: '0x4ca1e5Df32A80FEfCAceD0582e219E9B513D0FAc',
        data: '0x1249c58b',
        value: ethers.parseUnits(value,'ether')
    }

    const result = await _wallet.sendTransaction(tx)
    console.log(explore+result.hash)
}
// interact()
// bridgeETH(swallet3,0.01)
balance()
