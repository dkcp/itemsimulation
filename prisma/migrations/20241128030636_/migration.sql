-- CreateTable
CREATE TABLE `Accounts` (
    `accountId` INTEGER NOT NULL AUTO_INCREMENT,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`accountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Characters` (
    `characterId` INTEGER NOT NULL AUTO_INCREMENT,
    `accountId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `health` INTEGER NOT NULL DEFAULT 500,
    `power` INTEGER NOT NULL DEFAULT 100,
    `money` INTEGER NOT NULL DEFAULT 10000,

    PRIMARY KEY (`characterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Items` (
    `item_code` INTEGER NOT NULL,
    `item_name` VARCHAR(191) NOT NULL,
    `health` INTEGER NOT NULL,
    `power` INTEGER NOT NULL,
    `item_price` INTEGER NOT NULL,

    PRIMARY KEY (`item_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inventory` (
    `characterId` INTEGER NOT NULL,
    `item_code` INTEGER NOT NULL,
    `count` INTEGER NOT NULL,

    PRIMARY KEY (`characterId`, `item_code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MountedItems` (
    `mountId` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `item_code` INTEGER NOT NULL,

    PRIMARY KEY (`mountId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Characters` ADD CONSTRAINT `Characters_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Accounts`(`accountId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Characters`(`characterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Inventory` ADD CONSTRAINT `Inventory_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `Items`(`item_code`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MountedItems` ADD CONSTRAINT `MountedItems_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `Characters`(`characterId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MountedItems` ADD CONSTRAINT `MountedItems_item_code_fkey` FOREIGN KEY (`item_code`) REFERENCES `Items`(`item_code`) ON DELETE CASCADE ON UPDATE CASCADE;
