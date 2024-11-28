import express from 'express';
import { prisma } from '../utils/prisma/index.js'
import authMiddleware from '../middlewares/auth.middleware.js';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

router.post('/money/:characterId', authMiddleware, async (req, res) => {
    const { accountId } = req.account;
    const { characterId } = req.params;

    // 캐릭터 확인
    const character = await prisma.characters.findFirst({
        where: { characterId: +characterId },
        select: { accountId: true, money: true }
    });

    // JWT 인증
    if(character.accountId!==accountId) return res.status(404).json({ message: '로그인한 계정의 캐릭터가 아닙니다.'});
    console.log('JWT 인증 성공');

    // 100원 추가
    const updatedCharacter = await prisma.characters.update({
        data: { money: character.money+100 },
        where: { characterId: +characterId }
    })
    if(!updatedCharacter) return res.status(404).json({ data : `게임 머니 업데이트 실패` });

    return res.status(201).json({ data : `변경된 잔액 게임 머니 : ${updatedCharacter.money}` });
});

export default router;
