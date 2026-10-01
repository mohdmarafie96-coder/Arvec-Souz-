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
    const { item_name, condition_tier, destination_country, preferred_currency, json_output_only } = req.body;

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

    const prompt = `You are the Smart Item Sourcing & Landed Cost Engine for "Arvec Souz".
Analyze this purchase request:
- Item: "${item_name}"
- Condition Tier: "${condition_tier || 'New / Store Fresh'}"
- Destination Country: "${destination_country}"
- Preferred Currency: "${preferred_currency || 'USD'}"

Operational Rules:
1. Select exactly 5 reliable, authenticated sources tailored to this item's category:
   - For luxury fashion / quota bags: Sotheby's Buy Now, FASHIONPHILE, Madison Avenue Couture, The Luxury Closet, 1stDibs, Farfetch Private Client.
   - For luxury watches / horology: Chrono24 (Verified Dealers), WatchBox/1916 Company, Bob's Watches, European Watch Co., Bucherer CPO.
   - For consumer tech / camera gear: B&H Photo Video, Adorama, Amazon Direct, Best Buy, authorized regional distributors.
2. Filter out out-of-stock and unverified listings.
3. Determine clearance type: DDP (Delivered Duty Paid) or DDU (Delivered Duty Unpaid).
4. Compute CIF & Landed Cost Arithmetic:
   - CIF = Base Price + Insured Freight + Transit Insurance
   - Duty Amount = CIF × Local Customs Duty Rate (e.g. GCC 5%, US ~3-6.5%, UK ~2.5%, EU ~3%)
   - VAT/Tax = (CIF + Duty Amount) × Destination VAT Rate (e.g. Kuwait 0%, UAE 5%, Saudi Arabia 15%, UK 20%, EU 19-21%, US 0% federal)
   - Total Landed Cost = Base Price + Freight & Insurance + Duty + Local VAT
5. All pricing must be converted to the preferred currency (${preferred_currency || 'USD'}).

Return a strictly valid JSON object matching this schema:
{
  "query": {
    "item": "${item_name}",
    "destination": "${destination_country}",
    "condition": "${condition_tier || 'New / Store Fresh'}",
    "currency": "${preferred_currency || 'USD'}"
  },
  "market_summary": "Two concise sentences describing retail boutique availability vs. secondary market premium.",
  "sources": [
    {
      "rank": 1,
      "store_name": "Store Name",
      "source_url": "https://www.google.com/search?q=...",
      "condition_grade": "Store Fresh / Pristine (Box & Papers)",
      "inclusions": "Original invoice, dustbag, clochette, lock & keys, felt protector",
      "clearance_type": "DDP" | "DDU",
      "eta_business_days": "3 - 5 business days (FedEx International Priority)",
      "pricing": {
        "base_price": number,
        "shipping_insured": number,
        "customs_duty": number,
        "local_vat": number,
        "total_landed_cost": number,
        "currency": "${preferred_currency || 'USD'}"
      },
      "duty_percent": 5,
      "vat_percent": 0,
      "carrier": "DHL Express Worldwide or FedEx International Priority",
      "authenticity_guarantee": "Full lifetime money-back authenticity guarantee and physical multi-point inspection",
      "return_policy": "14-day return window with security tag intact"
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
    console.error('Server Sourcing Engine error:', err);
    res.status(500).json({
      fallback: true,
      error: err instanceof Error ? err.message : 'Failed to query sourcing engine',
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
