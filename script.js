function calculateDose() {
  const weight = parseFloat(document.getElementById("weight").value);
  const age = parseFloat(document.getElementById("age").value);
  const scr = parseFloat(document.getElementById("scr").value);
  const sex = document.getElementById("sex").value;
  const liver = parseFloat(document.getElementById("liver").value);

  if (isNaN(weight) || isNaN(age) || isNaN(scr) || isNaN(liver)) {
    alert("กรุณากรอกข้อมูลให้ครบ");
    return;
  }

  // คำนวณ CrCl ตามสูตร Cockcroft-Gault
  let CrCl = ((140 - age) * weight) / (72 * scr);
  if (sex === "female") CrCl *= 0.85;

  let result = `<h3>ขนาดยาที่แนะนำ:</h3>`;
  const INH = Math.min(weight * 5, 300);
  const RIF = Math.min(weight * 10, 600);
  const PZA = Math.min(weight * 25, 2000);
  const EMB = Math.min(weight * 15, 1600);

  result += `
    <p>Isoniazid (INH): <strong>${INH.toFixed(0)} mg</strong></p>
    <p>Rifampicin (RIF): <strong>${RIF.toFixed(0)} mg</strong></p>
    <p>Pyrazinamide (PZA): <strong>${PZA.toFixed(0)} mg</strong></p>
    <p>Ethambutol (EMB): <strong>${EMB.toFixed(0)} mg</strong></p>
    <p><strong>CrCl:</strong> ${CrCl.toFixed(1)} ml/min</p>
  `;

  if (CrCl <= 30) {
    result += `<p class="alert">⚠️ ผู้ป่วยไตบกพร่อง (CrCl ≤ 30): ปรับ PZA และ EMB ให้ใช้ 3 ครั้ง/สัปดาห์</p>`;
  }

  if (liver >= 3 && liver < 5) {
    result += `<p class="alert">⚠️ ตับบกพร่องระดับปานกลาง (AST/ALT ≥ 3 เท่า): พิจารณาลด INH หรือ PZA</p>`;
  } else if (liver >= 5) {
    result += `<p class="alert">❌ ตับบกพร่องรุนแรง (AST/ALT ≥ 5 เท่า): หลีกเลี่ยง INH, RIF, และ PZA</p>`;
  }

  document.getElementById("result").innerHTML = result;
}
