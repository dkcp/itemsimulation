import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

// 아이템 생성
router.post('/items', async (req, res) => {
    try {
        const { item_code, item_name, item_stat, item_price } = req.body;
        const { health, power } = item_stat;

        const sameItem = await prisma.items.findFirst({ where: { item_code } });
        if (sameItem)
            return res
                .status(400)
                .json({ message: '이미 존재하는 아이템입니다.' });

        const item = await prisma.items.create({
            data: { item_code, item_name, health, power, item_price },
        });

        if (!item)
            return res
                .status(404)
                .json({ message: '아이템 생성에 실패했습니다.' });
        return res.status(201).json({ data: item });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

/** 아이템 전체 조회 API **/
router.get('/items', async (req, res, next) => {
    try {
        const items = await prisma.items.findMany({
            select: {
                item_code: true,
                item_name: true,
                item_price: true,
            },
        });

        return res.status(200).json({ data: items });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

/** 아이템 상세 조회 API **/
router.get('/items/:item_code', async (req, res, next) => {
    const { item_code } = req.params;
    const item = await prisma.items.findFirst({
        where: { item_code: +item_code },
        select: {
            item_code: true,
            item_name: true,
            health: true,
            power: true,
            item_price: true,
        },
    });
    if (!item) res.status(404).json({ message: '존재하지 않는 아이템입니다.' });

    const item_detail = {
        item_code: item.item_code,
        item_name: item.item_name,
        item_stat: { health: item.health, power: item.power },
        item_price: item.item_price,
    };

    return res.status(200).json({ item_detail });
});

/** 아이템 수정 API **/
router.patch('/items/:item_code', async (req, res, next) => {
    const { item_code } = req.params;
    const { item_name, item_stat } = req.body;
    const { health, power } = item_stat;

    const item = await prisma.items.findUnique({
        where: { item_code: +item_code },
    });

    if (!item)
        return res.status(404).json({ message: '아이템이 존재하지 않습니다.' });

    const updatedItem = await prisma.items.update({
        data: { item_name, health, power },
        where: {
            item_code: +item_code,
        },
    });

    return res.status(200).json({ data: updatedItem });
});

/** 아이템 삭제 API **/
router.delete('/items/:item_code', async (req, res, next) => {
    const { item_code } = req.params;

    const item = await prisma.items.findFirst({
        where: { item_code: +item_code },
    });

    if (!item)
        return res.status(404).json({ message: '아이템이 존재하지 않습니다.' });

    await prisma.items.delete({ where: { item_code: +item_code } });

    return res.status(200).json({ data: '아이템이 삭제되었습니다.' });
});

export default router;
