require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const app = express();

app.use(express.json());

app.use(cors({
    origin: ['https://cakar-iota.vercel.app'],
    methods: ['POST']
}));

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("ERROR: OPENAI_API_KEY tidak ditemukan di .env!");
    process.exit(1);
}
const openai = new OpenAI({ apiKey });

app.post('/generate', async (req, res) => {
    try {
        let { keyword } = req.body;
        
        if (!keyword || typeof keyword !== "string") {
            return res.status(400).json({ error: "keyword harus berupa teks!" });
        }
        keyword = keyword.trim();
        
        if (keyword.length > 200) {
            return res.status(400).json({ error: "keyword terlalu panjang! Maksimal 200 karakter." });
        }

        console.log(`[${new Date().toISOString()}] keyword diterima: ${keyword}`);

        const prompt =`
            Tulis artikel SEO minimal 1000 kata tentang ${keyword} Dengan Struktur HTML. Buatlah Judul artikel seunik mungkin, Artikel harus informatif, engaging, dan menarik. Ubah kata Slot menjadi Game!!!
                OUTPUT ARTIKEL:
                    <h1>Judul Utama</h1>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Subjudul</h2>
                    <p>Paragraf</p>
                    <h2>Kesimpulan</h2>
                    <p>Paragraf</p>`;

        console.log(`[${new Date().toISOString()}] Mengirim prompt ke OpenAI...`);
        const response = await openai.chat.completions.create({
            model: "o4-mini",
                   messages: [{ role: "user", 
                        content: prompt }]
        });

        if (!response.choices || !response.choices[0] || !response.choices[0].message.content) {
            throw new Error("OpenAI API tidak mengembalikan hasil yang valid.");
        }

        let htmlArticle = response.choices[0].message.content;
        htmlArticle = htmlArticle.replace(/```html|```/g, "").trim();

        console.log(`[${new Date().toISOString()}] Artikel berhasil dibuat, panjang karakter: ${htmlArticle.length}`);

        res.json({ text: htmlArticle });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Error OpenAI API:`, error.response ? error.response.data : error.message);

        let errorMessage = "Terjadi kesalahan saat membuat artikel.";

        if (error.response && error.response.status === 429) {
            errorMessage = "Terlalu banyak permintaan ke OpenAI API. Silakan coba lagi nanti.";
        }

        res.status(500).json({ error: errorMessage });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[${new Date().toISOString()}] Backend berjalan di port ${PORT}`));
