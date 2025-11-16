import express from "express";
import QRCode from "qrcode";

const app = express();
app.use(express.urlencoded({ extended: true }));

// Temporary in-memory storage
const prescriptions = new Map();

app.get("/", (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Medical Prescription QR Generator</title>
        <style>
          body {
            font-family: Poppins, sans-serif;
            text-align: center;
            background: #f0f6fb;
          }
          form {
            display: inline-block;
            text-align: left;
            background: #fff;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            margin-top: 30px;
          }
          input, textarea {
            width: 300px;
            padding: 8px;
            margin: 5px 0;
            border: 1px solid #ccc;
            border-radius: 6px;
          }
          button {
            padding: 10px 20px;
            background: #2E86C1;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
          }
          .medicine-item {
            display: flex;
            gap: 5px;
            margin-bottom: 8px;
          }
          .medicine-item input {
            width: 140px;
          }
          .remove-btn {
            background: red;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            padding: 0 8px;
          }
        </style>
      </head>
      <body>
        <h1 style="color:#2E86C1;">🩺 Medical Prescription QR Generator</h1>
        <form method="POST" action="/generate" id="prescriptionForm">
          <label>Patient Name:</label><br/>
          <input type="text" name="name" required><br/>
          
          <label>Age:</label><br/>
          <input type="number" name="age" required><br/>
          
          <label>Diagnosis:</label><br/>
          <input type="text" name="diagnosis" required><br/>
          
          <label>Medicines:</label><br/>
          <div id="medicinesContainer">
            <div class="medicine-item">
              <input type="text" name="medicineName[]" placeholder="Medicine Name" required>
              <input type="text" name="medicineDose[]" placeholder="Dosage (e.g. 2/day)" required>
              <button type="button" class="remove-btn" onclick="removeMedicine(this)">x</button>
            </div>
          </div>
          <button type="button" onclick="addMedicine()" style="background:#1E8449;margin-top:5px;">+ Add Medicine</button><br/><br/>
          
          <button type="submit">Generate QR</button>
        </form>

        <script>
          function addMedicine() {
            const container = document.getElementById('medicinesContainer');
            const div = document.createElement('div');
            div.className = 'medicine-item';
            div.innerHTML = \`
              <input type="text" name="medicineName[]" placeholder="Medicine Name" required>
              <input type="text" name="medicineDose[]" placeholder="Dosage (e.g. 2/day)" required>
              <button type="button" class="remove-btn" onclick="removeMedicine(this)">x</button>
            \`;
            container.appendChild(div);
          }

          function removeMedicine(btn) {
            btn.parentElement.remove();
          }
        </script>
      </body>
    </html>
  `);
});

app.post("/generate", async (req, res) => {
  const { name, age, diagnosis, medicineName, medicineDose } = req.body;
  const id = Date.now().toString();

  const medicines = (Array.isArray(medicineName) ? medicineName : [medicineName]).map(
    (m, i) => `${m} - ${Array.isArray(medicineDose) ? medicineDose[i] : medicineDose}`
  );

  const prescription = { id, name, age, diagnosis, medicines };
  prescriptions.set(id, prescription);

  const qrLink = `http://localhost:3000/prescription/${id}`;
  const qr = await QRCode.toDataURL(qrLink);

  res.send(`
    <div style="font-family:Poppins,sans-serif;text-align:center;margin-top:50px;">
      <h2>Prescription Generated ✅</h2>
      <img src="${qr}" alt="QR Code" style="margin:20px;border:1px solid #ccc;padding:10px;border-radius:8px;"/>
      <p>Scan this QR to view prescription</p>
      <p style="margin-top:10px;">
        <strong>🔗 Direct Link:</strong><br/>
        <a href="${qrLink}" target="_blank" style="color:#2E86C1;text-decoration:none;">${qrLink}</a>
      </p>
      <br>
      <a href="/" style="text-decoration:none;color:#2E86C1;">Create Another</a>
    </div>
  `);
});

app.get("/prescription/:id", (req, res) => {
  const prescription = prescriptions.get(req.params.id);
  if (!prescription) {
    return res.send("<h2 style='text-align:center;margin-top:50px;color:red;'>❌ Prescription not found</h2>");
  }

  const medicineList = prescription.medicines
    .map(med => `<li>${med}</li>`)
    .join("");

  res.send(`
    <div style="font-family:Poppins,sans-serif;max-width:500px;margin:50px auto;padding:25px;background:#fefefe;border-radius:12px;box-shadow:0 0 10px rgba(0,0,0,0.1);">
      <h2 style="text-align:center;color:#2E86C1;">🩺 Prescription Details</h2>
      <p><strong>Patient Name:</strong> ${prescription.name}</p>
      <p><strong>Age:</strong> ${prescription.age}</p>
      <p><strong>Diagnosis:</strong> ${prescription.diagnosis}</p>
      <p><strong>Medicines:</strong></p>
      <ul style="line-height:1.8;">${medicineList}</ul>
      <br/>
    </div>
  `);
});

app.listen(3000, () => console.log("✅ Server running on http://localhost:3000"));
