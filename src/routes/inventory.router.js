import express from 'express';
import { prisma } from '../utils/prisma/index.js'
import authMiddleware from '../middlewares/auth.middleware.js';
import { Prisma } from '@prisma/client';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

// 아이템 구매
router.post('/inventory/purchase/:characterId', authMiddleware, async (req, res, next) => {
    try {
        const { accountId } = req.account;
        const { characterId } = req.params;
        const { item_code, count } = req.body;

        // 캐릭터, 아이템 확인
        const character = await prisma.characters.findFirst({
            where: { characterId: +characterId },
            select: { accountId: true, money: true }
        });
        if (!character) return res.status(404).json({ message: '존재하지 않는 캐릭터입니다.' })

        // JWT 인증
        if (character.accountId !== accountId) return res.status(404).json({ message: '로그인한 계정의 캐릭터가 아닙니다.' });
        console.log('JWT 인증 성공');

        const item = await prisma.items.findFirst({ where: { item_code: item_code }, select: { item_price: true } });
        if (!item) return res.status(404).json({ message: '존재하지 않는 아이템입니다.' })

        // 잔액 검사
        if (character.money < item.item_price * count) {
            return res.status(400).json({ message: "금액이 부족합니다." });
        }

        const result = await prisma.$transaction(async tx => {
            // 보유 인벤토리 검사
            const existingInventory = await tx.inventory.findFirst({ where: { characterId: +characterId, item_code: item_code } });

            // 인벤토리 반영
            if (!existingInventory) {
                //새로운 인벤토리 항목 생성
                const newInventory = await tx.inventory.create({ data: { characterId: +characterId, item_code, count } });
            } else {
                //기존 인벤토리 항목에 count 추가
                const updatedInventory = await tx.inventory.update({
                    data: { characterId: +characterId, item_code, count: existingInventory.count + count },
                    where: { characterId_item_code: { characterId: +characterId, item_code: +item_code } }
                });
            }

            // 캐릭터 머니 업데이트
            const updatedCharacter = await tx.characters.update({
                data: { money: character.money - (item.item_price * count) },
                where: { characterId: +characterId }
            });

            return { data: `구매 후 게임 머니 잔액 : ${character.money} -> ${updatedCharacter.money}` };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
        return res.status(201).json(result);
    } catch (error) {
        next();
    }
});

// 아이템 판매
router.post('/inventory/sell/:characterId', authMiddleware, async (req, res, next) => {
    try {
        const { accountId } = req.account;
        const { characterId } = req.params;
        const { item_code, count } = req.body;

        // 캐릭터, 아이템 확인
        const character = await prisma.characters.findFirst({
            where: { characterId: +characterId },
            select: { accountId: true, money: true }
        });
        if (!character) return res.status(404).json({ message: '존재하지 않는 캐릭터입니다.' });

        const item = await prisma.items.findFirst({ where: { item_code: item_code }, select: { item_price: true } });
        if (!item) return res.status(404).json({ message: '존재하지 않는 아이템입니다.' });

        // JWT 인증
        if (character.accountId !== accountId) return res.status(404).json({ message: '로그인한 계정의 캐릭터가 아닙니다.' });
        console.log('JWT 인증 성공');

        // 보유 인벤토리 검사
        const existingInventory = await prisma.inventory.findFirst({
            where: { characterId: +characterId, item_code: +item_code }
        });
        if (!existingInventory)
            return res.status(404).json({ message: '캐릭터가 보유하지 않은 아이템입니다.' });

        const result = await prisma.$transaction(async tx => {
            if (existingInventory.count - count >= 0) {
                // 개수가 0이면 inventory에서 삭제
                if (existingInventory.count - count === 0) {
                    await tx.inventory.delete({
                        where: { characterId_item_code: { characterId: +characterId, item_code: +item_code } }
                    });
                }else {
                    await tx.inventory.update({
                        data: { characterId: +characterId, item_code, count: existingInventory.count - count },
                        where: { characterId_item_code: { characterId: +characterId, item_code: +item_code } }
                    });
                }
                // 캐릭터 머니 업데이트
                const updatedCharacter = await prisma.characters.update({
                    data: { money: character.money + Math.floor((item.item_price * count) * 0.6) },
                    where: { characterId: +characterId }
                });
                return { data:  `판매 후 게임 머니 잔액 : ${character.money} -> ${updatedCharacter.money}` };
            }else 
                return { message: '보유중인 수량보다 많이 팔 수 없습니다.' };
        }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
        return res.status(201).json(result);
    } catch (error) {
        next();
    }
});

export default router;
