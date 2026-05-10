// js/exchange.js
window.initExchange = function() {
    const html = `
    <div id="exchange-content">
        <div class="exchange-card" id="exchangeCard">
            <h2>💱 114.ae 汇率换算器</h2>
            <label>选择汇率源</label>
            <select id="api">
                <option value="opener">Open ER API</option>
                <option value="exchangerateapi">ExchangeRate-API</option>
            </select>
            <label>金额</label>
            <input id="amount" type="number" value="1000">
            <div class="quick-btns" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:15px 0;">
                <button onclick="setAmount(100)">100</button>
                <button onclick="setAmount(500)">500</button>
                <button onclick="setAmount(1000)">1000</button>
                <button onclick="setAmount(5000)">5000</button>
            </div>
            <label>从 / 到</label>
            <div style="display:flex;gap:10px;">
                <select id="from" style="flex:1;"></select>
                <select id="to" style="flex:1;"></select>
            </div>
            <button class="btn btn-p" onclick="calc()" style="width:100%;margin:15px 0;">立即换算</button>
            <div class="result" id="result">0</div>
            <div class="source" id="source"></div>
        </div>
    </div>`;

    document.getElementById('contentContainer').innerHTML = html;
    initExchangeChart();
};

window.setAmount = function(v) {
    document.getElementById("amount").value = v;
    window.calc();
};

window.calc = async function() {
    const amount = document.getElementById("amount").value;
    const from = document.getElementById("from").value || "AED";
    const to = document.getElementById("to").value || "CNY";
    try {
        const res = await fetch(`https://exapi.114.ae/convert?from=${from}&to=${to}&amount=${amount}`);
        const d = await res.json();
        document.getElementById("result").innerText = d.result || "0";
        document.getElementById("source").innerText = `来源：${d.source || '实时汇率'}`;
    } catch(e) {
        document.getElementById("result").innerText = "Error";
    }
};

function initExchangeChart() {
    ["AED","CNY","USD","RUB","EUR"].forEach(c => {
        document.getElementById("from").innerHTML += `<option>${c}</option>`;
        document.getElementById("to").innerHTML += `<option>${c}</option>`;
    });
    document.getElementById("from").value = "AED";
    document.getElementById("to").value = "CNY";
    setTimeout(() => window.calc(), 300);
}
