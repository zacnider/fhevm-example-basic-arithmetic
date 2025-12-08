import { expect } from "chai";
import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { EntropyArithmetic } from "../types";

/**
 * @title EntropyArithmetic Tests
 * @notice Comprehensive tests for EntropyArithmetic contract with EntropyOracle integration
 * @chapter basic
 */
describe("EntropyArithmetic", function () {
  async function deployContractFixture() {
    const [owner, user1] = await hre.ethers.getSigners();
    
    // Check if we're on Sepolia and have real oracle address
    const network = await hre.ethers.provider.getNetwork();
    const isSepolia = network.chainId === BigInt(11155111);
    const realOracleAddress = process.env.ENTROPY_ORACLE_ADDRESS || "0x75b923d7940E1BD6689EbFdbBDCD74C1f6695361";
    
    let oracleAddress: string;
    let oracle: any;
    let chaosEngine: any;
    
    if (isSepolia && realOracleAddress && realOracleAddress !== "0x0000000000000000000000000000000000000000") {
      // Use real deployed EntropyOracle on Sepolia
      console.log(`Using real EntropyOracle on Sepolia: ${realOracleAddress}`);
      oracleAddress = realOracleAddress;
      const OracleFactory = await hre.ethers.getContractFactory("EntropyOracle");
      oracle = OracleFactory.attach(oracleAddress);
    } else {
      // Deploy locally for testing
      console.log("Deploying EntropyOracle locally for testing...");
      
      // Deploy FHEChaosEngine
      const ChaosEngineFactory = await hre.ethers.getContractFactory("FHEChaosEngine");
      chaosEngine = await ChaosEngineFactory.deploy(owner.address);
      await chaosEngine.waitForDeployment();
      const chaosEngineAddress = await chaosEngine.getAddress();
      
      // Initialize master seed for FHEChaosEngine
      const masterSeedInput = hre.fhevm.createEncryptedInput(chaosEngineAddress, owner.address);
      masterSeedInput.add64(12345);
      const encryptedMasterSeed = await masterSeedInput.encrypt();
      await chaosEngine.initializeMasterSeed(encryptedMasterSeed.handles[0], encryptedMasterSeed.inputProof);
      
      // Deploy EntropyOracle
      const OracleFactory = await hre.ethers.getContractFactory("EntropyOracle");
      oracle = await OracleFactory.deploy(chaosEngineAddress, owner.address, owner.address);
      await oracle.waitForDeployment();
      oracleAddress = await oracle.getAddress();
    }
    
    // Deploy EntropyArithmetic
    const ContractFactory = await hre.ethers.getContractFactory("EntropyArithmetic");
    const contract = await ContractFactory.deploy(oracleAddress) as any;
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    
    await hre.fhevm.assertCoprocessorInitialized(contract, "EntropyArithmetic");
    
    return { contract, owner, user1, contractAddress, oracleAddress, oracle, chaosEngine: chaosEngine || null };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.getAddress()).to.be.properAddress;
    });

    it("Should not be initialized by default", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      expect(await contract.isInitialized()).to.be.false;
    });

    it("Should have EntropyOracle address set", async function () {
      const { contract, oracleAddress } = await loadFixture(deployContractFixture);
      expect(await contract.getEntropyOracle()).to.equal(oracleAddress);
    });
  });

  describe("Initialization", function () {
    it("Should initialize with two encrypted values", async function () {
      const { contract, contractAddress, owner, oracle } = await loadFixture(deployContractFixture);
      
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
      
      expect(await contract.isInitialized()).to.be.true;
    });

    it("Should not allow double initialization", async function () {
      const { contract, contractAddress, owner, oracle } = await loadFixture(deployContractFixture);
      
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
      
      await expect(
        contract.initialize(
          encryptedInput1.handles[0],
          encryptedInput2.handles[0],
          encryptedInput1.inputProof,
          encryptedInput2.inputProof
        )
      ).to.be.revertedWith("Already initialized");
    });
  });

  describe("Basic Arithmetic Operations", function () {
    it("Should perform addition", async function () {
      const { contract, contractAddress, owner, oracle } = await loadFixture(deployContractFixture);
      
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
      
      const result = await contract.add();
      expect(result).to.not.be.undefined;
    });

    it("Should perform subtraction", async function () {
      const { contract, contractAddress, owner, oracle } = await loadFixture(deployContractFixture);
      
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      input1.add64(10);
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
      
      const result = await contract.subtract();
      expect(result).to.not.be.undefined;
    });

    it("Should perform multiplication", async function () {
      const { contract, contractAddress, owner, oracle } = await loadFixture(deployContractFixture);
      
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
      
      const result = await contract.multiply();
      expect(result).to.not.be.undefined;
    });

    it("Should not allow operations before initialization", async function () {
      const { contract } = await loadFixture(deployContractFixture);
      
      await expect(contract.add()).to.be.revertedWith("Not initialized");
      await expect(contract.subtract()).to.be.revertedWith("Not initialized");
      await expect(contract.multiply()).to.be.revertedWith("Not initialized");
    });
  });

  describe("Entropy-based Operations", function () {
    it("Should request entropy", async function () {
      const { contract, contractAddress, owner, oracle } = await loadFixture(deployContractFixture);
      
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
      
      const tag = hre.ethers.id("test-arithmetic");
      const fee = await oracle.getFee();
      
      await expect(
        contract.requestEntropy(tag, { value: fee })
      ).to.emit(contract, "EntropyRequested");
    });
  });
});


