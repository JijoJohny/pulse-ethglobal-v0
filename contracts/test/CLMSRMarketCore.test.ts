import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import { Contract, Signer } from "ethers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("CLMSRMarketCore", function () {
  let marketCore: Contract;
  let position: Contract;
  let rbtcToken: Contract;
  let deployer: Signer;
  let admin: Signer;
  let keeper: Signer;
  let user1: Signer;
  let user2: Signer;

  const INITIAL_SUPPLY = ethers.parseEther("1000000");
  const TEST_AMOUNT = ethers.parseEther("1000");

  beforeEach(async function () {
    [deployer, admin, keeper, user1, user2] = await ethers.getSigners();

    // Deploy mock RBTC token
    const MockRBTC = await ethers.getContractFactory("MockRBTC");
    rbtcToken = await MockRBTC.deploy(
      "Rootstock Bitcoin",
      "RBTC",
      18,
      INITIAL_SUPPLY
    );
    await rbtcToken.waitForDeployment();

    // Deploy CLMSRPosition
    const CLMSRPosition = await ethers.getContractFactory("CLMSRPosition");
    position = await upgrades.deployProxy(
      CLMSRPosition,
      [
        ethers.ZeroAddress, // marketCore will be set later
        "CLMSR Position NFT",
        "CLMSR-POS",
        "https://api.test.com/",
        "https://api.test.com/contract"
      ],
      { initializer: "initialize", kind: "uups" }
    );
    await position.waitForDeployment();

    // Deploy CLMSRMarketCore
    const CLMSRMarketCore = await ethers.getContractFactory("CLMSRMarketCore");
    marketCore = await upgrades.deployProxy(
      CLMSRMarketCore,
      [await rbtcToken.getAddress(), await position.getAddress()],
      { initializer: "initialize", kind: "uups" }
    );
    await marketCore.waitForDeployment();

    // Grant roles
    const MARKET_CORE_ROLE = await position.MARKET_CORE_ROLE();
    await position.grantRole(MARKET_CORE_ROLE, await marketCore.getAddress());

    const ADMIN_ROLE = await marketCore.ADMIN_ROLE();
    const KEEPER_ROLE = await marketCore.KEEPER_ROLE();
    
    await marketCore.grantRole(ADMIN_ROLE, await admin.getAddress());
    await marketCore.grantRole(KEEPER_ROLE, await keeper.getAddress());

    // Transfer tokens to users
    await rbtcToken.transfer(await user1.getAddress(), TEST_AMOUNT);
    await rbtcToken.transfer(await user2.getAddress(), TEST_AMOUNT);

    // Approve market core to spend user tokens
    await rbtcToken.connect(user1).approve(await marketCore.getAddress(), TEST_AMOUNT);
    await rbtcToken.connect(user2).approve(await marketCore.getAddress(), TEST_AMOUNT);
  });

  describe("Market Management", function () {
    it("Should create a new market", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 3600; // 1 hour from now
      const endTime = startTime + 86400; // 24 hours duration

      const tx = await marketCore.connect(admin).createMarket(
        0,        // minTick
        1000,     // maxTick
        10,       // tickSpacing
        startTime,
        endTime,
        ethers.parseEther("100") // liquidityParameter
      );

      const receipt = await tx.wait();
      const events = receipt.logs.filter((log: any) => {
        try {
          return marketCore.interface.parseLog(log)?.name === "MarketCreated";
        } catch {
          return false;
        }
      });

      expect(events).to.have.length(1);
      
      const marketId = 1;
      const market = await marketCore.getMarket(marketId);
      
      expect(market.marketId).to.equal(marketId);
      expect(market.isActive).to.be.true;
      expect(market.isSettled).to.be.false;
      expect(market.minTick).to.equal(0);
      expect(market.maxTick).to.equal(1000);
      expect(market.tickSpacing).to.equal(10);
    });

    it("Should not create market with invalid parameters", async function () {
      const currentTime = await time.latest();
      
      // Invalid tick range
      await expect(
        marketCore.connect(admin).createMarket(
          1000, 0, 10, currentTime + 3600, currentTime + 86400, ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(marketCore, "InvalidTickRange");

      // Invalid timing
      await expect(
        marketCore.connect(admin).createMarket(
          0, 1000, 10, currentTime + 86400, currentTime + 3600, ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(marketCore, "InvalidTiming");

      // Invalid liquidity parameter
      await expect(
        marketCore.connect(admin).createMarket(
          0, 1000, 10, currentTime + 3600, currentTime + 86400, 0
        )
      ).to.be.revertedWithCustomError(marketCore, "InvalidLiquidityParameter");
    });

    it("Should settle a market", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 100;
      const endTime = startTime + 1000;

      // Create market
      await marketCore.connect(admin).createMarket(
        0, 1000, 10, startTime, endTime, ethers.parseEther("100")
      );

      // Fast forward past end time
      await time.increaseTo(endTime + 1);

      // Settle market
      const settlementTick = 500;
      await marketCore.connect(keeper).settleMarket(1, settlementTick);

      const market = await marketCore.getMarket(1);
      expect(market.isSettled).to.be.true;
      expect(market.settlementTick).to.equal(settlementTick);
    });
  });

  describe("Position Management", function () {
    let marketId: number;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 100;
      const endTime = startTime + 86400;

      await marketCore.connect(admin).createMarket(
        0, 1000, 10, startTime, endTime, ethers.parseEther("100")
      );
      marketId = 1;

      // Fast forward to market start
      await time.increaseTo(startTime + 1);
    });

    it("Should open a position", async function () {
      const lowerTick = 100;
      const upperTick = 200;
      const quantity = ethers.parseEther("10");
      const maxCost = ethers.parseEther("50");

      const tx = await marketCore.connect(user1).openPosition(
        await user1.getAddress(),
        marketId,
        lowerTick,
        upperTick,
        quantity,
        maxCost
      );

      const receipt = await tx.wait();
      const events = receipt.logs.filter((log: any) => {
        try {
          return marketCore.interface.parseLog(log)?.name === "PositionOpened";
        } catch {
          return false;
        }
      });

      expect(events).to.have.length(1);

      const positionId = 1;
      const positionData = await position.getPosition(positionId);
      
      expect(positionData[0]).to.equal(await user1.getAddress()); // owner
      expect(positionData[1]).to.equal(marketId); // marketId
      expect(positionData[2]).to.equal(lowerTick); // lowerTick
      expect(positionData[3]).to.equal(upperTick); // upperTick
      expect(positionData[4]).to.equal(quantity); // quantity
    });

    it("Should calculate position cost correctly", async function () {
      const lowerTick = 100;
      const upperTick = 200;
      const quantity = ethers.parseEther("10");

      const cost = await marketCore.calculateOpenCost(
        marketId,
        lowerTick,
        upperTick,
        quantity
      );

      expect(cost).to.be.gt(0);
      console.log("Position cost:", ethers.formatEther(cost), "RBTC");
    });

    it("Should increase position quantity", async function () {
      const lowerTick = 100;
      const upperTick = 200;
      const quantity = ethers.parseEther("10");
      const maxCost = ethers.parseEther("50");

      // Open initial position
      await marketCore.connect(user1).openPosition(
        await user1.getAddress(),
        marketId,
        lowerTick,
        upperTick,
        quantity,
        maxCost
      );

      const positionId = 1;
      const additionalQuantity = ethers.parseEther("5");
      const additionalMaxCost = ethers.parseEther("25");

      // Increase position
      await marketCore.connect(user1).increasePosition(
        positionId,
        additionalQuantity,
        additionalMaxCost
      );

      const positionData = await position.getPosition(positionId);
      expect(positionData[4]).to.equal(quantity + additionalQuantity); // quantity
    });

    it("Should close a position", async function () {
      const lowerTick = 100;
      const upperTick = 200;
      const quantity = ethers.parseEther("10");
      const maxCost = ethers.parseEther("50");

      // Open position
      await marketCore.connect(user1).openPosition(
        await user1.getAddress(),
        marketId,
        lowerTick,
        upperTick,
        quantity,
        maxCost
      );

      const positionId = 1;
      const minProceeds = 0;

      // Close position
      await marketCore.connect(user1).closePosition(positionId, minProceeds);

      // Position should no longer exist
      await expect(position.getPosition(positionId))
        .to.be.revertedWithCustomError(position, "PositionNotExists");
    });
  });

  describe("Settlement and Claims", function () {
    let marketId: number;
    let positionId: number;

    beforeEach(async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 100;
      const endTime = startTime + 1000;

      await marketCore.connect(admin).createMarket(
        0, 1000, 10, startTime, endTime, ethers.parseEther("100")
      );
      marketId = 1;

      // Fast forward to market start
      await time.increaseTo(startTime + 1);

      // Open a position
      await marketCore.connect(user1).openPosition(
        await user1.getAddress(),
        marketId,
        400, // lowerTick
        600, // upperTick
        ethers.parseEther("10"),
        ethers.parseEther("50")
      );
      positionId = 1;

      // Fast forward past market end and settle
      await time.increaseTo(endTime + 1);
      await marketCore.connect(keeper).settleMarket(marketId, 500); // Settlement within position range
    });

    it("Should settle and claim winning position", async function () {
      const initialBalance = await rbtcToken.balanceOf(await user1.getAddress());

      // Claim payout
      await marketCore.connect(user1).claimPayout(positionId);

      const finalBalance = await rbtcToken.balanceOf(await user1.getAddress());
      expect(finalBalance).to.be.gt(initialBalance);

      const positionDetails = await position.getPositionDetails(positionId);
      expect(positionDetails.isClaimed).to.be.true;
    });

    it("Should handle losing position", async function () {
      // Create another market and position that will lose
      const currentTime = await time.latest();
      const startTime = currentTime + 100;
      const endTime = startTime + 1000;

      await marketCore.connect(admin).createMarket(
        0, 1000, 10, startTime, endTime, ethers.parseEther("100")
      );
      const losingMarketId = 2;

      await time.increaseTo(startTime + 1);

      // Open position that will lose
      await marketCore.connect(user2).openPosition(
        await user2.getAddress(),
        losingMarketId,
        700, // lowerTick
        800, // upperTick
        ethers.parseEther("10"),
        ethers.parseEther("50")
      );
      const losingPositionId = 2;

      // Settle market outside position range
      await time.increaseTo(endTime + 1);
      await marketCore.connect(keeper).settleMarket(losingMarketId, 500);

      const initialBalance = await rbtcToken.balanceOf(await user2.getAddress());

      // Claim should give 0 payout
      await marketCore.connect(user2).claimPayout(losingPositionId);

      const finalBalance = await rbtcToken.balanceOf(await user2.getAddress());
      expect(finalBalance).to.equal(initialBalance); // No change in balance
    });
  });

  describe("Access Control", function () {
    it("Should only allow admin to create markets", async function () {
      const currentTime = await time.latest();
      
      await expect(
        marketCore.connect(user1).createMarket(
          0, 1000, 10, currentTime + 3600, currentTime + 86400, ethers.parseEther("100")
        )
      ).to.be.revertedWithCustomError(marketCore, "AccessControlUnauthorizedAccount");
    });

    it("Should only allow keeper to settle markets", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 100;
      const endTime = startTime + 1000;

      await marketCore.connect(admin).createMarket(
        0, 1000, 10, startTime, endTime, ethers.parseEther("100")
      );

      await time.increaseTo(endTime + 1);

      await expect(
        marketCore.connect(user1).settleMarket(1, 500)
      ).to.be.revertedWithCustomError(marketCore, "AccessControlUnauthorizedAccount");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero quantity gracefully", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 100;
      const endTime = startTime + 86400;

      await marketCore.connect(admin).createMarket(
        0, 1000, 10, startTime, endTime, ethers.parseEther("100")
      );

      await time.increaseTo(startTime + 1);

      await expect(
        marketCore.connect(user1).openPosition(
          await user1.getAddress(),
          1,
          100,
          200,
          0, // zero quantity
          ethers.parseEther("50")
        )
      ).to.be.revertedWithCustomError(marketCore, "InvalidQuantity");
    });

    it("Should handle cost exceeding maximum", async function () {
      const currentTime = await time.latest();
      const startTime = currentTime + 100;
      const endTime = startTime + 86400;

      await marketCore.connect(admin).createMarket(
        0, 1000, 10, startTime, endTime, ethers.parseEther("1") // Very low liquidity parameter
      );

      await time.increaseTo(startTime + 1);

      await expect(
        marketCore.connect(user1).openPosition(
          await user1.getAddress(),
          1,
          100,
          200,
          ethers.parseEther("1000"), // Large quantity
          ethers.parseEther("1") // Very low max cost
        )
      ).to.be.revertedWithCustomError(marketCore, "CostExceedsMax");
    });
  });
});
