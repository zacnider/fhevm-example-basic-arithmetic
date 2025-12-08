# EntropyArithmetic

FHE arithmetic operations using EntropyOracle

## 🚀 Standard workflow
- Install (first run): `npm install --legacy-peer-deps`
- Compile: `npx hardhat compile`
- Test (local FHE + local oracle/chaos engine auto-deployed): `npx hardhat test`
- Deploy (frontend Deploy button): constructor arg is fixed to EntropyOracle `0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361`
- Verify: `npx hardhat verify --network sepolia <contractAddress> 0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361`

## 📋 Overview

This example demonstrates **basic** concepts in FHEVM with **EntropyOracle integration**:
- Integrating with EntropyOracle
- Using encrypted entropy in arithmetic operations
- Entropy-enhanced calculations (add, sub, mul with entropy)
- Combining entropy with encrypted values

## 🎯 What This Example Teaches

This tutorial will teach you:

1. **How to perform arithmetic operations** on encrypted values (add, subtract, multiply)
2. **How to handle multiple external encrypted inputs** with separate input proofs
3. **How to enhance arithmetic operations** with entropy from EntropyOracle
4. **The importance of `FHE.allowThis()`** for each encrypted value used
5. **How to mix results with entropy** using XOR for randomness
6. **The difference between basic and entropy-enhanced operations**

## 💡 Why This Matters

Arithmetic operations are fundamental to FHEVM. With EntropyOracle, you can:
- **Add randomness** to calculations without revealing values
- **Enhance security** by mixing entropy with arithmetic results
- **Create unpredictable patterns** in encrypted computations
- **Learn the foundation** for more complex FHE calculations

## 🔍 How It Works

### Contract Structure

The contract has four main components:

1. **Initialization**: Sets up two encrypted values for arithmetic operations
2. **Entropy Request**: Requests randomness from EntropyOracle
3. **Basic Operations**: Performs add, subtract, multiply without entropy
4. **Entropy-Enhanced Operations**: Performs operations with entropy mixing

### Step-by-Step Code Explanation

#### 1. Constructor

```solidity
constructor(address _entropyOracle) {
    require(_entropyOracle != address(0), "Invalid oracle address");
    entropyOracle = IEntropyOracle(_entropyOracle);
}
```

**What it does:**
- Takes EntropyOracle address as parameter
- Validates the address is not zero
- Stores the oracle interface

**Why it matters:**
- Must use the correct oracle address: `0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361`
- This address is fixed and used in all examples

#### 2. Initialize Function

```solidity
function initialize(
    externalEuint64 encryptedValue1,
    externalEuint64 encryptedValue2,
    bytes calldata inputProof1,
    bytes calldata inputProof2
) external {
    require(!initialized, "Already initialized");
    
    euint64 internalValue1 = FHE.fromExternal(encryptedValue1, inputProof1);
    euint64 internalValue2 = FHE.fromExternal(encryptedValue2, inputProof2);
    
    FHE.allowThis(internalValue1);
    FHE.allowThis(internalValue2);
    
    value1 = internalValue1;
    value2 = internalValue2;
    initialized = true;
}
```

**What it does:**
- Accepts two encrypted values from external source (frontend)
- Validates both encrypted values using separate input proofs
- Converts external encrypted values to internal format
- Grants permission to use both values
- Stores them for arithmetic operations

**Key concepts:**
- **Two external inputs**: Each requires its own `inputProof`
- **Separate proofs**: `inputProof1` for `encryptedValue1`, `inputProof2` for `encryptedValue2`
- **Multiple `FHE.allowThis()` calls**: One for each encrypted value

**Why it's needed:**
- Contract needs two values to perform arithmetic operations
- Can only be called once (prevents re-initialization)

**Common mistake:**
- Passing only one `inputProof` for two inputs causes validation failure

#### 3. Request Entropy

```solidity
function requestEntropy(bytes32 tag) external payable returns (uint256 requestId) {
    require(initialized, "Not initialized");
    require(msg.value >= entropyOracle.getFee(), "Insufficient fee");
    
    requestId = entropyOracle.requestEntropy{value: msg.value}(tag);
    entropyRequests[requestId] = true;
    
    return requestId;
}
```

**What it does:**
- Checks contract is initialized
- Validates fee payment (0.00001 ETH)
- Requests entropy from EntropyOracle
- Stores request ID for later use
- Returns request ID

**Key concepts:**
- `tag`: Unique identifier for this request
- `requestId`: Unique identifier returned by oracle
- Fee: Must be exactly 0.00001 ETH

#### 4. Add with Entropy

```solidity
function addWithEntropy(uint256 requestId) external returns (euint64 result) {
    require(entropyOracle.isRequestFulfilled(requestId), "Entropy not ready");
    
    euint64 entropy = entropyOracle.getEncryptedEntropy(requestId);
    FHE.allowThis(entropy);  // CRITICAL!
    
    euint64 sum = FHE.add(value1, value2);
    FHE.allowThis(sum);
    
    result = FHE.xor(sum, entropy);
    FHE.allowThis(result);
    
    return result;
}
```

**What it does:**
- Validates request ID and fulfillment status
- Gets encrypted entropy from oracle
- **Grants permission** to use entropy (CRITICAL!)
- Adds two values using `FHE.add()`
- Mixes result with entropy using XOR
- Returns entropy-enhanced result

**Key concepts:**
- `FHE.add()`: Addition on encrypted values
- `FHE.xor()`: XOR operation for mixing
- Multiple `FHE.allowThis()` calls: Required for each encrypted value

**Why XOR then return:**
- XOR mixes entropy with sum (creates randomness)
- Result: Entropy-enhanced addition (not just value1 + value2)

**Common mistake:**
- Forgetting `FHE.allowThis(entropy)` causes `SenderNotAllowed()` error

#### 5. Subtract and Multiply

Similar pattern to `addWithEntropy()`:
- `subtractWithEntropy()`: Uses `FHE.sub()` then XOR with entropy
- `multiplyWithEntropy()`: Uses `FHE.mul()` then XOR with entropy

## 🧪 Step-by-Step Testing

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

2. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```

### Running Tests

```bash
npx hardhat test
```

### What Happens in Tests

1. **Fixture Setup** (`deployContractFixture`):
   - Deploys FHEChaosEngine locally
   - Initializes master seed (encrypted)
   - Deploys EntropyOracle locally
   - Deploys EntropyArithmetic with oracle address
   - Returns all contract instances

2. **Test: Deployment**
   ```typescript
   it("Should deploy successfully", async function () {
     const { contract } = await loadFixture(deployContractFixture);
     expect(await contract.getAddress()).to.be.properAddress;
   });
   ```
   - Verifies contract deploys correctly

3. **Test: Initialization with Two Values**
   ```typescript
   it("Should initialize with two encrypted values", async function () {
     const input1 = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
     input1.add64(5);
     const encryptedInput1 = await input1.encrypt();
     
     const input2 = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
     input2.add64(3);
     const encryptedInput2 = await input2.encrypt();
     
     await contract.initialize(
       encryptedInput1.handles[0],
       encryptedInput2.handles[0],
       encryptedInput1.inputProof,
       encryptedInput2.inputProof
     );
   });
   ```
   - Creates two encrypted inputs (values: 5 and 3)
   - Encrypts both using FHEVM SDK
   - Calls `initialize()` with both handles and proofs
   - Verifies initialization succeeded

4. **Test: Basic Addition**
   ```typescript
   it("Should perform addition", async function () {
     // ... initialization code ...
     const result = await contract.add();
     expect(result).to.not.be.undefined;
   });
   ```
   - Performs addition on encrypted values
   - Result is encrypted (5 + 3 = 8, but encrypted)

5. **Test: Entropy Request**
   ```typescript
   it("Should request entropy", async function () {
     const tag = hre.ethers.id("test-arithmetic");
     const fee = await oracle.getFee();
     await expect(
       contract.requestEntropy(tag, { value: fee })
     ).to.emit(contract, "EntropyRequested");
   });
   ```
   - Requests entropy with unique tag
   - Pays required fee
   - Verifies request event is emitted

### Expected Test Output

```
  EntropyArithmetic
    Deployment
      ✓ Should deploy successfully
      ✓ Should not be initialized by default
      ✓ Should have EntropyOracle address set
    Initialization
      ✓ Should initialize with two encrypted values
      ✓ Should not allow double initialization
    Basic Arithmetic Operations
      ✓ Should perform addition
      ✓ Should perform subtraction
      ✓ Should perform multiplication
      ✓ Should not allow operations before initialization
    Entropy-based Operations
      ✓ Should request entropy

  9 passing
```

**Note:** Encrypted values appear as handles in test output. Decrypt off-chain using FHEVM SDK to see actual values.

## 🚀 Step-by-Step Deployment

### Option 1: Frontend (Recommended)

1. Navigate to [Examples page](/examples)
2. Find "EntropyArithmetic" in Tutorial Examples
3. Click **"Deploy"** button
4. Approve transaction in wallet
5. Wait for deployment confirmation
6. Copy deployed contract address

**Advantages:**
- Constructor argument automatically included
- No manual ABI encoding needed
- Real-time transaction status

### Option 2: CLI

1. **Create deploy script** (`scripts/deploy.ts`):
   ```typescript
   import hre from "hardhat";

   async function main() {
     const ENTROPY_ORACLE_ADDRESS = "0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361";
     
     const ContractFactory = await hre.ethers.getContractFactory("EntropyArithmetic");
     const contract = await ContractFactory.deploy(ENTROPY_ORACLE_ADDRESS);
     await contract.waitForDeployment();
     
     const address = await contract.getAddress();
     console.log("EntropyArithmetic deployed to:", address);
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

2. **Deploy:**
   ```bash
   npx hardhat run scripts/deploy.ts --network sepolia
   ```

3. **Save contract address** for verification

## ✅ Step-by-Step Verification

### Option 1: Frontend

1. After deployment, click **"Verify"** button on Examples page
2. Wait for verification confirmation
3. View verified contract on Etherscan

### Option 2: CLI

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> 0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361
```

**Important:** Constructor argument must be the EntropyOracle address: `0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361`

### Verification Output

```
Successfully verified contract EntropyArithmetic on Etherscan.
https://sepolia.etherscan.io/address/<CONTRACT_ADDRESS>#code
```

## 📊 Expected Outputs

### After Initialization

- `isInitialized()` returns `true`
- Two encrypted values stored (value1 and value2)
- `ValuesInitialized` event emitted

### After Basic Operations

- `add()` returns encrypted sum (value1 + value2)
- `subtract()` returns encrypted difference (value1 - value2)
- `multiply()` returns encrypted product (value1 * value2)
- All results are encrypted (decrypt off-chain to see values)

### After Entropy-Enhanced Operations

- `addWithEntropy()` returns entropy-mixed sum
- `subtractWithEntropy()` returns entropy-mixed difference
- `multiplyWithEntropy()` returns entropy-mixed product
- Results are unpredictable due to entropy mixing
- All operations performed on encrypted data

## ⚠️ Common Errors & Solutions

### Error: `SenderNotAllowed()`

**Cause:** Missing `FHE.allowThis()` call on encrypted value.

**Example:**
```solidity
euint64 entropy = entropyOracle.getEncryptedEntropy(requestId);
// Missing: FHE.allowThis(entropy);
euint64 result = FHE.add(value1, value2); // ❌ Error if entropy used later!
```

**Solution:**
```solidity
euint64 entropy = entropyOracle.getEncryptedEntropy(requestId);
FHE.allowThis(entropy); // ✅ Required!
euint64 sum = FHE.add(value1, value2);
FHE.allowThis(sum);
result = FHE.xor(sum, entropy);
```

**Prevention:** Always call `FHE.allowThis()` on all encrypted values before using them.

---

### Error: `Incorrect number of arguments`

**Cause:** Wrong number of input proofs passed to `initialize()`.

**Example:**
```typescript
await contract.initialize(
  encryptedInput1.handles[0],
  encryptedInput2.handles[0],
  encryptedInput1.inputProof  // ❌ Only one proof for two inputs!
);
```

**Solution:**
```typescript
await contract.initialize(
  encryptedInput1.handles[0],
  encryptedInput2.handles[0],
  encryptedInput1.inputProof,  // ✅ First proof
  encryptedInput2.inputProof   // ✅ Second proof
);
```

**Prevention:** Each `externalEuint64` parameter requires its own `inputProof`.

---

### Error: `Entropy not ready`

**Cause:** Calling entropy-enhanced functions before entropy is fulfilled.

**Solution:**
```typescript
const requestId = await contract.requestEntropy(tag, { value: fee });

// Wait for fulfillment
let fulfilled = false;
while (!fulfilled) {
  fulfilled = await contract.entropyOracle.isRequestFulfilled(requestId);
  if (!fulfilled) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

await contract.addWithEntropy(requestId); // ✅ Now it's ready
```

---

### Error: `Invalid oracle address`

**Cause:** Wrong or zero address passed to constructor.

**Solution:** Always use the fixed EntropyOracle address: `0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361`

---

### Error: `Already initialized`

**Cause:** Trying to initialize contract twice.

**Solution:** Initialize only once. If you need to reset, deploy a new contract.

---

### Error: `Insufficient fee`

**Cause:** Not sending enough ETH when requesting entropy.

**Solution:** Always send exactly 0.00001 ETH:
```typescript
const fee = await contract.entropyOracle.getFee();
await contract.requestEntropy(tag, { value: fee });
```

---

### Error: Verification failed - Constructor arguments mismatch

**Cause:** Wrong constructor argument used during verification.

**Solution:** Always use the EntropyOracle address:
```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS> 0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361
```

## 🔗 Related Examples

- [EntropyCounter](../basic-simplecounter/) - Entropy-based counter
- [EntropyEqualityComparison](../basic-equalitycomparison/) - Entropy-based comparisons
- [EntropyEncryption](../encryption-encryptsingle/) - Encrypting values with entropy
- [Category: basic](../)

## 📚 Additional Resources

- [Full Tutorial Track Documentation](../../../frontend/src/pages/Docs.tsx) - Complete educational guide
- [Zama FHEVM Documentation](https://docs.zama.org/) - Official FHEVM docs
- [GitHub Repository](https://github.com/zacnider/entrofhe/tree/main/examples/basic-arithmetic) - Source code

## 📝 License

BSD-3-Clause-Clear
