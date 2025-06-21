import mongoose from 'mongoose';
import { config } from 'dotenv';

config(); // .env fájl betöltése

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sutivarazs_db';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('Kapcsolódva a MongoDB adatbázishoz:', MONGODB_URI);
}).catch((err) => {
  console.error('MongoDB kapcsolódási hiba:', err.message);
});

const db = {
  async execute(query, params = []) {
    throw new Error('MongoDB esetén közvetlenül a Mongoose modelleket használd!');
  },
  async getConnection() {
    const session = await mongoose.startSession();
    console.log('Session inicializálva:', session); // Naplózás hozzáadása
    return {
        execute: () => { throw new Error('MongoDB esetén közvetlenül a Mongoose modelleket használd!'); },
        beginTransaction: async () => {
        session.startTransaction();
        return session;
        },
        commit: async () => {
        await session.commitTransaction();
        session.endSession();
        },
        rollback: async () => {
        await session.abortTransaction();
        session.endSession();
        },
        release: () => {
        session.endSession();
        },
    };
  }
};
export default db;