import mongoose from 'mongoose';

const recipeSchema = new mongoose.Schema({
  nev: { type: String, required: true, maxlength: 100 },
  kep: { type: String, default: null },
  leiras: { type: String, required: true },
  hozzavalok: { type: String, required: true },
  keszitesi_utmutato: { type: String, required: true },
  elokeszitesi_ido: { type: String, default: null },
  sutesi_ido: { type: String, default: null },
  adagok_szama: { type: String, default: null },
  createdAt: { type: String, required: true, default: () => new Date().toISOString() },
  updatedAt: { type: String, required: true, default: () => new Date().toISOString() },
});

export default mongoose.model('Recipe', recipeSchema);