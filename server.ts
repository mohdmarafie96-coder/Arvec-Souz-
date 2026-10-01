import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google Gen AI with required User-Agent
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Sourcing & Landed Cost API Endpoint
app.post('/api/sourcing/analyze', async (req, res) => {
  try {
    const { item_name, condition_tier, destination_country, preferred_currency } = req.body;

    if (!item_name || !destination_country) {
      res.status(400).json({ error: 'item_name and destination_country are required.' });
      return;
    }

    if (!ai) {
      res.status(503).json({
        fallback: true,
        message: 'GEMINI_API_KEY not configured on server. Use client-side arithmetic engine.',
      });
      return;
    }

    const cleanItem = item_name.trim();

    const prompt = `You are the Smart Item Sourcing & Landed Cost Engine for "Arvec Souz".
Perform an authenticated marketplace search and precise CIF landed cost calculation for:
- Exact Item: "${cleanItem}"
- Condition Grade: "${condition_tier || 'New / Store Fresh'}"
- Destination Country: "${destination_country}"
- Display Currency: "${preferred_currency || 'USD'}"

CRITICAL SOURCING & PRICING RULES:
1. PRICE ACCURACY: You must retrieve and calculate REAL current market pricing for "${cleanItem}". Do NOT use generic or static placeholders.
   - If user specified a budget or price (e.g. "$14,000", "KD 4,500"), anchor prices closely around that target.
   - If market price is $28,000, compute base price around $28,000, not an arbitrary low or high number.
   - Sort the 5 sources by Total Landed Cost in ascending order (best / lowest price first).

2. VERIFIED SOURCES & WORKING URLS ONLY (AVOID UNAVAILABLE / BROKEN PAGES):
   - Select 5 authenticated, verified platforms for this category:
     * Watches: Chrono24 (Verified Dealers), WatchBox/1916 Company, Bob's Watches, European Watch Co., Bucherer CPO.
     * Luxury Bags: Sotheby's Buy Now, FASHIONPHILE, Madison Avenue Couture, The Luxury Closet, 1stDibs, Farfetch Private Client.
     * Optics/Tech: B&H Photo Video, Adorama, Amazon Direct, Best Buy, Leica Store.
   - For every source, generate a canonical, live working in-stock search URL:
     * Chrono24: https://www.chrono24.com/search/index.htm?query=${encodeURIComponent(cleanItem)}&dosearch=true&searchexplain=1&sortorder=1
     * Sotheby's: https://www.sothebys.com/en/buy/luxury/search?query=${encodeURIComponent(cleanItem)}
     * WatchBox: https://www.the1916company.com/search?q=${encodeURIComponent(cleanItem)}
     * Bob's Watches: https://www.bobswatches.com/rolex-search?q=${encodeURIComponent(cleanItem)}
     * FASHIONPHILE: https://www.fashionphile.com/shop?search=${encodeURIComponent(cleanItem)}
     * The Luxury Closet: https://theluxurycloset.com/search?q=${encodeURIComponent(cleanItem)}
     * B&H Photo: https://www.bhphotovideo.com/c/search?Ntt=${encodeURIComponent(cleanItem)}&N=0&InitialSearch=yes
     * Adorama: https://www.adorama.com/l/?searchinfo=${encodeURIComponent(cleanItem)}&sel=Instock_In-Stock
     * Farfetch: https://www.farfetch.com/shopping/search/items.aspx?q=${encodeURIComponent(cleanItem)}

3. CIF & LANDED COST ARITHMETIC:
   - Base Price: [Accurate item price in ${preferred_currency}]
   - Insured Shipping: [Express courier freight + full value transit insurance in ${preferred_currency}]
   - CIF = Base Price + Insured Freight
   - Customs Duty = CIF × Destination Customs Duty Rate (GCC 5%, US ~3-6%, UK ~2.5%, EU ~3%)
   - Local VAT = (CIF + Duty) × Destination VAT Rate (Kuwait 0%, UAE 5%, Saudi Arabia 15%, UK 20%, EU 19-21%, US 0%)
   - Total Landed Cost = Base Price + Insured Freight + Duty + Local VAT

4. OUTPUT FORMAT:
Output strictly valid JSON matching this schema:
{
  "query": {
    "item": "${cleanItem}",
    "destination": "${destination_country}",
    "condition": "${condition_tier || 'New / Store Fresh'}",
    "currency": "${preferred_currency || 'USD'}"
  },
  "market_summary": "Two concise sentences describing retail boutique availability vs. secondary market premium for this specific model.",
  "sources": [
    {
      "rank": 1,
      "store_name": "Store Name",
      "source_url": "Canonical working live catalog URL",
      "condition_grade": "Specific condition (e.g. Unworn 2024 Full Set / Sealed)",
      "inclusions": "Complete inclusions (box, papers, tags, seals, warranty)",
      "clearance_type": "DDP" | "DDU",
      "eta_business_days": "3 - 5 business days",
      "pricing": {
        "base_price": number,
        "shipping_insured": number,
        "customs_duty": number,
        "local_vat": number,
        "total_landed_cost": number,
        "currency": "${preferred_currency || 'USD'}"
      },
      "duty_percent": number,
      "vat_percent": number,
      "carrier": "Ferrari Express / DHL Express / FedEx Priority",
      "authenticity_guarantee": "Authenticity guarantee terms",
      "return_policy": "Inspection and return window terms"
    }
  ]
}
Do NOT include markdown fences, code blocks, or extra text. Output only valid JSON.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    const parsed = JSON.parse(jsonText);
    res.json(parsed);
  } catch (err: unknown) {
    console.warn('Server Sourcing Engine live query error, falling back:', err);
    res.status(500).json({
      fallback: true,
      error: err instanceof Error ? err.message : 'Fallback to client arithmetic engine',
    });
  }
});

// Setup Vite middleware in dev or static serving in prod
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Arvec Souz Sourcing Engine running on port ${PORT}`);
  });
}

startServer();
