import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

// 아이템 장착
router.patch(
    '/mount/on/:characterId',
    authMiddleware,
    async (req, res, next) => {
        try {
            const { accountId } = req.account;
            const { characterId } = req.params;
            const { item_code } = req.body;

            // 캐릭터 확인
            const character = await prisma.characters.findFirst({
                where: { characterId: +characterId },
                select: {
                    accountId: true,
                    name: true,
                    health: true,
                    power: true,
                    money: true,
                },
            });
            if (!character)
                return res
                    .status(404)
                    .json({ message: '존재하지 않는 캐릭터입니다.' });

            // 아이템 확인
            const item = await prisma.items.findFirst({
                where: { item_code: item_code },
                select: { item_name: true, health: true, power: true },
            });
            if (!item)
                return res
                    .status(404)
                    .json({ message: '존재하지 않는 아이템입니다.' });

            // JWT 인증
            if (character.accountId !== accountId)
                return res
                    .status(401)
                    .json({ message: '로그인한 계정의 캐릭터가 아닙니다.' });
            console.log('JWT 인증 성공');

            // 인벤토리 없으면 장착 거부
            const inventory = await prisma.inventory.findFirst({
                where: { characterId: +characterId, item_code: +item_code },
            });
            if (!inventory)
                return res
                    .status(404)
                    .json({ message: '장착 거부. 인벤토리에 없는 아이템' });
            else console.log('인벤토리 보유 여부 확인 완료');

            // 중복 장착 거부
            const alreadyMountedItem = await prisma.mountedItems.findFirst({
                where: { characterId: +characterId, item_code: item_code },
            });
            if (alreadyMountedItem)
                return res
                    .status(400)
                    .json({ message: '장착 거부. 이미 장착된 아이템' });
            else console.log('장착 가능 여부 확인 완료');

            const result = await prisma.$transaction(
                async (tx) => {
                    // 장착 테이블 반영
                    await tx.mountedItems.create({
                        data: {
                            characterId: +characterId,
                            item_code: +item_code,
                        },
                    });

                    // 인벤토리 수량 반영
                    if (inventory.count - 1 === 0) {
                        await tx.inventory.delete({
                            where: {
                                characterId_item_code: {
                                    characterId: +characterId,
                                    item_code: +item_code,
                                },
                            },
                        });
                    } else {
                        await tx.inventory.update({
                            data: {
                                characterId: +characterId,
                                item_code: +item_code,
                                count: inventory.count - 1,
                            },
                            where: {
                                characterId_item_code: {
                                    characterId: +characterId,
                                    item_code: +item_code,
                                },
                            },
                        });
                    }

                    // 캐릭터 스탯 업데이트
                    let health = Number(character.health) + Number(item.health);
                    let power = Number(character.power) + Number(item.power);
                    await tx.characters.update({
                        data: { health, power },
                        where: { characterId: +characterId },
                    });
                    return {
                        message: `[${character.name}] 장착 성공 [${item.item_name}]`,
                    };
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.ReadCommitted,
                }
            );
            return res.status(201).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
);

// 아이템 탈착
router.patch(
    '/mount/off/:characterId',
    authMiddleware,
    async (req, res, next) => {
        try {
            const { accountId } = req.account;
            const { characterId } = req.params;
            const { item_code } = req.body;

            // 캐릭터, 아이템 확인
            const character = await prisma.characters.findFirst({
                where: { characterId: +characterId },
                select: {
                    accountId: true,
                    name: true,
                    health: true,
                    power: true,
                    money: true,
                },
            });
            if (!character)
                return res.status(404).json({ message: '오류 - 없는 캐릭터' });
            const item = await prisma.items.findFirst({
                where: { item_code: item_code },
                select: { item_name: true, health: true, power: true },
            });
            if (!item)
                return res.status(404).json({ message: '오류 - 없는 아이템' });

            // JWT 인증
            if (character.accountId !== accountId)
                return res
                    .status(401)
                    .json({ message: '로그인한 계정의 캐릭터가 아닙니다.' });

            console.log('JWT 인증 성공');

            // 장착 테이블 확인
            const mountedItem = await prisma.mountedItems.findFirst({
                where: { characterId: +characterId, item_code: +item_code },
                select: { mountId: true, characterId: true, item_code: true },
            });
            if (!mountedItem)
                return res
                    .status(404)
                    .json({ message: '장착 거부. 장착 되어있지 않은 아이템' });

            const result = await prisma.$transaction(
                async (tx) => {
                    // 인벤토리에 있는지 확인하고 있으면 count+1, 없으면 create
                    const inventory = await tx.inventory.findFirst({
                        where: {
                            characterId: +characterId,
                            item_code: +item_code,
                        },
                    });
                    if (inventory) {
                        await tx.inventory.update({
                            data: { count: inventory.count + 1 },
                            where: {
                                characterId_item_code: {
                                    characterId: +characterId,
                                    item_code: +item_code,
                                },
                            },
                        });
                    } else {
                        await tx.inventory.create({
                            data: {
                                characterId: +characterId,
                                item_code,
                                count: 1,
                            },
                        });
                    }
                    console.log('인벤토리 수량 반영 성공');

                    // 장착 테이블 반영 delete
                    await tx.mountedItems.delete({
                        where: { mountId: mountedItem.mountId },
                    });
                    console.log('장착 테이블 반영 성공');

                    // 캐릭터 스탯 업데이트
                    let health = Number(character.health) - Number(item.health);
                    let power = Number(character.power) - Number(item.power);
                    await tx.characters.update({
                        data: { health: +health, power: +power },
                        where: { characterId: +characterId },
                    });
                    console.log('캐릭터 스탯 업데이트 성공');

                    return {
                        message: `[${character.name}] 장착 해제 [${item.item_name}]`,
                    };
                },
                {
                    isolationLevel:
                        Prisma.TransactionIsolationLevel.ReadCommitted,
                }
            );
            return res.status(201).json(result);
        } catch (error) {
            return res.status(500).json({ message: error.message });
        }
    }
);

// 인벤토리 조회
router.get('/mount/:characterId', authMiddleware, async (req, res, next) => {
    try {
        const { accountId } = req.account;
        const { characterId } = req.params;
    
        // 캐릭터 확인
        const character = await prisma.characters.findFirst({
            where: { characterId: +characterId },
            select: { accountId: true, money: true },
        });
        if (!character)
            return res.status(404).json({ message: '존재하지 않는 캐릭터입니다.' });
    
        const mountedItems = await prisma.mountedItems.findMany({
            where: { characterId: +characterId },
            select: {
                item_code: true,
                items: {
                    select: {
                        item_name: true,
                    },
                },
            },
        });
    
        return res.status(201).json({ data: mountedItems });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

export default router;
