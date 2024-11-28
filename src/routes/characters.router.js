import express from 'express';
import { prisma } from '../utils/prisma/index.js'
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

// 캐릭터 생성
router.post('/characters', authMiddleware, async (req, res) => {
    try {
        const { accountId } = req.account;
        const { name } = req.body;

        //캐릭터 명 중복 검사
        const character = await prisma.characters.findFirst({ where: { name: name } });
        if (character) return res.status(404).json({ message: '이미 존재하는 캐릭터 명입니다.' });

        //캐릭터 생성   health, power, money는 default값으로 추가
        const newCharacter = await prisma.characters.create({ data: { accountId: accountId, name } });
        if (!newCharacter) return res.status(404).json({ message: '캐릭터 생성에 실패했습니다.' });
        else return res.status(201).json({ data: newCharacter.characterId });
    } catch (error) {
        return res.status(400).json({ message: error.name });
    }
});

/** 캐릭터 전체 조회 API **/
router.get('/characters', authMiddleware, async (req, res, next) => {
    try {
        const { accountId } = req.account;

        //캐릭터 테이블에서 accountId가 일치하는 캐릭터들 불러오기
        const characters = await prisma.characters.findMany({
            where: { accountId: accountId },
            select: {
                characterId: true,
                name: true,
                health: true,
                power: true,
                money: true,
            },
        });

        return res.status(200).json({ data: characters });
    } catch (error) {
        return res.status(400).json({ message: error.name });
    }
});

/** 캐릭터 상세 조회 API **/
router.get('/characters/:characterId', authMiddleware, async (req, res, next) => {
    const { accountId } = req.account;
    const { characterId } = req.params;

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
    if (!character) res.status(404).json({ message: '존재하지 않는 캐릭터입니다.' });

    if (character.accountId === accountId) {    //내 캐릭터, 머니 추가
        const { accountId, ...responseData } = character;
        return res.status(200).json({ responseData });
    } else {                                        //남의 캐릭터
        const { accountId, money, ...responseData } = character;
        return res.status(200).json({ responseData });
    }
});

/** 캐릭터 삭제 API **/
router.delete('/characters/:characterId', authMiddleware, async (req, res, next) => {
    const { accountId } = req.account;
    const { characterId } = req.params;

    const character = await prisma.characters.findFirst({ where: { characterId: +characterId } });

    if (!character)
        return res.status(404).json({ message: '캐릭터가 존재하지 않습니다.' });
    if (accountId !== character.accountId)
        return res.status(404).json({ message: '현재 계정에서 생성한 캐릭터가 아닙니다.'});

    await prisma.characters.delete({ where: { characterId: +characterId } });

    return res.status(200).json({ data: '캐릭터가 삭제되었습니다.' });
});

export default router;
