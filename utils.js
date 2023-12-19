const { ethers } = require("hardhat");
const {fetch} = require('./spider');
require("dotenv").config();

const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const wallet1 = new ethers.Wallet(Private_Key1,provider)
const wallet2 = new ethers.Wallet(Private_Key2,provider)
const wallet3 = new ethers.Wallet(Private_Key3, provider)

/**
 * withdraw from poolId with status on or off
 * @param {ethers.Wallet} wallet 
 * @param {Number} poolId 
 * @example Withdraw(wallet1, 11111)
 */
async function Withdraw(wallet,poolId) {
    try {
        const tokenIds = await QueryTokenByPoolId(wallet,poolId)
        const tx = await Promise.all(tokenIds.map(token => _withdraw(wallet,token)))
        console.log(tx)
    } catch (error) {
        console.log(error.message)
    }
}

/**
 * Gain from poolId with status end
 * @param {ethers.Wallet} wallet 
 * @param {Number} poolId 
 * @example Gain(wallet1, 11111)
 */
async function Gain(wallet,poolId) {
    try {
        const tokenIds = await QueryTokenByPoolId(wallet,poolId)
        const tx = await Promise.all(tokenIds.map(token => _gain(wallet,token)))
        console.log(tx)
    } catch (error) {
        console.log(error.message)
    }
}

/**
 * 一键approve所有地址的 ERC721 tokenId
 */
async function Approve() {
    try {
        const tokenAs = await check(wallet1.address)
        const tokenBs = await check(wallet2.address)
        const tokenCs = await check(wallet3.address)
        console.log(tokenAs)
        console.log(tokenBs)
        console.log(tokenCs)
        let resultA = []
        let resultB = []
        let resultC = []
        if(tokenAs.length !== 0) {
            resultA = await executeApprove(wallet1,tokenAs)
            await sleep(1000)
        }
        if (tokenBs.length !== 0) {
            resultB = await executeApprove(wallet2,tokenBs)
            await sleep(1000)
        }
        if (tokenCs.length !== 0) {
            resultC = await executeApprove(wallet3,tokenCs)
        }
        console.log([...resultA,...resultB,...resultC])
    } catch (error) {
        console.log(error.message)
    }
}

/**
 * 单个池子授权
 * @param {ethers.Wallet} _wallet 钱包实例
 * @param {Number} _poolId 池子ID
 */
async function approve(_wallet,_poolId) {
    const tokens = await QueryTokenByPoolId(_wallet,_poolId)
    const approveResult = await executeApprove(_wallet,tokens)
    console.log('Approval hash',approveResult)

    const withdrawResult = await Promise.all(tokens.map(token => _withdraw(_wallet,token)))
    console.log('Withdrawl hash',withdrawResult)
}

function sleep(ms) {
    return new Promise((res) => setTimeout(res,ms));
}
/**
 * 查询该地址未授权的所有tokenId
 * @param {String} _address EVM地址
 * @returns {Promise<Number[]>}
 */
async function check(_address) {
    const transferFilter = {
        address: '0x4820416cf02094ac6b9c253f64777516713330f4',
        topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            ethers.utils.hexZeroPad(`0x0000000000000000000000000000000000000000`,32),
            ethers.utils.hexZeroPad(`${_address}`,32),
            null
        ],
        fromBlock: 4840000,
        toBlock: 'latest'
      };
    const approveTokenFilter = {
        address: '0x4820416cf02094ac6b9c253f64777516713330f4',
        topics: [
            '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925',
            ethers.utils.hexZeroPad(`${_address}`,32),
            ethers.utils.hexZeroPad('0x0BCB9ea12d0b02d846fB8bBB8763Ec8Efecb4c79',32),
            null
        ],
        fromBlock: 4840000,
        toBlock: 'latest'
      };
    const gainTokenFilter = {
        address: '0x4820416cf02094ac6b9c253f64777516713330f4',
        topics: [
            '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
            ethers.utils.hexZeroPad(`${_address}`,32),
            ethers.utils.hexZeroPad('0x0000000000000000000000000000000000000000',32),
            null
        ],
        fromBlock: 4840000,
        toBlock: 'latest'
    }
    const gainData = await provider.getLogs(gainTokenFilter)
    const transferData = await provider.getLogs(transferFilter)
    const approveData = await provider.getLogs(approveTokenFilter)
    const transfered = transferData.map(log => parseInt(log.topics[3],16))
    const approved = new Set([...approveData.map(log => parseInt(log.topics[3],16))])
    const gained = new Set([...gainData.map(log => parseInt(log.topics[3],16))])
    const NotApprove = transfered.filter(t => !approved.has(t) && !gained.has(t))
    return NotApprove;
}
/**
 * 
 * @param {ethers.Wallet} wallet 钱包实例
 * @param {Number[]} tokens ERC721 tokenId数组
 * @returns {Promise<String[]>} 返回交易哈希
 */
async function executeApprove(wallet,tokens) {
    if(tokens.length !== 0) {
        try {
            const nonce = await provider.getTransactionCount(wallet.address)
            const calldatas = tokens.map(tokenid => '0x095ea7b3'+ethers.utils.defaultAbiCoder.encode(['address','uint256'],['0x0BCB9ea12d0b02d846fB8bBB8763Ec8Efecb4c79',tokenid]).substring(2))
            const transactions = calldatas.map((calldata,index) => ({
                nonce: nonce+index,
                to: '0x4820416Cf02094ac6B9C253f64777516713330f4',
                gasLimit: 1500000,
                value: 0,
                data: calldata
            }))
            const results = await Promise.all(transactions.map(tx => wallet.sendTransaction(tx)))
            return results.map(res => res.hash);
        } catch (error) {
            console.log(error.message)
        }
    }
}

/**
 * 
 * @param {ethers.Wallet} wallet 钱包实例
 * @param {Number} token 加入池子时的tokenId
 * @returns {String} tx.hash
 */
async function _withdraw(wallet,token) {
    try {
        const calldata = '0x0fcc56f7'+ ethers.utils.defaultAbiCoder.encode(['uint256'],[token]).substring(2)
        const tx = {
            to: '0x0BCB9ea12d0b02d846fB8bBB8763Ec8Efecb4c79',
            gasLimit: 1500000,
            value: 0,
            data: calldata
        }
        const res = await wallet.sendTransaction(tx)
        return res.hash
    } catch (error) {
        console.log(error.message)
    }
}

/**
 * 
 * @param {ethers.Wallet} wallet 钱包实例
 * @param {Number} token tokenId
 * @returns {String} tx.hash
 */
async function _gain(wallet,token) {
    try {
        const calldata = '0x022e6df6'+ ethers.utils.defaultAbiCoder.encode(['uint256'],[token]).substring(2)
        const tx = {
            to: '0x0BCB9ea12d0b02d846fB8bBB8763Ec8Efecb4c79',
            gasLimit: 1500000,
            value: 0,
            data: calldata
        }
        const res = await wallet.sendTransaction(tx)
        return res.hash
    } catch (error) {
        console.log(error.message)
    }
}

/**
 * 根据地址返回指定pool的tokenId
 * @param {ethers.Wallet} _wallet 钱包实例
 * @param {Number} _poolid 池子ID
 * @returns {Promise<Number[]>}
 */
async function QueryTokenByPoolId(_wallet,_poolid) {
    const filter = {
        address: '0x0bcb9ea12d0b02d846fb8bbb8763ec8efecb4c79',
        topics: [
            '0xb9fa1caa1e1541788a4b5cd68270e6d375e3a28f4f94017af9351c5955d58fa7',
            null,
            ethers.utils.hexZeroPad(_poolid,32),
            ethers.utils.hexZeroPad(_wallet.address,32)
        ],
        fromBlock: 4840285,
        toBlock: 'latest'
    }
    const data = await provider.getLogs(filter)
    return data.map(log => parseInt(log.topics[1],16))
    // const result = await Promise.all(data.map(log => gain(_wallet,parseInt(log.topics[1],16))))
    // console.log(result)
}

/**
 * 查询代币合约地址
 * @param {String} _symbol 代币名称
 * @returns {String} 返回合约地址
 * @example queryTokenAddrA('btc')
 */
function queryTokenAddr(_symbol) {
    let contractAddr = ''
    if (_symbol.includes('btc')) {
        contractAddr = contractAddr+'0x35f131cF4b53038192117f640e161807dBcB0fdF'
    }
    if (_symbol.includes('eth')) {
        contractAddr = contractAddr+'0x99FCee8A75550a027Fdb674c96F2D7DA31C79fcD'
    }
    if (_symbol.includes('snx')) {
        contractAddr = contractAddr+'0x236f697c518b7AEc0bb227d8B7547b3c27cA29bc'
    }
    if (_symbol.includes('link')) {
        contractAddr = contractAddr+'0xCD85B9a767eF2277E264A4B9A14a2deACAB82FfB'
    }
    if (_symbol.includes('doge')) {
        contractAddr = contractAddr+'0x183209DA02C281709A5BcD40188AaFfA04A7fEfD'
    }
    if (_symbol.includes('bnb')) {
        contractAddr = contractAddr+'0x3f6Df06A3c745591Cad3816bAa087b1E8925035E'
    }
    if (_symbol.includes('okb')) {
        contractAddr = contractAddr+'0x6B39CeA2b80b7A549D6464AeC9cAb806477Fcdb7'
    }
    return contractAddr
}

/**
 * 添加池子
 * @param {ethers.Wallet} _wallet 
 * @param {Number} _poolId 
 * @param {String} _symbol
 * @example input(wallet1, 28299, 'okb') 
 */
async function input(_wallet,_poolId,_symbol) {
    const contractAddr = queryTokenAddr(_symbol)
    try {
        const params = await fetch(_poolId,contractAddr)
        // console.log(parseInt(params.Layer))
        // console.log(parseInt(_poolId))
        // console.log(BigInt(params.UnitSize*1e18))
        if (!parseFloat(params.UnitSize) > 0.1 && !_symbol.includes('btc')) {
            const calldata = ethers.utils.defaultAbiCoder.encode(['uint256','uint256','uint256','uint256','uint256','uint256'],
            [parseInt(params.Layer),parseInt(_poolId),BigInt(params.UnitSize*1e18),1,BigInt(params.UnitSize*1e18),0])
            
            const tx = {
                to: '0x0BCB9ea12d0b02d846fB8bBB8763Ec8Efecb4c79',
                gasLimit: 1500000,
                value: 0,
                data: `0xbef2e22e${calldata.substring(2)}`
            }
            const result = await _wallet.sendTransaction(tx)
            console.log(result.hash)
        }else console.log('The unitSize is so fucking high!')
    } catch (error) {
        console.log(error.message)
    }
}

function test() {
    console.log(ethers.utils.hexZeroPad(64610,32))
}
// test()
// Approve()
// console.log('0x095ea7b3'+ethers.utils.defaultAbiCoder.encode(['address','uint256'],['0x0BCB9ea12d0b02d846fB8bBB8763Ec8Efecb4c79',1154]).substring(2))
// QueryTokenByPoolId(wallet1,28851)
// Withdraw(wallet1,28851)
// Gain(wallet3,32231)
// input(wallet1,11921,'link')
