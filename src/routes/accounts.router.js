import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Prisma } from '@prisma/client';

const router = express.Router(); // express.Router()를 이용해 라우터를 생성합니다.

// 회원 가입 (계정 생성)
router.post('/accounts/sign-up', async (req, res, next) => {
    try {
        const { accountId, password, password_chk, name } = req.body;

        //아이디 중복 검사
        const existingId = await prisma.accounts.findFirst({
            where: { accountId: accountId },
        });
        if (existingId)
            return res.status(400).json( { message: '이미 존재하는 아이디입니다.' });

        //비밀번호 유효성 검사 : 최소 6자 이상 / 비밀번호 확인과 일치
        if (password.length < 6)
            return res
                .status(400)
                .json({ message: '비밀번호는 6자 이상이어야 합니다.' });
        if (password !== password_chk) {
            return res
                .status(400)
                .json({ message: '비밀번호 확인과 일치하지 않습니다.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        //계정 생성
        const result = await prisma.$transaction(
            async (tx) => {
                const newAccount = await tx.accounts.create({
                    data: { accountId, password: hashedPassword, name },
                });
                if (!newAccount) throw new Error('계정 생성에 실패했습니다.');
                const { password, ...responseData } = newAccount;
                return { message: '회원 가입 완료', responseData };
            },
            { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
        );
        return res.status(201).json( result);
    } catch (error) {
        return res.status(500).json( { errorName: error.message });
    }
});

/** 로그인 API **/
router.post('/accounts/sign-in', async (req, res, next) => {
    try {
        const { accountId, password } = req.body;
        const account = await prisma.accounts.findFirst({ where: { accountId } });
    
        if (!account)
            return res.status(404).json({ message: '존재하지 않는 아이디입니다.' });
        else if (!(await bcrypt.compare(password, account.password)))
            return res
                .status(403)
                .json({ message: '비밀번호가 일치하지 않습니다.' });
    
        // 로그인에 성공하면, 사용자의 userId를 바탕으로 토큰을 생성합니다.
        const token = jwt.sign(
            { accountId: account.accountId },
            process.env.JWT_KEY
        );
    
        // authotization 쿠키에 Berer 토큰 형식으로 JWT를 저장합니다.
        res.cookie('authorization', `Bearer ${token}`);
        return res.status(200).json({ message: '로그인 성공', token });
    } catch (error) {
        return res.status(500).json( { errorName: error.message });
    }
});

/** 계정 삭제 API **/
router.delete('/accounts/:accountId', async (req, res, next) => {
    const { accountId } = req.params;
    const account = await prisma.accounts.findFirst({
        where: { accountId: accountId },
    });

    if (!account)
        return res.status(404).json({ message: '계정이 존재하지 않습니다.' });

    await prisma.items.delete({ where: { accountId: accountId } });

    return res.status(200).json({ message: '계정이 삭제되었습니다.' });
});

export default router;
