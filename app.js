// الثوابت والمتغيرات الأساسية
const ids = ['pn','pb','pf','fn','fb','ff'];
const dbKey = 'Aman_Production_DB_2026';
let loadedOrderNo = null;

const standardCapacities = { 
    fn: 136.66, 
    fb: 24.735, 
    ff: 23.198 
};

const dispenseFormulas = {
    fn: { z: 31.3, s: 16.5, name: 'علف نامي' },
    fb: { z: 28.75, s: 19.025, name: 'علف بدائي' },
    ff: { z: 34.4, s: 13.525, name: 'علف نهائي' }
};

const sections = { 
    fn: '🌾 علف نامي', 
    fb: '🌾 علف بدائي', 
    ff: '🌾 علف نهائي', 
    pn: '📦 برمكس نامي', 
    pb: '📦 برمكس بدائي', 
    pf: '📦 برمكس نهائي' 
};

// وظائف التنقل الأساسية
function switchMainTab(tabId) {
    document.querySelectorAll('.main-tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.getElementById('btn_' + tabId).classList.add('active');
}

function switchProdTab() {
    let selectedId = document.getElementById('prodSelector').value;
    document.querySelectorAll('.prod-sec').forEach(t => t.style.display = 'none');
    document.getElementById('sec_' + selectedId).style.display = 'block';
}

// بناء الجداول الديناميكية
function buildProductionTables() {
    const container = document.getElementById('tablesContainer');
    
    Object.keys(sections).forEach(id => {
        const displayStyle = (id === 'fn') ? 'block' : 'none';
        const feedClass = id.startsWith('f') ? 'feed-h' : '';
        
        const div = document.createElement('div');
        div.id = `sec_${id}`;
        div.className = 'prod-sec';
        div.style.display = displayStyle;
        
        div.innerHTML = `
            <div class="section-h ${feedClass}">
                <div>
                    <span>${sections[id]}</span>
                    <span class="time-wrapper">
                        <span>من:</span> <input type="time" id="from_${id}" onchange="updateInfo()">
                        <span>إلى:</span> <input type="time" id="to_${id}" onchange="updateInfo()">
                        <span>⏱️ الوقت:</span> <span id="vhrs_${id}" class="calc-hrs-span">0.00</span> ساعة
                    </span>
                </div>
                <div>
                    <button class="btn" style="background:white; color:black; width:auto; display:inline-block; padding:4px 10px; font-size:12px;" onclick="printSingle('${id}')">🖨️ تحليل كلفة وصنف</button>
                    <input type="file" id="fileImp_${id}" accept=".txt,.csv,image/*" style="display:none;" onchange="handleImport(event, '${id}')">
                    <button class="btn" style="background:#ff9800; color:white; width:auto; display:inline-block; padding:4px 10px; font-size:12px;" onclick="document.getElementById('fileImp_${id}').click()">📁 استيراد (نص/صورة)</button>
                    <button class="btn" style="background:white; color:black; width:auto; display:inline-block; padding:4px 10px; font-size:12px;" onclick="addR('${id}')">+ إضافة مادة</button>
                </div>
            </div>
            <table id="tbl_${id}">
                <thead><tr><th style="width:35%">المادة الخام (الأمانات تحتسب 5%)</th><th>الكمية (كجم)</th><th>سعر الكيلو ($)</th><th>% النسب</th><th>إجمالي القيمة المحتسبة ($)</th><th style="width:40px">❌</th></tr></thead>
                <tbody id="b_${id}"></tbody>
                <tfoot>
                    <tr class="total-row">
                        <td>الإجمالي</td>
                        <td><span id="q_${id}">0</span> طن</td>
                        <td>معدل السعر/الطن خامات: <span id="avg_p_${id}">0</span> $</td>
                        <td id="pct_${id}">100%</td>
                        <td id="v_${id}">0</td>
                        <td></td>
                    </tr>
                </tfoot>
            </table>
        `;
        
        container.appendChild(div);
    });
}

// الحسابات الأساسية
function getTimeDiffInHours(fromId, toId) {
    const fromVal = document.getElementById(fromId).value;
    const toVal = document.getElementById(toId).value;
    if (!fromVal || !toVal) return 0;
    
    const [fH, fM] = fromVal.split(':').map(Number);
    const [tH, tM] = toVal.split(':').map(Number);
    let diffInMinutes = (tH * 60 + tM) - (fH * 60 + fM);
    if (diffInMinutes < 0) diffInMinutes += 24 * 60;
    
    return diffInMinutes / 60;
}

function updateInfo() {
    const no = document.getElementById('orderNo').value;
    const dt = document.getElementById('orderDate').value;
    let totalHrs = 0;
    
    ids.forEach(id => {
        let itemHrs = getTimeDiffInHours('from_' + id, 'to_' + id);
        document.getElementById('vhrs_' + id).innerText = itemHrs.toFixed(2);
        totalHrs += itemHrs;
    });
    
    document.querySelectorAll('.val-no').forEach(el => el.innerText = no || "-");
    document.querySelectorAll('.val-date').forEach(el => el.innerText = dt || "-");
    document.getElementById('resTime').innerText = totalHrs.toFixed(2);
    document.querySelector('.val-hours').innerText = totalHrs.toFixed(2);
    doCalc();
}

function addR(id, d = {m: '', q: '', p: ''}) {
    const b = document.getElementById('b_' + id);
    const r = b.insertRow();
    r.innerHTML = `
        <td><input type="text" class="m" value="${d.m}" oninput="doCalc()"></td>
        <td><input type="number" class="q" value="${d.q}" oninput="doCalc()"></td>
        <td><input type="number" class="p" value="${d.p}" oninput="doCalc()"></td>
        <td class="pct">0%</td>
        <td class="v">0</td>
        <td><button class="del-btn" onclick="this.parentElement.parentElement.remove(); doCalc();">×</button></td>
    `;
    doCalc();
}

function addDispenseRow(c = '', t = 'fn', q = '') {
    const b = document.getElementById('b_dispense');
    const r = b.insertRow();
    r.innerHTML = `
        <td><input type="text" class="d-customer" value="${c}" placeholder="اسم العميل" oninput="doCalc()"></td>
        <td>
            <select class="d-feedType" onchange="doCalc()">
                <option value="fn" ${t === 'fn' ? 'selected' : ''}>علف نامي</option>
                <option value="fb" ${t === 'fb' ? 'selected' : ''}>علف بدائي</option>
                <option value="ff" ${t === 'ff' ? 'selected' : ''}>علف نهائي</option>
            </select>
        </td>
        <td><input type="number" class="d-qty" value="${q}" placeholder="كمية الصرف" oninput="doCalc()"></td>
        <td class="d-z-val" style="font-weight:bold; color:var(--s-color)">0.00</td>
        <td class="d-s-val" style="font-weight:bold; color:var(--orange)">0.00</td>
        <td><button class="del-btn" onclick="this.parentElement.parentElement.remove(); doCalc();">×</button></td>
    `;
    doCalc();
}

function doCalc() {
    let totalTonAll = 0, totalValueAll = 0, feedTotalTons = 0;
    let actualProduction = { fn: 0, fb: 0, ff: 0 };
    
    ids.forEach(id => {
        let sumQ_KG_Raw = 0;
        let sumV = 0;
        const bBody = document.getElementById('b_' + id);
        const rows = bBody.rows;
        
        for (let r of rows) {
            const mInput = r.cells[0].querySelector('input');
            const qInput = r.cells[1].querySelector('input');
            const pInput = r.cells[2].querySelector('input');
            
            if (!mInput || !qInput || !pInput) continue;
            
            let q = parseFloat(qInput.value) || 0;
            let p = parseFloat(pInput.value) || 0;
            let v = q * p;
            
            sumQ_KG_Raw += q;
            sumV += v;
            
            r.cells[3].innerHTML = (sumQ_KG_Raw > 0) ? ((q / sumQ_KG_Raw) * 100).toFixed(2) + '%' : '0%';
            r.cells[4].innerHTML = v.toFixed(2);
        }
        
        let tonAmount = sumQ_KG_Raw / 1000;
        totalTonAll += tonAmount;
        totalValueAll += sumV;
        
        if (id.startsWith('f')) {
            feedTotalTons += tonAmount;
            if (id === 'fn') actualProduction.fn = tonAmount;
            if (id === 'fb') actualProduction.fb = tonAmount;
            if (id === 'ff') actualProduction.ff = tonAmount;
        }
        
        document.getElementById('q_' + id).innerText = tonAmount.toFixed(3);
        document.getElementById('avg_p_' + id).innerText = (sumQ_KG_Raw > 0) ? (sumV / (sumQ_KG_Raw / 1000)).toFixed(2) : '0';
        document.getElementById('pct_' + id).innerText = '100%';
        document.getElementById('v_' + id).innerText = sumV.toFixed(2);
    });
    
    // حساب الصرفيات
    const dispenseBody = document.getElementById('b_dispense');
    let totDispenseQty = 0, totDispenseZ = 0, totDispenseS = 0;
    
    for (let i = 0; i < dispenseBody.rows.length; i++) {
        const row = dispenseBody.rows[i];
        const feedType = row.cells[1].querySelector('select').value;
        const qty = parseFloat(row.cells[2].querySelector('input').value) || 0;
        
        const formula = dispenseFormulas[feedType];
        if (formula) {
            const z = qty * formula.z;
            const s = qty * formula.s;
            
            row.cells[3].innerHTML = z.toFixed(2);
            row.cells[4].innerHTML = s.toFixed(2);
            
            totDispenseQty += qty;
            totDispenseZ += z;
            totDispenseS += s;
        }
    }
    
    document.getElementById('tot_d_qty').innerText = totDispenseQty.toFixed(0);
    document.getElementById('tot_d_z').innerText = totDispenseZ.toFixed(2);
    document.getElementById('tot_d_s').innerText = totDispenseS.toFixed(2);
    
    // تحديث ملخص الإنتاج
    document.getElementById('resQ').innerText = totalTonAll.toFixed(3);
    document.getElementById('resV').innerText = totalValueAll.toFixed(2);
    
    // حساب التكاليف اليومية
    const fixedCost = parseFloat(document.getElementById('fixedVariableCost').value) || 0;
    const isProductive = document.getElementById('isProductiveDay').checked;
    const dailyCost = isProductive ? (feedTotalTons * fixedCost) : 0;
    
    document.getElementById('dailyCostDisplay').innerText = dailyCost.toFixed(2);
    document.getElementById('feedTotalTonsDisplay').innerText = feedTotalTons.toFixed(3);
    
    // تحديث مطابقة المخازن
    document.getElementById('s_fn').innerText = actualProduction.fn.toFixed(3);
    document.getElementById('s_fb').innerText = actualProduction.fb.toFixed(3);
    document.getElementById('s_ff').innerText = actualProduction.ff.toFixed(3);
    
    // حساب الفوارق
    ['fn', 'fb', 'ff'].forEach(id => {
        const actual = parseFloat(document.getElementById('s_' + id).innerText) || 0;
        const input = parseFloat(document.getElementById('i_' + id).value) || 0;
        const diff = actual - input;
        document.getElementById('d_' + id).innerText = diff.toFixed(3);
    });
}

// التعامل مع الاستيراد من الملفات
function handleImport(event, id) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type.startsWith('image/')) {
        // استخدام Tesseract لاستخراج النص من الصور
        Tesseract.recognize(file, 'ara').then(({ data: { text } }) => {
            parseImportedData(text, id);
        });
    } else {
        const reader = new FileReader();
        reader.onload = (e) => {
            parseImportedData(e.target.result, id);
        };
        reader.readAsText(file);
    }
}

function parseImportedData(text, id) {
    const lines = text.split('\n');
    const tbody = document.getElementById('b_' + id);
    tbody.innerHTML = '';
    
    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length >= 3) {
            addR(id, {
                m: parts[0].trim(),
                q: parts[1].trim(),
                p: parts[2].trim()
            });
        }
    });
    
    doCalc();
}

// التقارير والطباعة
function printViaIframe(title, htmlContent, fromDate = null, toDate = null) {
    let oldFrame = document.getElementById('print_iframe');
    if (oldFrame) oldFrame.remove();
    
    let iframe = document.createElement('iframe');
    iframe.id = 'print_iframe';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    let dateHtml = '';
    let mainDate = document.getElementById('orderDate').value;
    
    if (fromDate && toDate && fromDate !== toDate) {
        dateHtml = `<div style="background: #f9f9f9; border: 1px solid #ccc; padding: 8px; margin-top: 10px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #333;">عن الفترة من: <strong>${fromDate}</strong> إلى <strong>${toDate}</strong></p>
        </div>`;
    } else if (mainDate) {
        dateHtml = `<div style="background: #f9f9f9; border: 1px solid #ccc; padding: 8px; margin-top: 10px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #333;">تاريخ السند: <strong>${mainDate}</strong></p>
        </div>`;
    }
    
    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html lang="ar" dir="rtl">
        <head>
            <style>
                @media print {
                    @page { margin: 10mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
                body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; padding: 15px; direction: rtl; background: #fff; color: #000; }
                .main-header { text-align: center; border-bottom: 3px double #000; margin-bottom: 20px; padding-bottom: 10px; }
                .main-header h2 { margin: 0 0 5px 0; font-size: 22px; color: #111; }
                .main-header p { margin: 0; font-size: 14px; font-weight: bold; color: #444; }
                table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; table-layout: fixed; }
                th, td { border: 1px solid #333; padding: 6px; text-align: center; word-wrap: break-word; }
                th { background-color: #eaeaea !important; color: #000; font-weight: bold; }
                .report-footer { width: 100%; margin-top: 50px; page-break-inside: avoid; }
                .footer-cols { display: flex; justify-content: space-between; align-items: flex-start; text-align: center; }
                .footer-sig { width: 30%; font-size: 13px; font-weight: bold; line-height: 1.6; border-top: 1px solid #000; padding-top: 8px; }
                input, button, select, .no-print, .del-btn { display: none !important; }
            </style>
        </head>
        <body>
            <div class="main-header">
                <h2>شركة أمان للموارد الزراعية وإنتاج الأعلاف</h2>
                <p>قسم التكاليف والمخزون ورقابة الطاقة</p>
                <h3 style="text-decoration:underline; margin-top:15px; font-size:16px; color:#222;">${title}</h3>
                ${dateHtml}
            </div>
            <div>${htmlContent}</div>
            <div class="report-footer">
                <div class="footer-cols">
                    <div class="footer-sig">تحت إشراف المدير المالي<br><br>( شرف عكارس )</div>
                    <div class="footer-sig">مراجعة وتدقيق الرقابة<br><br>( نجدي البهلولي )</div>
                    <div class="footer-sig">إعداد وإصدار المحاسب<br><br>( رضوان السقاف )</div>
                </div>
            </div>
        </body>
        </html>
    `);
    doc.close();
    
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 500);
}

function printSingle(id) {
    let htmlContent = document.getElementById('tbl_' + id).outerHTML;
    printViaIframe(`تقرير تفصيلي - ${sections[id]}`, htmlContent);
}

function printAuditReport() {
    let htmlContent = document.getElementById('tbl_audit').outerHTML;
    printViaIframe('تقرير مطابقة المخازن والرقابة', htmlContent);
}

function printDispenseReport() {
    let htmlContent = document.getElementById('tbl_dispense').outerHTML;
    printViaIframe('تقرير صرف الأعلاف والعملاء', htmlContent);
}

// حفظ البيانات
function doSave() {
    const orderNo = document.getElementById('orderNo').value;
    const orderDate = document.getElementById('orderDate').value;
    
    if (!orderNo || !orderDate) {
        alert('يرجى ملء رقم السند والتاريخ');
        return;
    }
    
    const data = {
        no: orderNo,
        date: orderDate,
        production: {}
    };
    
    ids.forEach(id => {
        data.production[id] = {
            qty: document.getElementById('q_' + id).innerText,
            value: document.getElementById('v_' + id).innerText
        };
    });
    
    let db = JSON.parse(localStorage.getItem(dbKey) || '[]');
    db.push(data);
    localStorage.setItem(dbKey, JSON.stringify(db));
    
    // تحديث الأرشيف
    loadArchive();
    
    alert('تم حفظ السند بنجاح برقم: ' + orderNo);
    document.getElementById('currentStatusLabel').innerText = 'محفوظ ✓';
}

function loadArchive() {
    let db = JSON.parse(localStorage.getItem(dbKey) || '[]');
    const tbody = document.getElementById('archived_orders_body');
    tbody.innerHTML = '';
    
    db.forEach((record, idx) => {
        const row = tbody.insertRow();
        let totalTons = 0, totalValue = 0, totalHours = 0;
        
        Object.keys(record.production).forEach(id => {
            totalTons += parseFloat(record.production[id].qty) || 0;
            totalValue += parseFloat(record.production[id].value) || 0;
        });
        
        row.innerHTML = `
            <td>${record.no}</td>
            <td>${record.date}</td>
            <td>${totalTons.toFixed(3)}</td>
            <td>${totalValue.toFixed(2)}</td>
            <td>-</td>
            <td>
                <button class="btn" style="background:#673ab7; padding:2px 5px; font-size:10px;" onclick="editArchive(${idx})">تحرير</button>
                <button class="btn" style="background:#d32f2f; padding:2px 5px; font-size:10px;" onclick="deleteArchive(${idx})">حذف</button>
            </td>
        `;
    });
}

function deleteArchive(idx) {
    if (confirm('هل تريد حذف هذا السند؟')) {
        let db = JSON.parse(localStorage.getItem(dbKey) || '[]');
        db.splice(idx, 1);
        localStorage.setItem(dbKey, JSON.stringify(db));
        loadArchive();
    }
}

// وظائف التقارير الإضافية
function openFinancialAnalysisModal() {
    document.getElementById('modal_box').style.display = 'block';
    document.getElementById('modal_title').innerText = '📊 سجل التحليل المالي';
    let db = JSON.parse(localStorage.getItem(dbKey) || '[]');
    let html = '<table style="width:100%; border-collapse: collapse;"><thead><tr><th>السند</th><th>التاريخ</th><th>الإجمالي ($)</th></tr></thead><tbody>';
    
    db.forEach(record => {
        let total = 0;
        Object.keys(record.production).forEach(id => {
            total += parseFloat(record.production[id].value) || 0;
        });
        html += `<tr><td>${record.no}</td><td>${record.date}</td><td>${total.toFixed(2)}</td></tr>`;
    });
    
    html += '</tbody></table>';
    document.getElementById('modal_body').innerHTML = html;
}

function handleComprehensiveReport() {
    document.getElementById('modal_comp_report').style.display = 'block';
}

function handleProductionReport() {
    document.getElementById('modal_prod_report').style.display = 'block';
}

function handleMaterialsReport() {
    document.getElementById('modal_mat_report').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function printModalOnly() {
    const printArea = document.getElementById('modal_print_area');
    const oldFrame = document.getElementById('print_iframe');
    if (oldFrame) oldFrame.remove();
    
    let iframe = document.createElement('iframe');
    iframe.id = 'print_iframe';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(printArea.innerHTML);
    doc.close();
    
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 500);
}

function printFreeModeComprehensive() {
    alert('سيتم إنشاء التقرير الشامل وفقاً للخيارات المحددة');
}

function printFreeModeProduction() {
    alert('سيتم إنشاء تقرير الإنتاج وفقاً للخيارات المحددة');
}

function printFreeModeMaterials() {
    alert('سيتم إنشاء تقرير نسب المواد وفقاً للخيارات المحددة');
}

// تهيئة التطبيق عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    buildProductionTables();
    loadArchive();
    doCalc();
});
