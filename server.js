require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const app = express();

app.use(express.json());

app.use(cors({
    origin: ['https://frontend-huxla.vercel.app'],
    methods: ['POST']
}));

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    console.error("ERROR: OPENAI_API_KEY .env!");
    process.exit(1);
}
const openai = new OpenAI({ apiKey });

app.post('/generate', async (req, res) => {
    try {
        let { Topic } = req.body;
        
        if (!Topic || typeof Topic !== "string") {
            return res.status(400).json({ error: "Topic harus berupa teks!" });
        }

        Topic = Topic.trim();
        
        if (Topic.length > 4000) {
            return res.status(400).json({ error: "!Maksimal 4000 karakter." });
        }

        console.log(`[${new Date().toISOString()}] Topic diterima: ${ Topic }`);

        const prompt = `Tolong tulis sebuah artikel sepanjang sekitar 500 kata berdasarkan topik berikut: ${ Topic }

                        Instruksi gaya penulisan:
                        - Gunakan kalimat pendek, jelas, dan langsung ke intinya.
                        - Tulis dalam bentuk aktif, bukan pasif.
                        - Hindari kata sifat atau keterangan yang berlebihan.
                        - Gunakan bahasa natural dan profesional, seolah berbicara langsung kepada pembaca (gunakan “Anda”).
                        - Jika perlu, gunakan subjudul, paragraf singkat, atau daftar untuk membantu pembaca memahami isi.
                        - Sertakan contoh nyata atau data jika relevan dan berguna.
                        - Ajak pembaca berpikir dengan pertanyaan reflektif jika cocok dengan konteks.
                        
                        Larangan penulisan:
                        - Jangan gunakan frasa seperti:
                          “Sebagai kesimpulan…”, “Perlu dicatat bahwa…”, “Tentunya…”, “Mengungkap…”, “Menguak…”, “Rahasia…”, “Slot…”, “Oleh karena itu…” “Artikel ini…”,
                        - Jangan gunakan emoji, hashtag, tanda titik koma (;)
                        - Jangan gunakan tanda titik dua (:) di dalam judul
                        
                        Format keluaran:
                        - Tulis dalam format HTML agar bisa dirender langsung di halaman web
                        - Gunakan tag <h1> untuk judul utama, <h2> untuk subjudul, <p> untuk paragraf, dan <ul><li> untuk daftar jika relevan
                        - Susunan dan struktur artikel tidak perlu mengikuti template baku — susunlah secara alami agar nyaman dibaca.
                        
                        Tujuan akhir:
                        Hasilkan artikel yang informatif, enak dibaca, terasa ditulis oleh manusia, dan bebas dari gaya clickbait. Fokus pada kejelasan, kegunaan, dan pengalaman membaca.`;


        console.log(`[${new Date().toISOString()}] Mengirim prompt ke OpenAI`);
        const response = await openai.chat.completions.create({
            model: "o3-mini",
                messages: [{ role: "user", 
                            content: prompt }]
        });

        if (!response.choices || !response.choices[0] || !response.choices[0].message.content) {
            throw new Error("OpenAI API tidak mengembalikan hasil yang valid");
        }

        let htmlArticle = response.choices[0].message.content;
        htmlArticle = htmlArticle.replace(/```html|```/g, "").trim();

        if (typeof htmlArticle === "string") {
            htmlArticle = htmlArticle
                .replace(/<html[^>]*>/gi, "")
                .replace(/<\/html>/gi, "")
                .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
                .replace(/<meta[^>]*>/gi, "")
                .replace(/<title[^>]*>[\s\S]*?<\/title>/gi, "")
                .replace(/<body[^>]*>/gi, "")
                .replace(/<\/body>/gi, "")
                .trim();
        }

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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`[${new Date().toISOString()}] Backend berjalan di port ${PORT}`));
