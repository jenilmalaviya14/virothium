DELIMITER $ $ CREATE PROCEDURE `account_chart` (
    IN `p_accountAddress` VARCHAR(250),
    IN `p_pairAddress` VARCHAR(250),
    IN `p_periodType` VARCHAR(50),
    IN `p_periodTime` INT
) BEGIN DECLARE p_startDateTime DATETIME DEFAULT '1970-01-01 00:00:00';

DECLARE p_platformFeesPercentage decimal(10, 3);

SELECT
    platformFeesPercentage INTO p_platformFeesPercentage
FROM
    general_setting
ORDER BY
    id
LIMIT
    1;

SET
    p_platformFeesPercentage = CASE
        WHEN IFNULL(p_platformFeesPercentage, 0) = 0 THEN 0
        ELSE p_platformFeesPercentage
    END;

IF p_periodType = 'week' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -7 * p_periodTime DAY);

ELSEIF p_periodType = 'month' THEN
SET
    p_startDateTime = DATE_ADD(
        UTC_TIMESTAMP(),
        INTERVAL -1 * p_periodTime MONTH
    );

ELSEIF p_periodType = 'year' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -1 * p_periodTime YEAR);

END IF;

SELECT
    pd.dayStartDateTime,
    SUM(
        IFNULL(pd.reserveUSD, 0) * IFNULL(am.conversationRatio, 0)
    ) AS liquidityUSD,
    SUM(
        IFNULL(pd.dailyVolumeUSD, 0) * IFNULL(am.conversationRatio, 0)
    ) AS volumeUSD,
    SUM(
        (
            IFNULL(pd.dailyVolumeUSD, 0) * IFNULL(am.conversationRatio, 0) * p_platformFeesPercentage
        ) / 100
    ) AS feesUSD
FROM
    pair_daily pd
    LEFT JOIN account_master am ON pd.pairAddress = am.pairAddress
WHERE
    am.accountAddress = p_accountAddress
    AND pd.dayStartDateTime >= p_startDateTime
    AND (
        p_pairAddress IS NULL
        OR p_pairAddress = ''
        OR pd.pairAddress = p_pairAddress
    )
GROUP BY
    pd.dayStartDateTime
ORDER BY
    pd.dayStartDateTime;

END $ $ CREATE PROCEDURE `fetchHourlyTransactions` (IN `p_tokenAddress` VARCHAR(255)) BEGIN DECLARE dateTime24Hours DATETIME;

DECLARE dateTime48Hours DATETIME;

SET
    dateTime24Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -24 HOUR);

SET
    dateTime48Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -48 HOUR);

SELECT
    *,
CASE
        WHEN previousVolumeUSD = 0 THEN 0
        ELSE (
            (latestVolumeUSD - previousVolumeUSD) / previousVolumeUSD
        ) * 100
    END AS volumeUSDChange24HoursPercentage,
CASE
        WHEN previousTransactions = 0 THEN 0
        ELSE (
            (latestTransactions - previousTransactions) / previousTransactions
        ) * 100
    END AS trasnactionChnage24HoursPercentage
FROM
    (
        SELECT
            token.tokenAddress,
            IFNULL(latest.latestVolumeUSD, 0) AS latestVolumeUSD,
            IFNULL(latest.latestTransactions, 0) AS latestTransactions,
            IFNULL(previous.previousVolumeUSD, 0) AS previousVolumeUSD,
            IFNULL(previous.previousTransactions, 0) AS previousTransactions
        FROM
            (
                SELECT
                    tokenAddress
                FROM
                    token_hourly th
                where
                    (
                        p_tokenAddress IS NULL
                        OR p_tokenAddress = ''
                        OR th.tokenAddress = p_tokenAddress
                    )
                    AND th.hourStartDateTime >= dateTime48Hours
                GROUP BY
                    tokenAddress
            ) AS token
            LEFT JOIN (
                SELECT
                    th.tokenAddress,
                    SUM(th.hourlyVolumeUSD) AS latestVolumeUSD,
                    SUM(th.hourlyTransactions) AS latestTransactions
                FROM
                    token_hourly th
                where
                    (
                        p_tokenAddress IS NULL
                        OR p_tokenAddress = ''
                        OR th.tokenAddress = p_tokenAddress
                    )
                    AND th.hourStartDateTime >= dateTime24Hours
                GROUP BY
                    th.tokenAddress
            ) AS latest ON token.tokenAddress = latest.tokenAddress
            LEFT JOIN (
                SELECT
                    th.tokenAddress,
                    SUM(th.hourlyVolumeUSD) AS previousVolumeUSD,
                    SUM(th.hourlyTransactions) AS previousTransactions
                FROM
                    token_hourly th
                where
                    (
                        p_tokenAddress IS NULL
                        OR p_tokenAddress = ''
                        OR th.tokenAddress = p_tokenAddress
                    )
                    AND th.hourStartDateTime >= dateTime48Hours
                    AND th.hourStartDateTime < dateTime24Hours
                GROUP BY
                    th.tokenAddress
            ) AS previous ON token.tokenAddress = previous.tokenAddress
    ) AS volumeChange;

END $ $ CREATE PROCEDURE `pair_chart` (
    IN `p_pairAddress` VARCHAR(250),
    IN `p_periodType` VARCHAR(50),
    IN `p_periodTime` INT
) BEGIN DECLARE p_startDateTime DATETIME DEFAULT '1970-01-01 00:00:00';

IF p_periodType = 'week' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -7 * p_periodTime DAY);

ELSEIF p_periodType = 'month' THEN
SET
    p_startDateTime = DATE_ADD(
        UTC_TIMESTAMP(),
        INTERVAL -1 * p_periodTime MONTH
    );

ELSEIF p_periodType = 'year' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -1 * p_periodTime YEAR);

END IF;

SELECT
    dayStartDateTime,
    reserveUSD,
    dailyVolumeUSD
FROM
    pair_daily
WHERE
    pairAddress = p_pairAddress
    AND dayStartDateTime >= p_startDateTime
ORDER BY
    dayStartDateTime;

END $ $ CREATE PROCEDURE `pair_hourly_candle_chart` (
    IN `p_pairAddress` VARCHAR(250),
    IN `p_periodType` VARCHAR(50),
    IN `p_periodTime` INT
) BEGIN DECLARE p_startDateTime DATETIME DEFAULT '1970-01-01 00:00:00';

IF p_periodType = 'week' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -7 * p_periodTime DAY);

ELSEIF p_periodType = 'month' THEN
SET
    p_startDateTime = DATE_ADD(
        UTC_TIMESTAMP(),
        INTERVAL -1 * p_periodTime MONTH
    );

ELSEIF p_periodType = 'year' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -1 * p_periodTime YEAR);

END IF;

SET
    @ @session.sql_notes = 0;

WITH tmp_pair_hourly AS (
    SELECT
        pairAddress,
        hourStartUnix,
        hourStartDateTime,
        reserve0,
        reserve1,
        reserve0 / reserve1 AS token0Price,
        reserve1 / reserve0 AS token1Price,
        RANK() OVER(
            PARTITION BY pairAddress
            ORDER BY
                hourStartDateTime
        ) AS rankIndex
    FROM
        pair_hourly
    WHERE
        pairAddress = p_pairAddress
        AND hourStartDateTime >= p_startDateTime
)
SELECT
    latest.pairAddress,
    latest.hourStartUnix,
    latest.hourStartDateTime,
    IFNULL(previous.token0Price, 0) AS openToken0Price,
    IFNULL(latest.token0Price, 0) AS closeToken0Price,
    IFNULL(previous.token1Price, 0) AS openToken1Price,
    IFNULL(latest.token1Price, 0) AS closeToken1Price,
    CASE
        WHEN IFNULL(latest.token0Price, 0) > IFNULL(previous.token0Price, 0) THEN IFNULL(latest.token0Price, 0)
        ELSE IFNULL(previous.token0Price, 0)
    END AS highPriceUSD0,
    CASE
        WHEN IFNULL(latest.token0Price, 0) < IFNULL(previous.token0Price, 0) THEN IFNULL(latest.token0Price, 0)
        ELSE IFNULL(previous.token0Price, 0)
    END AS lowPriceUSD0,
    CASE
        WHEN IFNULL(latest.token1Price, 0) > IFNULL(previous.token1Price, 0) THEN IFNULL(latest.token1Price, 0)
        ELSE IFNULL(previous.token1Price, 0)
    END AS highPriceUSD1,
    CASE
        WHEN IFNULL(latest.token1Price, 0) < IFNULL(previous.token1Price, 0) THEN IFNULL(latest.token1Price, 0)
        ELSE IFNULL(previous.token1Price, 0)
    END AS lowPriceUSD1
FROM
    tmp_pair_hourly AS latest
    LEFT JOIN tmp_pair_hourly AS previous ON latest.rankIndex = previous.rankIndex + 1
ORDER BY
    latest.hourStartUnix;

SET
    @ @session.sql_notes = 1;

END $ $ CREATE PROCEDURE `report_account_analytics` (
    IN `p_accountAddress` VARCHAR(250),
    IN `p_pairAddress` VARCHAR(250)
) BEGIN DECLARE totalLiquidity DECIMAL(20, 8);

DECLARE p_platformFeesPercentage decimal(10, 3);

SELECT
    platformFeesPercentage INTO p_platformFeesPercentage
FROM
    general_setting
ORDER BY
    id
LIMIT
    1;

SET
    p_platformFeesPercentage = CASE
        WHEN IFNULL(p_platformFeesPercentage, 0) = 0 THEN 0
        ELSE p_platformFeesPercentage
    END;

SELECT
    am.*,
    IFNULL(td.totalSwapVolumeUSD, 0) AS totalSwapValueUSD,
    IFNULL(td.totalFeesPaidUSD, 0) AS totalFeesPaidUSD,
    IFNULL(txcnt.totalTransactions, 0) AS totalTransactions,
    t0.tokenIcon AS tokenIcon0,
    t1.tokenIcon AS tokenIcon1,
    pm.pairName AS pairName
FROM
    (
        SELECT
            accountAddress,
            pairAddress,
            SUM(am.liquidityUSD) AS totalLiquidityUSD,
            SUM(am.volumeUSD) AS totalVolumeUSD,
            (SUM(am.volumeUSD) * p_platformFeesPercentage) / 100 AS feesEarnedUSD
        FROM
            account_master am
        WHERE
            (am.accountAddress = p_accountAddress)
            AND (
                p_pairAddress IS NULL
                OR p_pairAddress = ''
                OR am.pairAddress = p_pairAddress
            )
        GROUP BY
            accountAddress,
            pairAddress
    ) am
    LEFT JOIN pair_master pm ON am.pairAddress = pm.pairAddress
    LEFT JOIN token_master t0 ON pm.tokenAddress0 = t0.tokenAddress
    LEFT JOIN token_master t1 ON pm.tokenAddress1 = t1.tokenAddress
    LEFT JOIN (
        SELECT
            accountAddress,
            pairAddress,
            SUM(totalUSD) AS totalSwapVolumeUSD,
            (SUM(totalUSD) * p_platformFeesPercentage) / 100 AS totalFeesPaidUSD
        FROM
            transaction_details
        WHERE
            actionType = 'swap'
        GROUP BY
            accountAddress,
            pairAddress
    ) AS td ON am.pairAddress = td.pairAddress
    AND am.accountAddress = td.accountAddress
    LEFT JOIN (
        SELECT
            accountAddress,
            pairAddress,
            COUNT(*) AS totalTransactions
        FROM
            transaction_details
        GROUP BY
            accountAddress,
            pairAddress
    ) AS txcnt ON am.pairAddress = txcnt.pairAddress
    AND am.accountAddress = txcnt.accountAddress
WHERE
    (am.accountAddress = p_accountAddress)
    AND (
        p_pairAddress IS NULL
        OR p_pairAddress = ''
        OR am.pairAddress = p_pairAddress
    );

END $ $ CREATE PROCEDURE `report_all_position_list` (IN `p_accountAddress` VARCHAR(250)) BEGIN DECLARE p_platformFeesPercentage DECIMAL(10, 3);

SELECT
    platformFeesPercentage INTO p_platformFeesPercentage
FROM
    general_setting
ORDER BY
    id
LIMIT
    1;

SET
    p_platformFeesPercentage = CASE
        WHEN IFNULL(p_platformFeesPercentage, 0) = 0 THEN 0
        ELSE p_platformFeesPercentage
    END;

SELECT
    am.accountAddress,
    IFNULL(SUM(am.liquidityUSD), 0) AS totalLiquidityUSD,
    IFNULL(
        SUM(am.volumeToken0 * p_platformFeesPercentage / 100),
        0
    ) AS totalFeesToken0,
    IFNULL(
        SUM(am.volumeToken1 * p_platformFeesPercentage / 100),
        0
    ) AS totalFeesToken1,
    IFNULL(
        SUM(am.volumeUSD * p_platformFeesPercentage / 100),
        0
    ) AS totalFeesUSD,
    IFNULL(td.totalSwapVolumeUSD, 0) AS totalSwapVolumeUSD,
    IFNULL(td.totalFeesPaidUSD, 0) AS totalFeesPaidUSD,
    IFNULL(txcnt.totalTransactions, 0) AS totalTransactions
FROM
    account_master am
    LEFT JOIN (
        SELECT
            accountAddress,
            SUM(totalUSD) AS totalSwapVolumeUSD,
            (SUM(totalUSD) * p_platformFeesPercentage) / 100 AS totalFeesPaidUSD
        FROM
            transaction_details
        WHERE
            actionType = 'swap'
        GROUP BY
            accountAddress
    ) AS td ON am.accountAddress = td.accountAddress
    LEFT JOIN (
        SELECT
            accountAddress,
            COUNT(*) AS totalTransactions
        FROM
            transaction_details
        GROUP BY
            accountAddress
    ) AS txcnt ON am.accountAddress = txcnt.accountAddress
WHERE
    am.accountAddress = p_accountAddress
GROUP BY
    am.accountAddress
ORDER BY
    totalLiquidityUSD DESC;

END $ $ CREATE PROCEDURE `report_list_accounts_analytics` (IN `p_accountAddress` VARCHAR(250)) BEGIN DECLARE totalLiquidity DECIMAL(20, 8);

SELECT
    am.*,
    am.liquidityUSD AS totalLiquidityUSD,
    t0.tokenIcon AS tokenIcon0,
    t1.tokenIcon AS tokenIcon1,
    pm.pairName
FROM
    account_master am
    LEFT JOIN pair_master pm ON am.pairAddress = pm.pairAddress
    LEFT JOIN token_master t0 ON pm.tokenAddress0 = t0.tokenAddress
    LEFT JOIN token_master t1 ON pm.tokenAddress1 = t1.tokenAddress
WHERE
    (
        p_accountAddress IS NULL
        OR am.accountAddress = p_accountAddress
        OR p_accountAddress = ''
    )
ORDER BY
    am.liquidityUSD DESC
LIMIT
    100;

END $ $ CREATE PROCEDURE `report_list_pairs_analytics` (
    IN `p_pairAddress` VARCHAR(250),
    IN `p_tokenAddress` VARCHAR(250)
) BEGIN DECLARE p_dateTime24Hours DATETIME;

DECLARE p_dateTime7days DATETIME;

DECLARE p_platformFeesPercentage decimal(10, 3);

SET
    p_dateTime24Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -24 HOUR);

SET
    p_dateTime7days = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -7 DAY);

SELECT
    platformFeesPercentage INTO p_platformFeesPercentage
FROM
    general_setting
ORDER BY
    id
LIMIT
    1;

SET
    p_platformFeesPercentage = CASE
        WHEN IFNULL(p_platformFeesPercentage, 0) = 0 THEN 0
        ELSE p_platformFeesPercentage
    END;

SELECT
    pm.*,
    IFNULL(hrs24Volume.last24hoursVolumeUSD, 0) AS last24hoursVolumeUSD,
    IFNULL(days7Volume.last7daysVolumeUSD, 0) AS last7daysVolumeUSD,
    IFNULL(hrs24Volume.last24hoursVolumeUSD, 0) * p_platformFeesPercentage / 100 AS last24hoursPlatformFees,
    IFNULL(days7Volume.last7daysVolumeUSD, 0) * p_platformFeesPercentage / 100 AS last7daysPlatformFees,
    t0.tokenIcon AS tokenIcon0,
    t1.tokenIcon AS tokenIcon1
FROM
    pair_master pm
    LEFT JOIN token_master t0 ON pm.tokenAddress0 = t0.tokenAddress
    LEFT JOIN token_master t1 ON pm.tokenAddress1 = t1.tokenAddress
    LEFT JOIN (
        SELECT
            ph.pairAddress,
            SUM(ph.hourlyVolumeUSD) AS last24hoursVolumeUSD
        FROM
            pair_hourly ph
        where
            (
                p_pairAddress IS NULL
                OR p_pairAddress = ''
                OR ph.pairAddress = p_pairAddress
            )
            AND ph.hourStartDateTime >= p_dateTime24Hours
        GROUP BY
            ph.pairAddress
    ) hrs24Volume ON pm.pairAddress = hrs24Volume.pairAddress
    LEFT JOIN (
        SELECT
            pd.pairAddress,
            SUM(pd.dailyVolumeUSD) AS last7daysVolumeUSD
        FROM
            pair_daily pd
        where
            (
                p_pairAddress IS NULL
                OR p_pairAddress = ''
                OR pd.pairAddress = p_pairAddress
            )
            AND pd.dayStartDateTime >= p_dateTime7days
        GROUP BY
            pd.pairAddress
    ) days7Volume ON pm.pairAddress = days7Volume.pairAddress
WHERE
    (
        p_pairAddress IS NULL
        OR p_pairAddress = ''
        OR pm.pairAddress = p_pairAddress
    )
    AND (
        p_tokenAddress IS NULL
        OR p_tokenAddress = ''
        OR t0.tokenAddress = p_tokenAddress
        OR t1.tokenAddress = p_tokenAddress
    )
ORDER BY
    pm.reserveUSD DESC
LIMIT
    200;

END $ $ CREATE PROCEDURE `report_list_tokens_analytics` (IN `p_tokenAddress` VARCHAR(250)) BEGIN DECLARE p_dateTime24Hours DATETIME;

DECLARE p_dateTime48Hours DATETIME;

SET
    p_dateTime24Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -24 HOUR);

SET
    p_dateTime48Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -48 HOUR);

SELECT
    tm.*,
    IFNULL(hrs24Volume.previousVolumeUSD, 0) AS later24hoursVolumeUSD,
    IFNULL(hrs24Volume.latestVolumeUSD, 0) AS last24hoursVolumeUSD,
    IFNULL(hrs24Volume.change24hoursVolumeUSDPercentage, 0) AS change24hoursVolumeUSDPercentage,
    IFNULL(hrs24Volume.previousTransactions, 0) AS later24hoursTransactions,
    IFNULL(hrs24Volume.latestTransactions, 0) AS last24hoursTransactions,
    IFNULL(
        hrs24Volume.change24hoursTransactionsPercentage,
        0
    ) AS change24hoursTransactionsPercentage,
    IFNULL(hrs24Volume.previousTotalLiquidityUSD, 0) AS later24hoursLiquidityUSD,
    IFNULL(hrs24Volume.latestTotalLiquidityUSD, 0) AS last24hoursLiquidityUSD,
    IFNULL(
        hrs24Volume.change24hoursLiquidityUSDPercentage,
        0
    ) AS change24hoursLiquidityUSDPercentage,
    IFNULL(hrs24Price.previousPriceUSD, 0) AS later24hoursPriceUSD,
    IFNULL(hrs24Price.latestPriceUSD, 0) AS last24hoursPriceUSD,
    IFNULL(hrs24Price.change24hoursPricePercentage, 0) AS change24hoursPricePercentage
FROM
    token_master tm
    LEFT JOIN (
        SELECT
            *,
CASE
                WHEN previousVolumeUSD = 0 THEN 100
                ELSE (
                    (latestVolumeUSD - previousVolumeUSD) / previousVolumeUSD
                ) * 100
            END AS change24hoursVolumeUSDPercentage,
CASE
                WHEN previousTransactions = 0 THEN 100
                ELSE (
                    (latestTransactions - previousTransactions) / previousTransactions
                ) * 100
            END AS change24hoursTransactionsPercentage,
CASE
                WHEN previousTotalLiquidityUSD = 0 THEN 100
                ELSE (
                    (
                        latestTotalLiquidityUSD - previousTotalLiquidityUSD
                    ) / previousTotalLiquidityUSD
                ) * 100
            END AS change24hoursLiquidityUSDPercentage
        FROM
            (
                SELECT
                    token.tokenAddress,
                    IFNULL(latest.latestVolumeUSD, 0) AS latestVolumeUSD,
                    IFNULL(latest.latestTransactions, 0) AS latestTransactions,
                    IFNULL(latest.latestTotalLiquidityUSD, 0) AS latestTotalLiquidityUSD,
                    IFNULL(previous.previousVolumeUSD, 0) AS previousVolumeUSD,
                    IFNULL(previous.previousTransactions, 0) AS previousTransactions,
                    IFNULL(previous.previousTotalLiquidityUSD, 0) AS previousTotalLiquidityUSD
                FROM
                    (
                        SELECT
                            tokenAddress
                        FROM
                            token_hourly th
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                            AND th.hourStartDateTime >= p_dateTime48Hours
                        GROUP BY
                            tokenAddress
                    ) AS token
                    LEFT JOIN (
                        SELECT
                            th.tokenAddress,
                            SUM(th.hourlyVolumeUSD) AS latestVolumeUSD,
                            SUM(th.hourlyTransactions) AS latestTransactions,
                            SUM(th.totalLiquidityUSD) AS latestTotalLiquidityUSD
                        FROM
                            token_hourly th
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                            AND th.hourStartDateTime >= p_dateTime24Hours
                        GROUP BY
                            th.tokenAddress
                    ) AS latest ON token.tokenAddress = latest.tokenAddress
                    LEFT JOIN (
                        SELECT
                            th.tokenAddress,
                            SUM(th.hourlyVolumeUSD) AS previousVolumeUSD,
                            SUM(th.hourlyTransactions) AS previousTransactions,
                            SUM(th.totalLiquidityUSD) AS previousTotalLiquidityUSD
                        FROM
                            token_hourly th
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                            AND th.hourStartDateTime >= p_dateTime48Hours
                            AND th.hourStartDateTime < p_dateTime24Hours
                        GROUP BY
                            th.tokenAddress
                    ) AS previous ON token.tokenAddress = previous.tokenAddress
            ) AS volumeChange
    ) hrs24Volume ON tm.tokenAddress = hrs24Volume.tokenAddress
    LEFT JOIN (
        SELECT
            *,
            CASE
                WHEN previousPriceUSD = 0 THEN 100
                ELSE (
                    (latestPriceUSD - previousPriceUSD) / previousPriceUSD
                ) * 100
            END AS change24hoursPricePercentage
        FROM
            (
                SELECT
                    latest.tokenAddress,
                    IFNULL(latest.latestPriceUSD, 0) AS latestPriceUSD,
                    IFNULL(previous.previousPriceUSD, 0) AS previousPriceUSD
                FROM
                    (
                        SELECT
                            th.tokenAddress,
                            th.priceUSD AS latestPriceUSD
                        FROM
                            token_hourly th
                            INNER JOIN (
                                SELECT
                                    tokenAddress,
                                    MAX(hourStartDateTime) AS maxHourDateTime
                                FROM
                                    token_hourly
                                where
                                    (
                                        p_tokenAddress IS NULL
                                        OR p_tokenAddress = ''
                                        OR tokenAddress = p_tokenAddress
                                    )
                                GROUP BY
                                    tokenAddress
                            ) AS mth ON th.tokenAddress = mth.tokenAddress
                            AND th.hourStartDateTime = mth.maxHourDateTime
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                    ) AS latest
                    LEFT JOIN (
                        SELECT
                            th.tokenAddress,
                            th.priceUSD AS previousPriceUSD
                        FROM
                            token_hourly th
                            INNER JOIN (
                                SELECT
                                    tokenAddress,
                                    MAX(hourStartDateTime) AS maxHourDateTime
                                FROM
                                    token_hourly
                                where
                                    (
                                        p_tokenAddress IS NULL
                                        OR p_tokenAddress = ''
                                        OR tokenAddress = p_tokenAddress
                                    )
                                    AND hourStartDateTime < p_dateTime24Hours
                                GROUP BY
                                    tokenAddress
                            ) AS mth ON th.tokenAddress = mth.tokenAddress
                            AND th.hourStartDateTime = mth.maxHourDateTime
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                    ) AS previous ON latest.tokenAddress = previous.tokenAddress
            ) AS priceChange
    ) AS hrs24Price ON tm.tokenAddress = hrs24Price.tokenAddress
WHERE
    (
        p_tokenAddress IS NULL
        OR p_tokenAddress = ''
        OR tm.tokenAddress = p_tokenAddress
    )
ORDER BY
    totalLiquidityUSD DESC
LIMIT
    50;

END $ $ DELIMITER $ $ CREATE PROCEDURE `report_pair_analytics` (IN `p_pairAddress` VARCHAR(250)) BEGIN DECLARE p_dateTime24Hours DATETIME;

DECLARE p_dateTime48Hours DATETIME;

DECLARE p_platformFeesPercentage decimal(10, 3);

SET
    p_dateTime24Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -24 HOUR);

SET
    p_dateTime48Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -48 HOUR);

SELECT
    platformFeesPercentage INTO p_platformFeesPercentage
FROM
    general_setting
ORDER BY
    id
LIMIT
    1;

SET
    p_platformFeesPercentage = CASE
        WHEN IFNULL(p_platformFeesPercentage, 0) = 0 THEN 0
        ELSE p_platformFeesPercentage
    END;

SELECT
    pm.*,
    t0.tokenSymbol AS token0Symbol,
    t1.tokenSymbol AS token1Symbol,
    t0.priceUSD AS token0PriceUSD,
    t1.priceUSD AS token1PriceUSD,
CASE
        WHEN pm.reserve0 = 0 THEN 0
        ELSE pm.reserve1 / pm.reserve0
    END AS token0Price,
CASE
        WHEN pm.reserve1 = 0 THEN 0
        ELSE pm.reserve0 / pm.reserve1
    END AS token1Price,
    IFNULL(hrs24Volume.previousVolumeUSD, 0) AS later24hoursVolumeUSD,
    IFNULL(hrs24Volume.latestVolumeUSD, 0) AS last24hoursVolumeUSD,
    IFNULL(hrs24Volume.change24hoursVolumeUSDPercentage, 0) AS change24hoursVolumeUSDPercentage,
    IFNULL(hrs24Volume.previousVolumeUSD, 0) * p_platformFeesPercentage / 100 AS later24hoursPlatformFeesUSD,
    IFNULL(hrs24Volume.latestVolumeUSD, 0) * p_platformFeesPercentage / 100 AS last24hoursPlatformFeesUSD,
    IFNULL(hrs24Volume.change24hoursVolumeUSDPercentage, 0) AS change24hoursPlatformFeesUSDPercentage,
    IFNULL(hrs24Volume.previousTotalLiquidityUSD, 0) AS later24hoursLiquidityUSD,
    IFNULL(hrs24Volume.latestTotalLiquidityUSD, 0) AS last24hoursLiquidityUSD,
    IFNULL(
        hrs24Volume.change24hoursLiquidityUSDPercentage,
        0
    ) AS change24hoursLiquidityUSDPercentage,
    t0.tokenIcon AS tokenIcon0,
    t1.tokenIcon AS tokenIcon1
FROM
    pair_master pm
    LEFT JOIN token_master t0 ON pm.tokenAddress0 = t0.tokenAddress
    LEFT JOIN token_master t1 ON pm.tokenAddress1 = t1.tokenAddress
    LEFT JOIN (
        SELECT
            *,
CASE
                WHEN previousVolumeUSD = 0 THEN 100
                ELSE (
                    (latestVolumeUSD - previousVolumeUSD) / previousVolumeUSD
                ) * 100
            END AS change24hoursVolumeUSDPercentage,
CASE
                WHEN previousTotalLiquidityUSD = 0 THEN 100
                ELSE (
                    (
                        latestTotalLiquidityUSD - previousTotalLiquidityUSD
                    ) / previousTotalLiquidityUSD
                ) * 100
            END AS change24hoursLiquidityUSDPercentage
        FROM
            (
                SELECT
                    pair.pairAddress,
                    IFNULL(latest.latestVolumeUSD, 0) AS latestVolumeUSD,
                    IFNULL(latest.latestTotalLiquidityUSD, 0) AS latestTotalLiquidityUSD,
                    IFNULL(previous.previousVolumeUSD, 0) AS previousVolumeUSD,
                    IFNULL(previous.previousTotalLiquidityUSD, 0) AS previousTotalLiquidityUSD
                FROM
                    (
                        SELECT
                            pairAddress
                        FROM
                            pair_hourly ph
                        where
                            (
                                p_pairAddress IS NULL
                                OR p_pairAddress = ''
                                OR ph.pairAddress = p_pairAddress
                            )
                            AND ph.hourStartDateTime >= p_dateTime48Hours
                        GROUP BY
                            pairAddress
                    ) AS pair
                    LEFT JOIN (
                        SELECT
                            ph.pairAddress,
                            SUM(ph.hourlyVolumeUSD) AS latestVolumeUSD,
                            SUM(ph.reserveUSD) AS latestTotalLiquidityUSD
                        FROM
                            pair_hourly ph
                        where
                            (
                                p_pairAddress IS NULL
                                OR p_pairAddress = ''
                                OR ph.pairAddress = p_pairAddress
                            )
                            AND ph.hourStartDateTime >= p_dateTime24Hours
                        GROUP BY
                            ph.pairAddress
                    ) AS latest ON pair.pairAddress = latest.pairAddress
                    LEFT JOIN (
                        SELECT
                            ph.pairAddress,
                            SUM(ph.hourlyVolumeUSD) AS previousVolumeUSD,
                            SUM(ph.reserveUSD) AS previousTotalLiquidityUSD
                        FROM
                            pair_hourly ph
                        where
                            (
                                p_pairAddress IS NULL
                                OR p_pairAddress = ''
                                OR ph.pairAddress = p_pairAddress
                            )
                            AND ph.hourStartDateTime >= p_dateTime48Hours
                            AND ph.hourStartDateTime < p_dateTime24Hours
                        GROUP BY
                            ph.pairAddress
                    ) AS previous ON pair.pairAddress = previous.pairAddress
            ) AS volumeChange
    ) hrs24Volume ON pm.pairAddress = hrs24Volume.pairAddress
WHERE
    (
        p_pairAddress IS NULL
        OR p_pairAddress = ''
        OR pm.pairAddress = p_pairAddress
    )
ORDER BY
    pm.volumeUSD DESC;

END $ $ CREATE PROCEDURE `report_position_list` (
    IN `p_accountAddress` VARCHAR(250),
    IN `p_pairAddress` VARCHAR(250)
) BEGIN DECLARE p_platformFeesPercentage DECIMAL(10, 3);

SELECT
    platformFeesPercentage INTO p_platformFeesPercentage
FROM
    general_setting
ORDER BY
    id
LIMIT
    1;

SET
    p_platformFeesPercentage = CASE
        WHEN IFNULL(p_platformFeesPercentage, 0) = 0 THEN 0
        ELSE p_platformFeesPercentage
    END;

SELECT
    am.*,
    pm.pairName,
    tm0.tokenIcon AS tokenIcon0,
    tm1.tokenIcon AS tokenIcon1,
    am.volumeToken0 * p_platformFeesPercentage / 100 AS feesToken0,
    am.volumeToken1 * p_platformFeesPercentage / 100 AS feesToken1,
    am.volumeUSD * p_platformFeesPercentage / 100 AS feesUSD,
    tm0.tokenSymbol AS tokenSymbol0,
    tm1.tokenSymbol AS tokenSymbol1
FROM
    account_master am
    LEFT JOIN pair_master pm ON am.pairAddress = pm.pairAddress
    LEFT JOIN token_master tm0 ON pm.tokenAddress0 = tm0.tokenAddress
    LEFT JOIN token_master tm1 ON pm.tokenAddress1 = tm1.tokenAddress
WHERE
    am.accountAddress = p_accountAddress
    AND (
        p_pairAddress IS NULL
        OR p_pairAddress = ''
        OR am.pairAddress = p_pairAddress
    )
ORDER BY
    am.liquidityUSD DESC;

END $ $ CREATE PROCEDURE `report_token_analytics` (IN `p_tokenAddress` VARCHAR(250)) BEGIN DECLARE p_dateTime24Hours DATETIME;

DECLARE p_dateTime48Hours DATETIME;

SET
    p_dateTime24Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -24 HOUR);

SET
    p_dateTime48Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -48 HOUR);

SELECT
    tm.*,
    IFNULL(hrs24Volume.previousVolumeUSD, 0) AS later24hoursVolumeUSD,
    IFNULL(hrs24Volume.latestVolumeUSD, 0) AS last24hoursVolumeUSD,
    IFNULL(hrs24Volume.change24hoursVolumeUSDPercentage, 0) AS change24hoursVolumeUSDPercentage,
    IFNULL(hrs24Volume.previousTransactions, 0) AS later24hoursTransactions,
    IFNULL(hrs24Volume.latestTransactions, 0) AS last24hoursTransactions,
    IFNULL(
        hrs24Volume.change24hoursTransactionsPercentage,
        0
    ) AS change24hoursTransactionsPercentage,
    IFNULL(hrs24Volume.previousTotalLiquidityUSD, 0) AS later24hoursLiquidityUSD,
    IFNULL(hrs24Volume.latestTotalLiquidityUSD, 0) AS last24hoursLiquidityUSD,
    IFNULL(
        hrs24Volume.change24hoursLiquidityUSDPercentage,
        0
    ) AS change24hoursLiquidityUSDPercentage,
    IFNULL(hrs24Price.previousPriceUSD, 0) AS later24hoursPriceUSD,
    IFNULL(hrs24Price.latestPriceUSD, 0) AS last24hoursPriceUSD,
    IFNULL(hrs24Price.change24hoursPricePercentage, 0) AS change24hoursPricePercentage
FROM
    token_master tm
    LEFT JOIN (
        SELECT
            *,
CASE
                WHEN previousVolumeUSD = 0 THEN 100
                ELSE (
                    (latestVolumeUSD - previousVolumeUSD) / previousVolumeUSD
                ) * 100
            END AS change24hoursVolumeUSDPercentage,
CASE
                WHEN previousTransactions = 0 THEN 100
                ELSE (
                    (latestTransactions - previousTransactions) / previousTransactions
                ) * 100
            END AS change24hoursTransactionsPercentage,
CASE
                WHEN previousTotalLiquidityUSD = 0 THEN 100
                ELSE (
                    (
                        latestTotalLiquidityUSD - previousTotalLiquidityUSD
                    ) / previousTotalLiquidityUSD
                ) * 100
            END AS change24hoursLiquidityUSDPercentage
        FROM
            (
                SELECT
                    token.tokenAddress,
                    IFNULL(latest.latestVolumeUSD, 0) AS latestVolumeUSD,
                    IFNULL(latest.latestTransactions, 0) AS latestTransactions,
                    IFNULL(latest.latestTotalLiquidityUSD, 0) AS latestTotalLiquidityUSD,
                    IFNULL(previous.previousVolumeUSD, 0) AS previousVolumeUSD,
                    IFNULL(previous.previousTransactions, 0) AS previousTransactions,
                    IFNULL(previous.previousTotalLiquidityUSD, 0) AS previousTotalLiquidityUSD
                FROM
                    (
                        SELECT
                            tokenAddress
                        FROM
                            token_hourly th
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                            AND th.hourStartDateTime >= p_dateTime48Hours
                        GROUP BY
                            tokenAddress
                    ) AS token
                    LEFT JOIN (
                        SELECT
                            th.tokenAddress,
                            SUM(th.hourlyVolumeUSD) AS latestVolumeUSD,
                            SUM(th.hourlyTransactions) AS latestTransactions,
                            SUM(th.totalLiquidityUSD) AS latestTotalLiquidityUSD
                        FROM
                            token_hourly th
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                            AND th.hourStartDateTime >= p_dateTime24Hours
                        GROUP BY
                            th.tokenAddress
                    ) AS latest ON token.tokenAddress = latest.tokenAddress
                    LEFT JOIN (
                        SELECT
                            th.tokenAddress,
                            SUM(th.hourlyVolumeUSD) AS previousVolumeUSD,
                            SUM(th.hourlyTransactions) AS previousTransactions,
                            SUM(th.totalLiquidityUSD) AS previousTotalLiquidityUSD
                        FROM
                            token_hourly th
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                            AND th.hourStartDateTime >= p_dateTime48Hours
                            AND th.hourStartDateTime < p_dateTime24Hours
                        GROUP BY
                            th.tokenAddress
                    ) AS previous ON token.tokenAddress = previous.tokenAddress
            ) AS volumeChange
    ) hrs24Volume ON tm.tokenAddress = hrs24Volume.tokenAddress
    LEFT JOIN (
        SELECT
            *,
            CASE
                WHEN previousPriceUSD = 0 THEN 100
                ELSE (
                    (latestPriceUSD - previousPriceUSD) / previousPriceUSD
                ) * 100
            END AS change24hoursPricePercentage
        FROM
            (
                SELECT
                    latest.tokenAddress,
                    IFNULL(latest.latestPriceUSD, 0) AS latestPriceUSD,
                    IFNULL(previous.previousPriceUSD, 0) AS previousPriceUSD
                FROM
                    (
                        SELECT
                            th.tokenAddress,
                            th.priceUSD AS latestPriceUSD
                        FROM
                            token_hourly th
                            INNER JOIN (
                                SELECT
                                    tokenAddress,
                                    MAX(hourStartDateTime) AS maxHourDateTime
                                FROM
                                    token_hourly
                                where
                                    (
                                        p_tokenAddress IS NULL
                                        OR p_tokenAddress = ''
                                        OR tokenAddress = p_tokenAddress
                                    )
                                GROUP BY
                                    tokenAddress
                            ) AS mth ON th.tokenAddress = mth.tokenAddress
                            AND th.hourStartDateTime = mth.maxHourDateTime
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                    ) AS latest
                    LEFT JOIN (
                        SELECT
                            th.tokenAddress,
                            th.priceUSD AS previousPriceUSD
                        FROM
                            token_hourly th
                            INNER JOIN (
                                SELECT
                                    tokenAddress,
                                    MAX(hourStartDateTime) AS maxHourDateTime
                                FROM
                                    token_hourly
                                where
                                    (
                                        p_tokenAddress IS NULL
                                        OR p_tokenAddress = ''
                                        OR tokenAddress = p_tokenAddress
                                    )
                                    AND hourStartDateTime < p_dateTime24Hours
                                GROUP BY
                                    tokenAddress
                            ) AS mth ON th.tokenAddress = mth.tokenAddress
                            AND th.hourStartDateTime = mth.maxHourDateTime
                        where
                            (
                                p_tokenAddress IS NULL
                                OR p_tokenAddress = ''
                                OR th.tokenAddress = p_tokenAddress
                            )
                    ) AS previous ON latest.tokenAddress = previous.tokenAddress
            ) AS priceChange
    ) AS hrs24Price ON tm.tokenAddress = hrs24Price.tokenAddress
WHERE
    (
        p_tokenAddress IS NULL
        OR p_tokenAddress = ''
        OR tm.tokenAddress = p_tokenAddress
    )
ORDER BY
    latestVolumeUSD DESC;

END $ $ CREATE PROCEDURE `report_token_overview` (IN `p_nativeTokenAddress` VARCHAR(250)) BEGIN DECLARE p_dateTime24Hours DATETIME;

DECLARE p_dateTime48Hours DATETIME;

DECLARE p_nativeTokenUSDRate DOUBLE(20, 8);

DECLARE p_platformFeesPercentage DECIMAL(10, 3);

DECLARE p_last24hoursTokenTransactions BIGINT DEFAULT 0;

DECLARE p_later24hoursTokenVolumeUSD DOUBLE(20, 8) DEFAULT 0;

DECLARE p_last24hoursTokenVolumeUSD DOUBLE(20, 8) DEFAULT 0;

DECLARE p_tokenPairCount BIGINT DEFAULT 0;

DECLARE p_tokenSymbol VARCHAR(50) DEFAULT '';

DECLARE p_tokenTotalLiquidityUSD DOUBLE(20, 8) DEFAULT 0;

DECLARE p_later24hoursLiquidityUSD DOUBLE(20, 8) DEFAULT 0;

DECLARE p_last24hoursLiquidityUSD DOUBLE(20, 8) DEFAULT 0;

DECLARE p_lastPriceFetchDateTime DATETIME;

SELECT
    tokenSymbol,
    IFNULL(totalLiquidityUSD, 0) INTO p_tokenSymbol,
    p_tokenTotalLiquidityUSD
FROM
    token_master
WHERE
    tokenAddress = p_nativeTokenAddress;

SELECT
    IFNULL(NativeTokenUSDRate, 0),
    IFNULL(platformFeesPercentage, 0),
    lastPriceFetchDateTime INTO p_nativeTokenUSDRate,
    p_platformFeesPercentage,
    p_lastPriceFetchDateTime
FROM
    general_setting
LIMIT
    1;

SET
    p_dateTime24Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -24 HOUR);

SET
    p_dateTime48Hours = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -48 HOUR);

SELECT
    COUNT(*) INTO p_tokenPairCount
FROM
    pair_master
WHERE
    tokenAddress0 = p_nativeTokenAddress
    OR tokenAddress1 = p_nativeTokenAddress;

SELECT
    SUM(hourlyVolumeUSD),
    SUM(totalLiquidityUSD) INTO p_later24hoursTokenVolumeUSD,
    p_later24hoursLiquidityUSD
FROM
    token_hourly
WHERE
    tokenAddress = p_nativeTokenAddress
    AND hourStartDateTime >= p_dateTime48Hours
    AND hourStartDateTime < p_dateTime24Hours;

SELECT
    SUM(hourlyVolumeUSD),
    SUM(totalLiquidityUSD),
    SUM(hourlyTransactions) INTO p_last24hoursTokenVolumeUSD,
    p_last24hoursLiquidityUSD,
    p_last24hoursTokenTransactions
FROM
    token_hourly
WHERE
    tokenAddress = p_nativeTokenAddress
    AND hourStartDateTime >= p_dateTime24Hours;

SELECT
    p_tokenSymbol AS tokenSymbol,
    IFNULL(p_tokenTotalLiquidityUSD, 0) AS tokenTotalLiquidityUSD,
    p_nativeTokenUSDRate AS nativeTokenUSDPrice,
    IFNULL(p_tokenPairCount, 0) AS tokenPairCount,
    IFNULL(p_last24hoursTokenTransactions, 0) AS last24hoursTokenTransactions,
    (
        IFNULL(p_last24hoursTokenVolumeUSD, 0) * p_platformFeesPercentage
    ) / 100 AS last24hourstokenFeesUSD,
    IFNULL(p_later24hoursTokenVolumeUSD, 0) AS later24hoursTokenVolumeUSD,
    IFNULL(p_last24hoursTokenVolumeUSD, 0) AS last24hoursTokenVolumeUSD,
    CASE
        WHEN IFNULL(p_later24hoursTokenVolumeUSD, 0) = 0 THEN 100
        ELSE (
            (
                IFNULL(p_last24hoursTokenVolumeUSD, 0) - IFNULL(p_later24hoursTokenVolumeUSD, 0)
            ) / IFNULL(p_later24hoursTokenVolumeUSD, 0)
        ) * 100
    END AS change24hoursVolumeUSDPercentage,
    IFNULL(p_later24hoursLiquidityUSD, 0) AS later24hoursLiquidityUSD,
    IFNULL(p_last24hoursLiquidityUSD, 0) AS last24hoursLiquidityUSD,
    CASE
        WHEN IFNULL(p_later24hoursLiquidityUSD, 0) = 0 THEN 100
        ELSE (
            (
                IFNULL(p_last24hoursLiquidityUSD, 0) - IFNULL(p_later24hoursLiquidityUSD, 0)
            ) / IFNULL(p_later24hoursLiquidityUSD, 0)
        ) * 100
    END AS change24hoursLiquidityUSDPercentage,
    p_lastPriceFetchDateTime AS lastPriceFetchDateTime;

END $ $ CREATE PROCEDURE `token_chart` (
    IN `p_tokenAddress` VARCHAR(250),
    IN `p_periodType` VARCHAR(50),
    IN `p_periodTime` INT
) BEGIN DECLARE p_startDateTime DATETIME DEFAULT '1970-01-01 00:00:00';

IF p_periodType = 'week' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -7 * p_periodTime DAY);

ELSEIF p_periodType = 'month' THEN
SET
    p_startDateTime = DATE_ADD(
        UTC_TIMESTAMP(),
        INTERVAL -1 * p_periodTime MONTH
    );

ELSEIF p_periodType = 'year' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -1 * p_periodTime YEAR);

END IF;

SELECT
    dayStartDateTime,
    totalLiquidityUSD,
    dailyVolumeUSD,
    priceUSD
FROM
    token_daily
WHERE
    tokenAddress = p_tokenAddress
    AND dayStartDateTime >= p_startDateTime
ORDER BY
    dayStartDateTime;

END $ $ CREATE PROCEDURE `token_daily_candle_chart` (
    IN `p_tokenAddress` VARCHAR(250),
    IN `p_periodType` VARCHAR(50),
    IN `p_periodTime` INT
) BEGIN DECLARE p_startDateTime DATETIME DEFAULT '1970-01-01 00:00:00';

IF p_periodType = 'week' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -7 * p_periodTime DAY);

ELSEIF p_periodType = 'month' THEN
SET
    p_startDateTime = DATE_ADD(
        UTC_TIMESTAMP(),
        INTERVAL -1 * p_periodTime MONTH
    );

ELSEIF p_periodType = 'year' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -1 * p_periodTime YEAR);

END IF;

SET
    @ @session.sql_notes = 0;

WITH tmp_token_daily AS (
    SELECT
        tokenAddress,
        dayStartTimeStamp,
        dayStartDateTime,
        priceUSD,
        RANK() OVER (
            PARTITION BY tokenAddress
            ORDER BY
                dayStartDateTime
        ) AS rankIndex
    FROM
        token_daily
    WHERE
        tokenAddress = p_tokenAddress
        AND dayStartDateTime >= p_startDateTime
)
SELECT
    latest.tokenAddress,
    latest.dayStartTimeStamp,
    latest.dayStartDateTime,
    IFNULL(previous.priceUSD, 0) AS openPriceUSD,
    IFNULL(latest.priceUSD, 0) AS closePriceUSD,
    CASE
        WHEN IFNULL(latest.priceUSD, 0) > IFNULL(previous.priceUSD, 0) THEN IFNULL(latest.priceUSD, 0)
        ELSE IFNULL(previous.priceUSD, 0)
    END AS highPriceUSD,
    CASE
        WHEN IFNULL(latest.priceUSD, 0) < IFNULL(previous.priceUSD, 0) THEN IFNULL(latest.priceUSD, 0)
        ELSE IFNULL(previous.priceUSD, 0)
    END AS lowPriceUSD
FROM
    tmp_token_daily AS latest
    LEFT JOIN tmp_token_daily AS previous ON latest.rankIndex = previous.rankIndex + 1
ORDER BY
    latest.dayStartDateTime;

SET
    @ @session.sql_notes = 1;

END $ $ CREATE PROCEDURE `token_hourly_candle_chart` (
    IN `p_tokenAddress` VARCHAR(250),
    IN `p_periodType` VARCHAR(50),
    IN `p_periodTime` INT
) BEGIN DECLARE p_startDateTime DATETIME DEFAULT '1970-01-01 00:00:00';

IF p_periodType = 'week' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -7 * p_periodTime DAY);

ELSEIF p_periodType = 'month' THEN
SET
    p_startDateTime = DATE_ADD(
        UTC_TIMESTAMP(),
        INTERVAL -1 * p_periodTime MONTH
    );

ELSEIF p_periodType = 'year' THEN
SET
    p_startDateTime = DATE_ADD(UTC_TIMESTAMP(), INTERVAL -1 * p_periodTime YEAR);

END IF;

SET
    @ @session.sql_notes = 0;

WITH tmp_token_hourly AS (
    SELECT
        tokenAddress,
        hourStartUnix,
        hourStartDateTime,
        priceUSD,
        RANK() OVER (
            PARTITION BY tokenAddress
            ORDER BY
                hourStartDateTime
        ) AS rankIndex
    FROM
        token_hourly
    WHERE
        tokenAddress = p_tokenAddress
        AND hourStartDateTime >= p_startDateTime
)
SELECT
    latest.tokenAddress,
    latest.hourStartUnix,
    latest.hourStartDateTime,
    IFNULL(previous.priceUSD, 0) AS openPriceUSD,
    IFNULL(latest.priceUSD, 0) AS closePriceUSD,
    CASE
        WHEN IFNULL(latest.priceUSD, 0) > IFNULL(previous.priceUSD, 0) THEN IFNULL(latest.priceUSD, 0)
        ELSE IFNULL(previous.priceUSD, 0)
    END AS highPriceUSD,
    CASE
        WHEN IFNULL(latest.priceUSD, 0) < IFNULL(previous.priceUSD, 0) THEN IFNULL(latest.priceUSD, 0)
        ELSE IFNULL(previous.priceUSD, 0)
    END AS lowPriceUSD
FROM
    tmp_token_hourly AS latest
    LEFT JOIN tmp_token_hourly AS previous ON latest.rankIndex = previous.rankIndex + 1
ORDER BY
    latest.hourStartUnix;

SET
    @ @session.sql_notes = 1;

END $ $ DELIMITER;