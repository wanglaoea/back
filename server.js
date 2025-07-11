require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
const app = express();

app.use(express.json());

app.use(cors({
    origin: ['https://idola.vercel.app'],
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

        const prompt = `Bisakah Anda menulis Artikel yang panjangnya 500 kata dan mencakup setidaknya 6 subjudul. Optimalkan Artikel tentang ${Topic} dan pastikan mudah diikuti. Berikut template prompt lengkap dengan instruksi gaya menulis dan struktur output HTML yang kamu minta:
                          Saat menjawab, ikuti instruksi berikut:
                          Gunakan kalimat pendek, langsung, dan mudah dipahami.
                          Hindari kata-kata berlebihan, istilah teknis yang tidak perlu, atau bahasa promosi.
                          Tulis dalam bentuk aktif, bukan pasif.
                          Pisahkan ide dengan jeda baris agar mudah dibaca.
                          Jika ada daftar, gunakan poin-poin.
                          Berikan contoh nyata, data, atau pengalaman pribadi bila memungkinkan.
                          Ajak pembaca berpikir dengan pertanyaan yang relevan.
                          Sapa pembaca langsung dengan “Anda” atau “milik Anda.”
                          Jangan gunakan frasa seperti:
                          “Sebagai kesimpulan…”
                          “Perlu dicatat bahwa…”
                          “Tentunya…”
                          “Oleh karena itu…”
                          
                          Jangan gunakan:
                          Emoji
                          Hashtag
                          Tanda titik koma
                          Hindari kata sifat/keterangan berlebihan.
                          Jangan buat kalimat yang panjang atau bertele-tele.
                          Jangan buat generalisasi.
                          Tujuan utama: Sampaikan informasi atau solusi secara jelas, cepat, dan bisa langsung digunakan.
                          
                          Struktur Output yang Diharapkan HTML:
                          <h1>Judul</h1>
                          <p>Paragraf.</p>
                          <h2>Judul</h2>
                          <p>Paragraf.</p>
                          <h2>Judul</h2>
                          <p>Paragraf.</p>
                          <h2>Judul</h2>
                          <p>Paragraf.</p>
                          <h2>Judul</h2>
                          <p>Paragraf.</p>
                          <h2>Judul</h2>
                          <p>Paragraf.</p>
                          <h2>Judul</h2>
                          <p>Paragraf.</p>

                         Gunakan format ini secara konsisten untuk semua output teks yang bersifat penjabaran, penjelasan, atau panduan. Jika perlu menyesuaikan jumlah bagian, tetap gunakan pola <h2> untuk subjudul dan <p> untuk isi.`;


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
