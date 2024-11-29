import express from 'express';
import cookieParser from 'cookie-parser';
import AccountsRouter from './routes/accounts.router.js';
import CharactersRouter from './routes/characters.router.js';
import ItemsRouter from './routes/items.router.js';
import InventoryRouter from './routes/inventory.router.js';
import MountingRouter from './routes/mounting.router.js';
import MoneyRouter from './routes/money.router.js';
import dotenv from 'dotenv';

const app = express();
const PORT = 3017;

app.use(express.json());
app.use(cookieParser());
app.use('/api', [
    AccountsRouter,
    CharactersRouter,
    ItemsRouter,
    InventoryRouter,
    MountingRouter,
    MoneyRouter,
]);

dotenv.config();

app.listen(PORT, () => {
    console.log(PORT, '포트로 서버가 열렸어요!');
});
