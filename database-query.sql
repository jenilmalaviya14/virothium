-- Create tables
CREATE TABLE `account_master` (
  `id` int NOT NULL AUTO_INCREMENT,
  `accountAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `pairAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `liquidityToken0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `liquidityToken1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `liquidityUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `priceUSD0` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `priceUSD1` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `totalSupply` double(30, 0) DEFAULT '0',
  `balanceOf` double(30, 0) DEFAULT '0',
  `conversationRatio` double(25, 18) NOT NULL DEFAULT '0.000000000000000000',
  `volumeToken0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `volumeToken1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `volumeUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `general_setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lastSyncPairRank` int NOT NULL,
  `lastSyncBlockNumber` int NOT NULL,
  `NativeTokenUSDRate` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `lastPriceFetchDateTime` datetime NOT NULL,
  `priceFetchIntervalSeconds` int NOT NULL,
  `platformFeesPercentage` decimal(10, 3) NOT NULL,
  `queueProcessCount` int NOT NULL DEFAULT '0',
  `queueWaitSeconds` int NOT NULL DEFAULT '0',
  `feeToAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `fetchMinutesAgoBlock` int NOT NULL DEFAULT '0',
  `maxBlockOffset` int NOT NULL DEFAULT '0',
  `platFormAverageBlockSeconds` decimal(10, 3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `pair_daily` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dayPairId` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `dayStartTimeStamp` bigint DEFAULT '0',
  `dayStartDateTime` datetime NOT NULL,
  `pairAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `priceUSDToken0` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `priceUSDToken1` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `dailyVolumeToken0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `dailyVolumeToken1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `dailyVolumeUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `dailyTransactions` bigint DEFAULT '0',
  `reserve0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `reserve1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `reserveUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `pair_hourly` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hourPairId` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `hourStartUnix` bigint DEFAULT '0',
  `hourStartDateTime` datetime NOT NULL,
  `pairAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `priceUSDToken0` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `priceUSDToken1` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `hourlyVolumeToken0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `hourlyVolumeToken1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `hourlyVolumeUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `hourlyTransactions` bigint DEFAULT '0',
  `reserve0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `reserve1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `reserveUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `pair_master` (
  `pairId` int NOT NULL AUTO_INCREMENT,
  `pairAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pairName` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `pairRank` int DEFAULT NULL,
  `tokenAddress0` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tokenAddress1` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `volumeUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `volumeToken0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `volumeToken1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `totalTransactions` bigint DEFAULT '0',
  `priceUSDToken0` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `priceUSDToken1` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `reserve0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `reserve1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `reserveUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `lastBlockTimeStamp` bigint DEFAULT '0',
  `lastTransactionDateTime` datetime DEFAULT NULL,
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`pairId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `token_daily` (
  `id` int NOT NULL AUTO_INCREMENT,
  `dayTokenId` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `dayStartTimeStamp` bigint DEFAULT '0',
  `dayStartDateTime` datetime NOT NULL,
  `tokenAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `priceUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `dailyVolumeToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `dailyVolumeNativeToken` double(30, 6) NOT NULL DEFAULT '0.000000',
  `dailyVolumeUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `dailyTransactions` bigint DEFAULT '0',
  `totalLiquidityToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `totalLiquidityNativeToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `totalLiquidityUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `token_hourly` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hourTokenId` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `hourStartUnix` bigint NOT NULL,
  `hourStartDateTime` datetime NOT NULL,
  `tokenAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `priceUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `hourlyVolumeToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `hourlyVolumeNativeToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `hourlyVolumeUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `hourlyTransactions` bigint NOT NULL DEFAULT '0',
  `totalLiquidityToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `totalLiquidityNativeToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `totalLiquidityUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `token_master` (
  `tokenId` int NOT NULL AUTO_INCREMENT,
  `tokenAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tokenName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tokenSymbol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tokenDecimals` int DEFAULT NULL,
  `priceUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `tradeVolume` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `tradeVolumeUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `totalTransactions` bigint DEFAULT '0',
  `totalLiquidityToken` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `totalLiquidityUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `lastBlockTimeStamp` bigint DEFAULT '0',
  `lastTransactionDateTime` datetime DEFAULT NULL,
  `tokenIcon` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`tokenId`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `transaction_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transactionHash` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `sender` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `receiver` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transactionFrom` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `pairAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `accountAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `totalAmount0` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `totalAmount1` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `amount0In` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `amount1In` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `amount0Out` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `amount1Out` double(30, 15) NOT NULL DEFAULT '0.000000000000000',
  `transactionDatetime` datetime NOT NULL,
  `blockTimeStamp` bigint DEFAULT '0',
  `logIndex` bigint DEFAULT '0',
  `blockNumber` bigint DEFAULT '0',
  `transactionType` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `exchangeRate` double(15, 4) NOT NULL DEFAULT '0.0000',
  `conversaionRatio` double(25, 18) NOT NULL DEFAULT '0.000000000000000000',
  `priceUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `priceUSDToken0` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `priceUSDToken1` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `totalUSD` double(20, 8) NOT NULL DEFAULT '0.00000000',
  `actionType` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `transactionDescription` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `transaction_queue` (
  `id` int NOT NULL AUTO_INCREMENT,
  `transactionHash` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `errorMessage` varchar(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `createdOn` datetime NOT NULL,
  `startedOn` datetime DEFAULT NULL,
  `endedOn` datetime DEFAULT NULL,
  `recreatedOn` datetime DEFAULT NULL,
  `failedCount` int DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

CREATE TABLE `white_list_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tokenAddress` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `tokenSymbol` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `dynamicRate` int NOT NULL,
  `dynamicTokenName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `tokenStatus` int NOT NULL,
  `createdOn` datetime NOT NULL,
  `updatedOn` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_general_ci;

-- Insert data into general_setting table
INSERT INTO
  `general_setting` (
    `id`,
    `lastSyncPairRank`,
    `lastSyncBlockNumber`,
    `NativeTokenUSDRate`,
    `lastPriceFetchDateTime`,
    `priceFetchIntervalSeconds`,
    `platformFeesPercentage`,
    `queueProcessCount`,
    `queueWaitSeconds`,
    `feeToAddress`,
    `fetchMinutesAgoBlock`,
    `maxBlockOffset`,
    `platFormAverageBlockSeconds`
  )
VALUES
  (
    1,
    -1,
    0,
    60939.00000000,
    '2024-07-03 03:42:20',
    10,
    0.300,
    5,
    2,
    '0x433E8b8690eb9d49CB228228F8CEfc6F34185FB8',
    1440,
    500,
    3.330
  );

-- Insert data into white_list_token table
INSERT INTO
  `white_list_token` (
    `id`,
    `tokenAddress`,
    `tokenSymbol`,
    `dynamicRate`,
    `dynamicTokenName`,
    `tokenStatus`,
    `createdOn`,
    `updatedOn`
  )
VALUES
  (
    1,
    '0xf6d226f9dc15d9bb51182815b320d3fbe324e1ba',
    'WBTC',
    1,
    'bitcoin',
    1,
    '2024-05-07 14:59:26',
    '2024-05-07 14:59:26'
  ),
  (
    2,
    '0x967aec3276b63c5e2262da9641db9dbebb07dc0d',
    'USDT',
    0,
    '',
    1,
    '2024-05-07 14:59:26',
    '2024-05-07 14:59:26'
  );