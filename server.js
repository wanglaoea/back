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

        console.log(`[${new Date().toISOString()}] Topic diterima: "${Topic}"`);

        const prompt = `Tulis artikel sepanjang ±500 kata dengan gaya santai, storytelling ringan, dan tetap menarik untuk pembaca online. Optimalkan untuk SEO menggunakan kata kunci "${Topic}". Artikel harus informatif, mengalir alami, dan terasa ditulis oleh manusia.

                        Struktur Artikel (boleh fleksibel, tapi tetap mengalir):
                        
                        <h1>Judul Utama Artikel yang Menarik dan Relevan</h1> <!-- 150–200 kata -->
                        <p>Ceritakan pengalaman pribadi atau fiktif yang relatable seputar topik.</p>
                        <p>Ulas hasil atau sensasi yang muncul dari permainan yang direkomendasikan.</p>
                        
                        <h2>Subjudul Unik dan Subjektif Tentang Topik</h2> <!-- 150–200 kata -->
                        <p>Jelaskan game secara ringan: tema, tampilan, dan fitur khasnya.</p>
                        <p>Alasan kenapa game ini banyak dicari dan digemari pemain.</p>
                        
                        <h2>Detail Permainan yang Direkomendasikan</h2> <!-- 150–200 kata -->
                        <p>Bahas simbol scatter hitam dan efeknya saat muncul di dalam game.</p>
                        <p>Kenapa simbol ini bisa memicu mega jackpot atau free spin?</p>
                        
                        <h2>Hasil Keuntungan dan Strategi Main</h2> <!-- 250–300 kata -->
                        <p>Bagikan tips main berdasarkan pengalaman atau pola yang diamati.</p>
                        <p>Ulas waktu gacor, pola bet, cara jaga saldo agar tahan lama.</p>
                        <p>Strategi memadukan scatter, wild, dan pentingnya sabar saat spin.</p>
                        
                        <h2>Penutup Ringan dengan Ajakan</h2> <!-- 150–200 kata -->
                        <p>Ringkas manfaat dan potensi cuan dari topik.</p>
                        <p>Tutup dengan ajakan santai untuk mencoba — jangan hard-sell, boleh diselipkan candaan ringan atau kalimat yang menggugah rasa penasaran.</p>
                        
                        Catatan Penting (Larangan):
                        
                        Hindari frasa klise seperti:
                        “Sebagai kesimpulan”, “Perlu dicatat bahwa”, “Tentunya”, “Menguak”, “Rahasia”, “Slot”, “Oleh karena itu”, “Artikel ini”
                        
                        Jangan gunakan emoji, hashtag, titik koma (;) atau titik dua (:) dalam judul.
                        
                        Gunakan format HTML agar bisa langsung dirender di web.
                        
                        Tujuan Akhir:
                        Hasilkan artikel yang:
                        - Ringan, enak dibaca, dan punya ritme alami
                        - Mengedukasi sambil menghibur
                        - SEO-friendly tapi tidak terkesan dipaksakan
                        - Menghindari gaya clickbait murahan, lebih fokus ke kejelasan, insight, dan kenyamanan pembaca.`;


        console.log(`[${new Date().toISOString()}] Mengirim prompt ke OpenAI`);
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
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
