const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');

// Inisialisasi Firebase
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({
  credential: cert(serviceAccount),
  databaseURL: "https://YOUR-FIREBASE-PROJECT.firebaseio.com"
});

module.exports = async (req, res) => {
  try {
    const query = req.url.split('?')[1] || '';
    let params;

    // ========================================
    // Dashboard 1: Format <param1><param2>...
    // Contoh: <123><5.5><ID><Android><192.168.1.1>
    // ========================================
    if (query.includes('<') && query.includes('>')) {
      const values = query.split(/<|>/).filter(x => x.trim() !== '');
      
      if (values.length !== 5) {
        return res.status(400).json({ error: "Format Dashboard 1 tidak valid" });
      }

      params = {
        click_id: values[0],
        payout: parseFloat(values[1]) || 0,
        country: values[2],
        os: values[3],
        ip: `scamalytics.com/ip/${values[4]}`,
        source: "dashboard1",
        timestamp: new Date().toISOString()
      };

    // ========================================
    // Dashboard 2: Format {param1}{param2}...
    // Contoh: {US}{USD}{15.5}{EXT456}
    // ========================================
    } else if (query.includes('{') && query.includes('}')) {
      const values = query.split(/{|}/).filter(x => x.trim() !== '');
      
      if (values.length !== 4) {
        return res.status(400).json({ error: "Format Dashboard 2 tidak valid" });
      }

      params = {
        country: values[0],
        currency: values[1],
        sum: parseFloat(values[2]) || 0,
        ext_click_id: values[3],
        source: "dashboard2",
        timestamp: new Date().toISOString()
      };

    } else {
      return res.status(400).json({ error: "Format tidak dikenali" });
    }

    // Simpan ke Firebase Realtime Database
    const db = getDatabase();
    await db.ref('conversions').push().set(params);

    res.status(200).json({ status: "success", data: params });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};