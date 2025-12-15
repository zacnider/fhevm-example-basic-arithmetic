# EntropyArithmetic

FHE arithmetic operations using EntropyOracle

## 🚀 Quick Start

1. **Clone this repository:**
   ```bash
   git clone https://github.com/zacnider/fhevm-example-basic-arithmetic.git
   cd fhevm-example-basic-arithmetic
   ```

2. **Install dependencies:**
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Setup environment:**
   ```bash
   npm run setup
   ```
   Then edit `.env` file with your credentials:
   - `SEPOLIA_RPC_URL` - Your Sepolia RPC endpoint
   - `PRIVATE_KEY` - Your wallet private key (for deployment)
   - `ETHERSCAN_API_KEY` - Your Etherscan API key (for verification)

4. **Compile contracts:**
   ```bash
   npm run compile
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

6. **Deploy to Sepolia:**
   ```bash
   npm run deploy:sepolia
   ```

7. **Verify contract (after deployment):**
   ```bash
   npm run verify <CONTRACT_ADDRESS>
   ```

**Alternative:** Use the [Examples page](https://entrofhe.vercel.app/examples) for browser-based deployment and verification.

---

## 📋 Overview

@title EntropyArithmetic
@notice FHE arithmetic operations using EntropyOracle
@dev Example demonstrating EntropyOracle integration: using entropy in arithmetic operations
This example shows:
- How to integrate with EntropyOracle
- Using entropy to enhance arithmetic operations
- Entropy-based calculations (add, sub, mul with entropy)
- Combining entropy with encrypted values

@notice Constructor - sets EntropyOracle address
@param _entropyOracle Address of EntropyOracle contract

@notice Initialize two encrypted values
@param encryptedValue1 First encrypted value
@param encryptedValue2 Second encrypted value
@param inputProof1 Input proof for first encrypted value
@param inputProof2 Input proof for second encrypted value

@notice Request entropy for arithmetic operations
@param tag Unique tag for this request
@return requestId Request ID from EntropyOracle
@dev Requires 0.00001 ETH fee

@notice Add two encrypted values
@return result Encrypted sum of value1 + value2

@notice Add values with entropy enhancement
@param requestId Request ID from requestEntropy()
@return result Encrypted sum enhanced with entropy

@notice Subtract value2 from value1
@return result Encrypted difference (value1 - value2)

@notice Subtract with entropy enhancement
@param requestId Request ID from requestEntropy()
@return result Encrypted difference enhanced with entropy

@notice Multiply two encrypted values
@return result Encrypted product of value1 * value2

@notice Multiply with entropy enhancement
@param requestId Request ID from requestEntropy()
@return result Encrypted product enhanced with entropy

@notice Check if values are initialized

@notice Get EntropyOracle address



## 🔐 Zama FHEVM Usage

This example demonstrates the following **Zama FHEVM** features:

### Zama FHEVM Features Used

- **ZamaEthereumConfig**: Inherits from Zama's network configuration
  ```solidity
  contract EntropyArithmetic is ZamaEthereumConfig {
      // Inherits network-specific FHEVM configuration
  }
  ```

- **FHE Operations**: Uses Zama's FHE library for encrypted arithmetic
  - `FHE.add()` - Encrypted addition
  - `FHE.sub()` - Encrypted subtraction
  - `FHE.mul()` - Encrypted multiplication
  - `FHE.xor()` - Encrypted XOR operation

- **Encrypted Types**: Uses Zama's encrypted integer types
  - `euint64` - 64-bit encrypted unsigned integer
  - `externalEuint64` - External encrypted value from user

- **Access Control**: Uses Zama's permission system
  - `FHE.allowThis()` - Allow contract to use encrypted values
  - `FHE.fromExternal()` - Convert external encrypted values to internal

### Zama FHEVM Imports

```solidity
// Zama FHEVM Core Library - FHE operations and encrypted types
import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";

// Zama Network Configuration - Provides network-specific settings
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
```

### Zama FHEVM Code Example

```solidity
// Using Zama FHEVM's encrypted integer type
euint64 private value1;
euint64 private value2;

// Converting external encrypted value to internal (Zama FHEVM)
euint64 internalValue = FHE.fromExternal(encryptedValue, inputProof);
FHE.allowThis(internalValue); // Zama FHEVM permission system

// Performing encrypted arithmetic using Zama FHEVM operations
euint64 sum = FHE.add(value1, value2);
FHE.allowThis(sum);

// Using Zama FHEVM's XOR operation for entropy mixing
euint64 entropy = entropyOracle.getEncryptedEntropy(requestId);
FHE.allowThis(entropy);
euint64 result = FHE.xor(sum, entropy);
```

### Zama FHEVM Concepts Demonstrated

1. **Encrypted Arithmetic**: Performing addition, subtraction, and multiplication on encrypted data
2. **External Encryption**: Handling user-provided encrypted values with input proofs
3. **Permission Management**: Using Zama's access control system (`FHE.allowThis`)
4. **Entropy Integration**: Combining Zama FHEVM operations with entropy for enhanced security

### Learn More About Zama FHEVM

- 📚 [Zama FHEVM Documentation](https://docs.zama.org/protocol)
- 🎓 [Zama Developer Hub](https://www.zama.org/developer-hub)
- 💻 [Zama FHEVM GitHub](https://github.com/zama-ai/fhevm)

## 🔍 Contract Code

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.27;

import {FHE, euint64, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import "./IEntropyOracle.sol";

/**
 * @title EntropyArithmetic
 * @notice FHE arithmetic operations using EntropyOracle
 * @dev Example demonstrating EntropyOracle integration: using entropy in arithmetic operations
 * 
 * This example shows:
 * - How to integrate with EntropyOracle
 * - Using entropy to enhance arithmetic operations
 * - Entropy-based calculations (add, sub, mul with entropy)
 * - Combining entropy with encrypted values
 */
contract EntropyArithmetic is ZamaEthereumConfig {
    // Entropy Oracle interface
    IEntropyOracle public entropyOracle;
    
    // Encrypted values for arithmetic operations
    euint64 private value1;
    euint64 private value2;
    
    bool private initialized;
    
    // Track entropy requests
    mapping(uint256 => bool) public entropyRequests;
    
    event ValuesInitialized(address indexed initializer);
    event EntropyRequested(uint256 indexed requestId, address indexed caller);
    event AdditionPerformed(euint64 result);
    event SubtractionPerformed(euint64 result);
    event MultiplicationPerformed(euint64 result);
    event EntropyAdditionPerformed(uint256 indexed requestId, euint64 result);
    event EntropySubtractionPerformed(uint256 indexed requestId, euint64 result);
    event EntropyMultiplicationPerformed(uint256 indexed requestId, euint64 result);
    
    /**
     * @notice Constructor - sets EntropyOracle address
     * @param _entropyOracle Address of EntropyOracle contract
     */
    constructor(address _entropyOracle) {
        require(_entropyOracle != address(0), "Invalid oracle address");
        entropyOracle = IEntropyOracle(_entropyOracle);
    }
    
    /**
     * @notice Initialize two encrypted values
     * @param encryptedValue1 First encrypted value
     * @param encryptedValue2 Second encrypted value
     * @param inputProof1 Input proof for first encrypted value
     * @param inputProof2 Input proof for second encrypted value
     */
    function initialize(
        externalEuint64 encryptedValue1,
        externalEuint64 encryptedValue2,
        bytes calldata inputProof1,
        bytes calldata inputProof2
    ) external {
        require(!initialized, "Already initialized");
        
        // Convert external to internal
        euint64 internalValue1 = FHE.fromExternal(encryptedValue1, inputProof1);
        euint64 internalValue2 = FHE.fromExternal(encryptedValue2, inputProof2);
        
        // Allow contract to use
        FHE.allowThis(internalValue1);
        FHE.allowThis(internalValue2);
        
        value1 = internalValue1;
        value2 = internalValue2;
        initialized = true;
        
        emit ValuesInitialized(msg.sender);
    }
    
    /**
     * @notice Request entropy for arithmetic operations
     * @param tag Unique tag for this request
     * @return requestId Request ID from EntropyOracle
     * @dev Requires 0.00001 ETH fee
     */
    function requestEntropy(bytes32 tag) external payable returns (uint256 requestId) {
        require(initialized, "Not initialized");
        require(msg.value >= entropyOracle.getFee(), "Insufficient fee");
        
        requestId = entropyOracle.requestEntropy{value: msg.value}(tag);
        entropyRequests[requestId] = true;
        
        emit EntropyRequested(requestId, msg.sender);
        return requestId;
    }
    
    /**
     * @notice Add two encrypted values
     * @return result Encrypted sum of value1 + value2
     */
    function add() external returns (euint64 result) {
        require(initialized, "Not initialized");
        result = FHE.add(value1, value2);
        FHE.allowThis(result);
        emit AdditionPerformed(result);
        return result;
    }
    
    /**
     * @notice Add values with entropy enhancement
     * @param requestId Request ID from requestEntropy()
     * @return result Encrypted sum enhanced with entropy
     */
    function addWithEntropy(uint256 requestId) external returns (euint64 result) {
        require(initialized, "Not initialized");
        require(entropyRequests[requestId], "Invalid request ID");
        require(entropyOracle.isRequestFulfilled(requestId), "Entropy not ready");
        
        // Get entropy
        euint64 entropy = entropyOracle.getEncryptedEntropy(requestId);
        FHE.allowThis(entropy);
        
        // Add values
        euint64 sum = FHE.add(value1, value2);
        FHE.allowThis(sum);
        
        // Mix with entropy using XOR
        result = FHE.xor(sum, entropy);
        FHE.allowThis(result);
        
        entropyRequests[requestId] = false;
        emit EntropyAdditionPerformed(requestId, result);
        return result;
    }
    
    /**
     * @notice Subtract value2 from value1
     * @return result Encrypted difference (value1 - value2)
     */
    function subtract() external returns (euint64 result) {
        require(initialized, "Not initialized");
        result = FHE.sub(value1, value2);
        FHE.allowThis(result);
        emit SubtractionPerformed(result);
        return result;
    }
    
    /**
     * @notice Subtract with entropy enhancement
     * @param requestId Request ID from requestEntropy()
     * @return result Encrypted difference enhanced with entropy
     */
    function subtractWithEntropy(uint256 requestId) external returns (euint64 result) {
        require(initialized, "Not initialized");
        require(entropyRequests[requestId], "Invalid request ID");
        require(entropyOracle.isRequestFulfilled(requestId), "Entropy not ready");
        
        euint64 entropy = entropyOracle.getEncryptedEntropy(requestId);
        FHE.allowThis(entropy);
        
        euint64 diff = FHE.sub(value1, value2);
        FHE.allowThis(diff);
        
        result = FHE.xor(diff, entropy);
        FHE.allowThis(result);
        
        entropyRequests[requestId] = false;
        emit EntropySubtractionPerformed(requestId, result);
        return result;
    }
    
    /**
     * @notice Multiply two encrypted values
     * @return result Encrypted product of value1 * value2
     */
    function multiply() external returns (euint64 result) {
        require(initialized, "Not initialized");
        result = FHE.mul(value1, value2);
        FHE.allowThis(result);
        emit MultiplicationPerformed(result);
        return result;
    }
    
    /**
     * @notice Multiply with entropy enhancement
     * @param requestId Request ID from requestEntropy()
     * @return result Encrypted product enhanced with entropy
     */
    function multiplyWithEntropy(uint256 requestId) external returns (euint64 result) {
        require(initialized, "Not initialized");
        require(entropyRequests[requestId], "Invalid request ID");
        require(entropyOracle.isRequestFulfilled(requestId), "Entropy not ready");
        
        euint64 entropy = entropyOracle.getEncryptedEntropy(requestId);
        FHE.allowThis(entropy);
        
        euint64 product = FHE.mul(value1, value2);
        FHE.allowThis(product);
        
        result = FHE.xor(product, entropy);
        FHE.allowThis(result);
        
        entropyRequests[requestId] = false;
        emit EntropyMultiplicationPerformed(requestId, result);
        return result;
    }
    
    /**
     * @notice Check if values are initialized
     */
    function isInitialized() external view returns (bool) {
        return initialized;
    }
    
    /**
     * @notice Get EntropyOracle address
     */
    function getEntropyOracle() external view returns (address) {
        return address(entropyOracle);
    }
}

```

## 🧪 Tests

See [test file](./test/EntropyArithmetic.test.ts) for comprehensive test coverage.

```bash
npm test
```


## 📚 Category

**basic**



## 🔗 Related Examples

- [All basic examples](https://github.com/zacnider/entrofhe/tree/main/examples)

## 📝 License

BSD-3-Clause-Clear
