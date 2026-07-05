/* ================================================================
   main.js — Frontend logic for Kisan Salahkar (Full Featured)
   Features: Auth, Crop, Weather, Mandi, Disease, Schemes, Soil,
             Forum, Alerts, Voice Input/TTS
   ================================================================ */

// ── Helpers ──────────────────────────────────────────────────────
function toast(msg, type = "info") {
    const box = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 4500);
}

async function api(url, options = {}) {
    const res = await fetch(url, options);
    const data = await res.json();
    if (!res.ok || data.success === false) throw new Error(data.error || "Request failed");
    return data;
}

function t(key) { return LangManager.t(key); }

// ── Navbar toggle (mobile) ──────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    if (toggle && links) {
        toggle.addEventListener("click", () => links.classList.toggle("open"));
    }

    // More-dropdown click for mobile (hover doesn't work on touch)
    const dropBtn = document.querySelector(".nav-dropdown-toggle");
    const dropMenu = document.querySelector(".nav-dropdown-menu");
    if (dropBtn && dropMenu) {
        dropBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            dropMenu.classList.toggle("show");
            dropBtn.classList.toggle("active");
        });
        document.addEventListener("click", () => {
            dropMenu.classList.remove("show");
            dropBtn.classList.remove("active");
        });
    }

    LangManager.init();
});

// ================================================================
//  VOICE INPUT & TEXT-TO-SPEECH (Feature 4)
// ================================================================
let recognition = null;
function initSpeechRecognition() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return null;
    recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = LangManager.current === "hi" ? "hi-IN" : "en-IN";
    return recognition;
}

function startVoiceInput() {
    const sr = initSpeechRecognition();
    if (!sr) { toast("Voice input not supported in this browser", "error"); return; }
    const btn = document.getElementById("voiceBtn");
    if (btn) btn.classList.add("listening");
    sr.onresult = (e) => {
        const text = e.results[0][0].transcript;
        const result = document.getElementById("voiceResult");
        if (result) { result.style.display = "block"; result.textContent = `🎤 "${text}"`; }
        processVoiceCommand(text);
    };
    sr.onerror = () => { if (btn) btn.classList.remove("listening"); toast(t("voiceError") || "Voice error", "error"); };
    sr.onend = () => { if (btn) btn.classList.remove("listening"); };
    sr.start();
}

function processVoiceCommand(text) {
    const t = text.toLowerCase();
    if (t.includes("crop") || t.includes("फसल")) location.href = "/crop";
    else if (t.includes("weather") || t.includes("mausam") || t.includes("मौसम")) location.href = "/weather";
    else if (t.includes("mandi") || t.includes("price") || t.includes("भाव") || t.includes("मंडी")) location.href = "/mandi";
    else if (t.includes("disease") || t.includes("rog") || t.includes("रोग")) location.href = "/disease";
    else if (t.includes("scheme") || t.includes("yojana") || t.includes("योजना")) location.href = "/schemes";
    else if (t.includes("soil") || t.includes("mitti") || t.includes("मिट्टी")) location.href = "/soil";
    else if (t.includes("forum") || t.includes("community") || t.includes("समुदाय")) location.href = "/forum";
    else toast(`"${text}" — ${LangManager.t("voiceNotUnderstood") || "Try: crop, weather, mandi, disease, scheme"}`, "info");
}

function voiceFillCropForm() {
    const sr = initSpeechRecognition();
    if (!sr) { toast("Voice not supported", "error"); return; }
    toast(LangManager.t("voiceListening") || "Listening... say values like 'Nitrogen 90, Phosphorus 45'", "info");
    sr.onresult = (e) => {
        const text = e.results[0][0].transcript.toLowerCase();
        const nums = text.match(/\d+\.?\d*/g);
        if (nums && nums.length >= 4) {
            const fields = ["nitrogen", "phosphorus", "potassium", "ph", "temperature", "humidity", "rainfall"];
            nums.forEach((n, i) => { if (fields[i]) { const el = document.getElementById(fields[i]); if (el) el.value = n; } });
            toast(LangManager.t("voiceFilled") || "Values filled from voice!", "success");
        } else {
            toast(LangManager.t("voiceRetry") || "Please say at least 4 numbers", "info");
        }
    };
    sr.start();
}

function voiceDiseaseInput() {
    const sr = initSpeechRecognition();
    if (!sr) { toast("Voice not supported", "error"); return; }
    toast("Listening... describe the symptoms", "info");
    sr.onresult = (e) => {
        document.getElementById("diseaseSymptoms").value = e.results[0][0].transcript;
        toast("Symptoms recorded!", "success");
    };
    sr.start();
}

function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LangManager.current === "hi" ? "hi-IN" : "en-IN";
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
}

// ================================================================
//  AUTH — Login & Signup
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".auth-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
            tab.classList.add("active");
            const target = tab.dataset.tab === "login" ? "loginForm" : "signupForm";
            document.getElementById(target)?.classList.add("active");
        });
    });

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async e => {
            e.preventDefault();
            try {
                await api("/api/login", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: document.getElementById("loginUsername").value.trim(),
                        password: document.getElementById("loginPassword").value,
                    }),
                });
                toast(t("loginOk"), "success");
                setTimeout(() => (location.href = "/dashboard"), 600);
            } catch (err) { toast(err.message, "error"); }
        });
    }

    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async e => {
            e.preventDefault();
            try {
                await api("/api/signup", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: document.getElementById("signupName").value.trim(),
                        username: document.getElementById("signupUsername").value.trim(),
                        password: document.getElementById("signupPassword").value,
                        phone: document.getElementById("signupPhone")?.value.trim() || "",
                        state: document.getElementById("signupState")?.value || "",
                        location: document.getElementById("signupCity")?.value.trim() || "",
                    }),
                });
                toast(t("signupOk"), "success");
                setTimeout(() => (location.href = "/dashboard"), 600);
            } catch (err) { toast(err.message, "error"); }
        });
    }
});

// ================================================================
//  CROP PREDICTION
// ================================================================
let cropChart = null;
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("cropForm");
    if (!form) return;

    // Auto-select state from user's saved location
    const stateEl = document.getElementById("stateSelect");
    const districtEl = document.getElementById("districtSelect");

    const setDistrictOptions = (districts = []) => {
        if (!districtEl) return;
        districtEl.innerHTML = `<option value="">-- Select District (Optional) --</option>`;
        districts.forEach(d => {
            const opt = document.createElement("option");
            opt.value = d;
            opt.textContent = d;
            districtEl.appendChild(opt);
        });
        districtEl.disabled = districts.length === 0;
    };

    const loadDistricts = async (state) => {
        if (!districtEl) return;
        if (!state) {
            setDistrictOptions([]);
            return;
        }

        try {
            const data = await api(`/api/state-districts?state=${encodeURIComponent(state)}`);
            setDistrictOptions(data.districts || []);
        } catch (_) {
            setDistrictOptions([]);
        }
    };

    if (stateEl && window.USER_DEFAULTS?.state) {
        stateEl.value = window.USER_DEFAULTS.state;
    }

    if (stateEl) {
        loadDistricts(stateEl.value || "");
        stateEl.addEventListener("change", () => {
            loadDistricts(stateEl.value || "");
        });
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const btn = document.getElementById("predictBtn");
        btn.disabled = true;
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${t("predicting")}`;

        const payload = {
            N: document.getElementById("nitrogen").value,
            P: document.getElementById("phosphorus").value,
            K: document.getElementById("potassium").value,
            temperature: document.getElementById("temperature").value,
            humidity: document.getElementById("humidity").value,
            pH: document.getElementById("ph").value,
            rainfall: document.getElementById("rainfall").value,
            state: document.getElementById("stateSelect")?.value || "",
            district: document.getElementById("districtSelect")?.value || "",
        };

        try {
            const data = await api("/api/predict", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            renderCropResults(data.predictions);
            toast(t("predReady"), "success");
        } catch (err) { toast(err.message, "error"); }
        finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass-chart"></i> ${t("btnPredict")}`;
        }
    });
});

function renderCropResults(predictions) {
    const card = document.getElementById("resultCard");
    card.style.display = "block";
    card.scrollIntoView({ behavior: "smooth", block: "start" });

    const top = predictions[0];
    document.getElementById("topCrop").innerHTML = `
        <div class="crop-name"><i class="fa-solid fa-crown" style="color:#f39c12"></i> ${top.crop}</div>
        <div class="crop-conf">${top.confidence}% confidence</div>
    `;

    const barsEl = document.getElementById("cropBars");
    barsEl.innerHTML = predictions.map(p => `
        <div class="crop-bar-item">
            <div class="crop-bar-label"><span>${p.crop}</span><span>${p.confidence}%</span></div>
            <div class="crop-bar-track"><div class="crop-bar-fill" style="width:${p.confidence}%"></div></div>
        </div>
    `).join("");

    const ctx = document.getElementById("cropChart").getContext("2d");
    if (cropChart) cropChart.destroy();
    cropChart = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: predictions.map(p => p.crop),
            datasets: [{ data: predictions.map(p => p.confidence),
                backgroundColor: ["#27ae60", "#2ecc71", "#3498db", "#f39c12", "#e74c3c"], borderWidth: 2, borderColor: "#fff" }],
        },
        options: { responsive: true, plugins: { legend: { position: "bottom", labels: { padding: 16, font: { family: "Poppins", size: 13 } } } } },
    });

    // Tip
    const tipEl = document.getElementById("cropTip");
    const tipText = LangManager.current === "hi" && top.tip_hi ? top.tip_hi : top.tip;
    if (tipText) { tipEl.innerHTML = `<i class="fa-solid fa-lightbulb"></i> <strong>${t("growingTip")}:</strong> ${tipText}`; tipEl.style.display = "block"; }

    // Diseases
    if (top.diseases && top.diseases.length) {
        const dEl = document.getElementById("cropDiseases");
        dEl.style.display = "block";
        document.getElementById("diseaseList").innerHTML = top.diseases.map(d =>
            `<span class="disease-tag"><i class="fa-solid fa-virus"></i> ${d}</span>`
        ).join(" ");
    }

    // MSP
    if (top.msp) {
        const mEl = document.getElementById("cropMSP");
        mEl.style.display = "block";
        mEl.innerHTML = `<i class="fa-solid fa-rupee-sign"></i> <strong>MSP:</strong> ₹${top.msp}/quintal`;
    }

    // TTS button
    const speakBtn = document.getElementById("speakResult");
    if (speakBtn) {
        speakBtn.onclick = () => {
            const lang = LangManager.current;
            const text = lang === "hi"
                ? `सबसे अच्छी फसल ${top.crop} है, ${top.confidence} प्रतिशत विश्वास के साथ। ${top.tip_hi || ""}`
                : `Best crop is ${top.crop} with ${top.confidence}% confidence. ${top.tip}`;
            speakText(text);
        };
    }
}

// ================================================================
//  WEATHER
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("weatherForm");
    if (!form) return;

    // Auto-fill city from user's saved location
    const cityInput = document.getElementById("cityInput");
    if (cityInput && window.USER_DEFAULTS?.location) {
        cityInput.value = window.USER_DEFAULTS.location;
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const city = document.getElementById("cityInput").value.trim();
        if (!city) return toast(t("enterCity"), "error");

        const btn = document.getElementById("weatherBtn");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        document.getElementById("weatherLoading").style.display = "block";
        document.getElementById("weatherResult").style.display = "none";

        try {
            const data = await api(`/api/weather?city=${encodeURIComponent(city)}`);
            renderWeather(data);
        } catch (err) { toast(err.message, "error"); }
        finally {
            btn.disabled = false;
            btn.innerHTML = `<i class="fa-solid fa-magnifying-glass"></i> ${t("btnSearch")}`;
            document.getElementById("weatherLoading").style.display = "none";
        }
    });
});

function weatherIcon(desc) {
    const d = desc.toLowerCase();
    if (d.includes("sun") || d.includes("clear")) return "fa-sun";
    if (d.includes("cloud") && d.includes("part")) return "fa-cloud-sun";
    if (d.includes("cloud")) return "fa-cloud";
    if (d.includes("rain")) return "fa-cloud-rain";
    if (d.includes("thunder")) return "fa-bolt";
    if (d.includes("snow")) return "fa-snowflake";
    if (d.includes("fog") || d.includes("mist")) return "fa-smog";
    return "fa-cloud-sun";
}

function renderWeather(data) {
    const c = data.current;
    document.getElementById("weatherResult").style.display = "block";
    document.getElementById("weatherIcon").innerHTML = `<i class="fa-solid ${weatherIcon(c.desc)}"></i>`;
    document.getElementById("tempVal").textContent = `${c.temp}°C`;
    document.getElementById("weatherDesc").textContent = `${c.desc} — ${data.city}`;
    document.getElementById("feelsLike").textContent = `${c.feelsLike}°C`;
    document.getElementById("humidityVal").textContent = `${c.humidity}%`;
    document.getElementById("windVal").textContent = `${c.windSpeed} km/h ${c.windDir}`;
    document.getElementById("visVal").textContent = `${c.visibility} km`;
    document.getElementById("pressureVal").textContent = `${c.pressure} mb`;
    document.getElementById("uvVal").textContent = c.uv;

    // Advisory
    const advEl = document.getElementById("weatherAdvisory");
    if (advEl && data.advisory && data.advisory.length) {
        advEl.style.display = "block";
        advEl.innerHTML = data.advisory.map(a => `<div class="advisory-item"><i class="fa-solid fa-triangle-exclamation"></i> ${a}</div>`).join("");
    }

    const grid = document.getElementById("forecastGrid");
    grid.innerHTML = data.forecast.map(f => `
        <div class="forecast-card">
            <div class="fc-date">${f.date}</div>
            <div class="fc-icon"><i class="fa-solid ${weatherIcon(f.desc)}"></i></div>
            <div class="fc-temp">${f.minTemp}° — ${f.maxTemp}°C</div>
            <div class="fc-desc">${f.desc}</div>
            <div class="fc-hum"><i class="fa-solid fa-droplet"></i> ${f.humidity}%</div>
        </div>
    `).join("");

    document.getElementById("weatherResult").scrollIntoView({ behavior: "smooth" });
}

// ================================================================
//  MANDI PRICES (Feature 6) — Live from data.gov.in Agmarknet
//  Drill-down: State → District → Market → Crop
//  Features: Auto-location, Favorites, Price comparison
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("mandiForm");
    if (!form) return;

    // ── Initialize ──
    loadMandiOverview();
    loadMandiFavorites();

    // ── State → District cascade ──
    const stateEl    = document.getElementById("mandiState");
    const districtEl = document.getElementById("mandiDistrict");
    const marketEl   = document.getElementById("mandiMarket");

    stateEl.addEventListener("change", async () => {
        const state = stateEl.value;
        // Reset dependent
        districtEl.innerHTML = `<option value="">${LangManager.t("mandiSelectDistrict") || "-- All Districts --"}</option>`;
        marketEl.innerHTML   = `<option value="">${LangManager.t("mandiSelectMarket") || "-- All Markets --"}</option>`;
        districtEl.disabled = true;
        marketEl.disabled   = true;
        if (!state) return;
        try {
            const d = await api(`/api/mandi/districts?state=${encodeURIComponent(state)}`);
            if (d.districts && d.districts.length) {
                districtEl.disabled = false;
                d.districts.forEach(dist => {
                    const opt = document.createElement("option");
                    opt.value = dist; opt.textContent = dist;
                    districtEl.appendChild(opt);
                });
            }
        } catch (e) { console.warn("Districts:", e); }
    });

    districtEl.addEventListener("change", async () => {
        const state = stateEl.value;
        const district = districtEl.value;
        marketEl.innerHTML = `<option value="">${LangManager.t("mandiSelectMarket") || "-- All Markets --"}</option>`;
        marketEl.disabled  = true;
        if (!district) return;
        try {
            const d = await api(`/api/mandi/markets?state=${encodeURIComponent(state)}&district=${encodeURIComponent(district)}`);
            if (d.markets && d.markets.length) {
                marketEl.disabled = false;
                d.markets.forEach(m => {
                    const opt = document.createElement("option");
                    opt.value = m; opt.textContent = m;
                    marketEl.appendChild(opt);
                });
            }
        } catch (e) { console.warn("Markets:", e); }
    });

    // ── Search form submit ──
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const crop     = document.getElementById("mandiCrop").value;
        const state    = stateEl.value;
        const district = districtEl.value;
        const market   = marketEl.value;
        if (!crop && !state) return toast(LangManager.t("mandiSelectHint") || "Select at least a state or crop", "error");
        document.getElementById("mandiLoading").style.display = "block";
        try {
            let url = "/api/mandi?";
            if (crop)     url += `crop=${encodeURIComponent(crop)}&`;
            if (state)    url += `state=${encodeURIComponent(state)}&`;
            if (district) url += `district=${encodeURIComponent(district)}&`;
            if (market)   url += `market=${encodeURIComponent(market)}&`;
            const data = await api(url);
            if (data.mandis) renderMandiDetail(data);
            else if (data.crops) renderMandiOverviewTable(data);
        } catch (err) { toast(err.message, "error"); }
        finally { document.getElementById("mandiLoading").style.display = "none"; }
    });

    // ── Clear button ──
    document.getElementById("mandiClearBtn")?.addEventListener("click", () => {
        stateEl.value = "";
        districtEl.innerHTML = `<option value="">${LangManager.t("mandiSelectDistrict") || "-- Select State First --"}</option>`;
        districtEl.disabled = true;
        marketEl.innerHTML  = `<option value="">${LangManager.t("mandiSelectMarket") || "-- Select District First --"}</option>`;
        marketEl.disabled = true;
        document.getElementById("mandiCrop").value = "";
        document.getElementById("mandiDetail").style.display = "none";
    });

    // ── Refresh button ──
    const refreshBtn = document.getElementById("mandiRefreshBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", async () => {
            refreshBtn.disabled = true;
            refreshBtn.querySelector("i").classList.add("fa-spin");
            try {
                await api("/api/mandi/refresh");
                await loadMandiOverview();
                document.getElementById("mandiDetail").style.display = "none";
                toast(LangManager.t("mandiRefreshed") || "Prices refreshed from data.gov.in!", "success");
            } catch (e) { toast(e.message, "error"); }
            finally {
                refreshBtn.disabled = false;
                refreshBtn.querySelector("i").classList.remove("fa-spin");
            }
        });
    }

    // ── Detect location ──
    document.getElementById("mandiDetectBtn")?.addEventListener("click", async () => {
        const btn = document.getElementById("mandiDetectBtn");
        const statusEl = document.getElementById("mandiNearbyStatus");
        const resultsEl = document.getElementById("mandiNearbyResults");
        btn.disabled = true;
        btn.querySelector("i").className = "fa-solid fa-circle-notch fa-spin";
        statusEl.innerHTML = `<span class="text-muted"><i class="fa-solid fa-circle-notch fa-spin"></i> Detecting your location…</span>`;
        resultsEl.style.display = "none";
        try {
            const data = await api("/api/mandi/nearby");
            if (data.detected_state) {
                statusEl.innerHTML = `<i class="fa-solid fa-map-marker-alt" style="color:var(--primary);"></i> <strong>${data.detected_city || ""}</strong>, ${data.detected_state}`;

                // Auto-set the state dropdown
                stateEl.value = data.detected_state;
                stateEl.dispatchEvent(new Event("change"));

                if (data.records && data.records.length) {
                    resultsEl.style.display = "block";
                    // Group by commodity
                    const grouped = {};
                    data.records.forEach(r => {
                        const key = r.commodity || "Other";
                        if (!grouped[key]) grouped[key] = [];
                        grouped[key].push(r);
                    });
                    let html = '<div class="mandi-nearby-grid">';
                    for (const [commodity, items] of Object.entries(grouped).slice(0, 12)) {
                        const avg = Math.round(items.reduce((s, i) => s + (i.modal_price || 0), 0) / items.length);
                        html += `
                        <div class="mandi-nearby-item" onclick="mandiQuickSearch('${items[0].market || ""}','${data.detected_state}','${items[0].district || ""}')">
                            <div class="mandi-nearby-commodity">${commodity}</div>
                            <div class="mandi-nearby-price">₹${avg.toLocaleString("en-IN")}/qtl</div>
                            <div class="mandi-nearby-meta">${items[0].market || ""} · ${items.length} entries</div>
                        </div>`;
                    }
                    html += '</div>';
                    resultsEl.innerHTML = html;
                } else {
                    resultsEl.style.display = "block";
                    resultsEl.innerHTML = `<span class="text-muted">${LangManager.t("mandiNearbyNone") || "No price data found for your area today."}</span>`;
                }
            } else {
                statusEl.innerHTML = `<span class="text-muted">${LangManager.t("mandiNearbyFail") || "Could not detect location. Please select state manually."}</span>`;
            }
        } catch (e) {
            statusEl.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation"></i> Location detection failed</span>`;
        } finally {
            btn.disabled = false;
            btn.querySelector("i").className = "fa-solid fa-location-dot";
        }
    });
});

// Quick search from nearby/favorites
function mandiQuickSearch(market, state, district) {
    const stateEl = document.getElementById("mandiState");
    if (state && stateEl) {
        stateEl.value = state;
        stateEl.dispatchEvent(new Event("change"));
        setTimeout(() => {
            const distEl = document.getElementById("mandiDistrict");
            if (district && distEl) { distEl.value = district; distEl.dispatchEvent(new Event("change")); }
            setTimeout(() => {
                const mktEl = document.getElementById("mandiMarket");
                if (market && mktEl) {
                    // Try to select the market option
                    for (let opt of mktEl.options) {
                        if (opt.value === market) { mktEl.value = market; break; }
                    }
                }
                document.getElementById("mandiForm").dispatchEvent(new Event("submit"));
            }, 800);
        }, 800);
    }
}

// ── Load overview table + dropdowns ──
async function loadMandiOverview() {
    try {
        const data = await api("/api/mandi");
        const select = document.getElementById("mandiCrop");
        const stateSelect = document.getElementById("mandiState");
        if (!select) return;

        // Populate crop dropdown
        while (select.options.length > 1) select.remove(1);
        data.crops.forEach(c => {
            const opt = document.createElement("option");
            opt.value = c.crop; opt.textContent = c.crop;
            select.appendChild(opt);
        });

        // Populate state dropdown
        if (stateSelect && data.states) {
            while (stateSelect.options.length > 1) stateSelect.remove(1);
            data.states.forEach(s => {
                const opt = document.createElement("option");
                opt.value = s; opt.textContent = s;
                stateSelect.appendChild(opt);
            });
        }

        // Status badge
        const badge    = document.getElementById("mandiBadge");
        const fetchedEl = document.getElementById("mandiFetchedAt");
        if (badge) {
            if (data.live) {
                badge.innerHTML = `<i class="fa-solid fa-circle" style="color:#22c55e;font-size:.55rem;vertical-align:middle;"></i> Live — data.gov.in`;
                badge.style.borderColor = "#22c55e";
            } else {
                badge.innerHTML = `<i class="fa-solid fa-circle" style="color:#f59e0b;font-size:.55rem;vertical-align:middle;"></i> Offline — cached data`;
                badge.style.borderColor = "#f59e0b";
            }
        }
        if (fetchedEl && data.fetched_at && data.fetched_at !== "offline") {
            fetchedEl.textContent = `Updated: ${data.fetched_at}`;
        } else if (fetchedEl) {
            fetchedEl.textContent = "";
        }

        renderMandiOverviewTable(data);
    } catch (e) {
        console.error("loadMandiOverview:", e);
        const badge = document.getElementById("mandiBadge");
        if (badge) {
            badge.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> API error`;
            badge.style.borderColor = "#ef4444";
        }
    }
}

function renderMandiOverviewTable(data) {
    const tbody = document.getElementById("mandiTableBody");
    if (!tbody || !data.crops) return;
    tbody.innerHTML = data.crops.map(c => {
        const diff = c.msp ? c.avg_price - c.msp : 0;
        const diffClass = diff > 0 ? "text-success" : diff < 0 ? "text-danger" : "";
        const diffIcon  = diff > 0 ? "fa-arrow-up" : diff < 0 ? "fa-arrow-down" : "fa-minus";
        const diffText  = diff !== 0 ? `${diff > 0 ? "+" : ""}₹${diff.toLocaleString("en-IN")}` : "—";
        return `
        <tr onclick="document.getElementById('mandiCrop').value='${c.crop}'; document.getElementById('mandiForm').dispatchEvent(new Event('submit'));" style="cursor:pointer;" title="Click to see ${c.crop} prices">
            <td><strong>${c.crop}</strong></td>
            <td>${c.msp ? '₹' + c.msp.toLocaleString("en-IN") : '—'}</td>
            <td class="${diffClass}"><strong>₹${c.avg_price.toLocaleString("en-IN")}</strong></td>
            <td>${c.num_mandis}</td>
            <td class="${diffClass}"><i class="fa-solid ${diffIcon}" style="font-size:.7rem;"></i> ${diffText}</td>
        </tr>`;
    }).join("");
}

// ── Render crop detail ──
function renderMandiDetail(data) {
    const detailEl = document.getElementById("mandiDetail");
    detailEl.style.display = "block";

    // Stat cards
    document.getElementById("mandiMSP").textContent = data.msp ? `₹${data.msp.toLocaleString("en-IN")}` : "N/A";
    document.getElementById("mandiAvgPrice").textContent = data.avg_price ? `₹${data.avg_price.toLocaleString("en-IN")}` : "—";
    document.getElementById("mandiMinPrice").textContent = data.min_price ? `₹${data.min_price.toLocaleString("en-IN")}` : "—";
    document.getElementById("mandiMaxPrice").textContent = data.max_price ? `₹${data.max_price.toLocaleString("en-IN")}` : "—";

    // Header
    const title = data.crop ? `${data.crop} — Mandi Prices` : "All Commodity Prices";
    document.getElementById("mandiDetailTitle").textContent = title;

    const totalEl = document.getElementById("mandiTotalRecords");
    if (totalEl) {
        totalEl.innerHTML = data.live
            ? `<i class="fa-solid fa-signal"></i> ${data.total_records} records · Agmarknet`
            : `<i class="fa-solid fa-database"></i> Offline data`;
    }

    // Price cards
    document.getElementById("mandiPrices").innerHTML = data.mandis.map(m => {
        const price = m.price || m.modal_price || 0;
        const minMax = (m.min_price && m.max_price)
            ? `<div class="mandi-card-range">₹${m.min_price.toLocaleString("en-IN")} – ₹${m.max_price.toLocaleString("en-IN")}</div>`
            : "";
        const variety = m.variety ? `<span class="mandi-card-variety"><i class="fa-solid fa-seedling"></i> ${m.variety}</span>` : "";
        const district = m.district ? `${m.district}, ` : "";
        const marketName = m.name || m.market || "—";
        const mspDiff = data.msp && price ? price - data.msp : 0;
        const mspTag  = data.msp ? (mspDiff >= 0
            ? `<span class="mandi-tag mandi-tag-green">+₹${mspDiff.toLocaleString("en-IN")} above MSP</span>`
            : `<span class="mandi-tag mandi-tag-red">₹${Math.abs(mspDiff).toLocaleString("en-IN")} below MSP</span>`)
            : "";

        return `
        <div class="mandi-price-card">
            <div class="mandi-card-top">
                <div class="mandi-card-market"><i class="fa-solid fa-store"></i> ${marketName}</div>
                <button type="button" class="mandi-fav-btn" title="Save to favorites"
                    onclick="addMandiFavorite('${m.state||""}','${m.district||""}','${marketName.replace(/'/g,"\\'")}')">
                    <i class="fa-regular fa-star"></i>
                </button>
            </div>
            <div class="mandi-card-price">₹${price.toLocaleString("en-IN")}/<small>${data.unit}</small></div>
            ${minMax}
            ${mspTag}
            ${variety}
            <div class="mandi-card-location"><i class="fa-solid fa-map-pin"></i> ${district}${m.state||""}</div>
            <div class="mandi-card-date"><i class="fa-solid fa-calendar"></i> ${m.date}</div>
        </div>`;
    }).join("");

    detailEl.scrollIntoView({ behavior: "smooth" });
}

// ── Favorites ──
async function loadMandiFavorites() {
    const listEl = document.getElementById("mandiFavList");
    if (!listEl) return;
    try {
        const data = await api("/api/mandi/favorites");
        if (!data.favorites || !data.favorites.length) {
            listEl.innerHTML = `<span class="text-muted">${LangManager.t("mandiFavEmpty") || "No saved mandis yet. Search and star a mandi to save it."}</span>`;
            return;
        }
        listEl.innerHTML = data.favorites.map(f => `
            <div class="mandi-fav-item" onclick="mandiQuickSearch('${(f.market||"").replace(/'/g,"\\'")}','${f.state}','${f.district}')">
                <div class="mandi-fav-info">
                    <i class="fa-solid fa-star" style="color:#f59e0b;"></i>
                    <div>
                        <strong>${f.label || f.market}</strong>
                        <span class="text-muted">${f.district ? f.district +", " : ""}${f.state}</span>
                    </div>
                </div>
                <button class="mandi-fav-del" onclick="event.stopPropagation(); removeMandiFavorite(${f.id})" title="Remove">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        `).join("");
    } catch (e) {
        // Not logged in or error — hide favorites
        if (listEl) listEl.innerHTML = `<span class="text-muted">${LangManager.t("mandiFavLogin") || "Login to save your favorite mandis"}</span>`;
    }
}

async function addMandiFavorite(state, district, market) {
    try {
        const res = await api("/api/mandi/favorites", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ state, district, market }),
        });
        toast(res.message || "Mandi saved!", "success");
        loadMandiFavorites();
    } catch (e) {
        toast(e.message || "Login to save favorites", "error");
    }
}

async function removeMandiFavorite(id) {
    try {
        await api(`/api/mandi/favorites/${id}`, { method: "DELETE" });
        toast(LangManager.t("mandiFavRemoved") || "Removed from favorites", "info");
        loadMandiFavorites();
    } catch (e) { toast(e.message, "error"); }
}

// ================================================================
//  DISEASE DETECTION (Feature 7)
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("diseaseForm");
    if (!form) return;

    // Image preview
    const imgInput = document.getElementById("diseaseImage");
    if (imgInput) {
        imgInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    document.getElementById("previewImg").src = e.target.result;
                    document.getElementById("imagePreview").style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        });
    }

    form.addEventListener("submit", async e => {
        e.preventDefault();
        const btn = document.getElementById("diagnoseBtn");
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

        try {
            // Build payload including base64 image if available
            const payload = {
                crop: document.getElementById("diseaseCrop").value,
                symptoms: document.getElementById("diseaseSymptoms").value,
            };

            // Include image as base64 if uploaded
            const previewImg = document.getElementById("previewImg");
            if (previewImg && previewImg.src && previewImg.src.startsWith("data:image")) {
                payload.image = previewImg.src;  // data:image/...;base64,xxxx
            }

            const data = await api("/api/disease/detect", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            renderDiseaseResults(data.diseases, data.model_used, data.cnn_available);
        } catch (err) { toast(err.message, "error"); }
        finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-stethoscope"></i> Diagnose Disease';
        }
    });
});

function renderDiseaseResults(diseases, modelUsed, cnnAvailable) {
    const card = document.getElementById("diseaseResult");
    card.style.display = "block";
    const isHi = LangManager.current === "hi";

    // Model badge
    const modelBadge = modelUsed === "cnn"
        ? `<div class="cnn-badge"><i class="fa-solid fa-brain"></i> ${isHi ? "CNN AI मॉडल द्वारा विश्लेषित" : "Analyzed by CNN AI Model"} <span class="cnn-badge-acc">95%+ accuracy</span></div>`
        : cnnAvailable === false
            ? `<div class="cnn-badge cnn-badge-text"><i class="fa-solid fa-font"></i> ${isHi ? "टेक्स्ट-आधारित विश्लेषण (CNN प्रशिक्षित नहीं)" : "Text-based analysis (CNN not trained yet)"}</div>`
            : `<div class="cnn-badge cnn-badge-text"><i class="fa-solid fa-font"></i> ${isHi ? "टेक्स्ट-आधारित विश्लेषण — बेहतर परिणाम के लिए फोटो अपलोड करें" : "Text-based analysis — upload a photo for CNN detection"}</div>`;

    document.getElementById("diseaseResults").innerHTML = modelBadge + diseases.map(d => {
        const isHealthy = d.is_healthy;
        const severityClass = isHealthy ? "healthy" : `severity-${d.severity}`;
        const confColor = d.confidence > 80 ? "#22c55e" : d.confidence > 50 ? "#f59e0b" : "#ef4444";
        const sourceIcon = d.source === "cnn" ? "🔬" : "📝";

        return `
        <div class="disease-card ${severityClass}">
            <div class="disease-header">
                <h3>${isHealthy ? '<i class="fa-solid fa-circle-check" style="color:#22c55e"></i>' : '<i class="fa-solid fa-virus"></i>'} ${isHi && d.disease_hi ? d.disease_hi : d.disease}</h3>
                <div class="disease-badges">
                    ${isHealthy
                        ? `<span class="severity-badge severity-healthy">${isHi ? "स्वस्थ" : "HEALTHY"}</span>`
                        : `<span class="severity-badge severity-${d.severity}">${d.severity.toUpperCase()}</span>`}
                    <span class="confidence-badge" style="background:${confColor}20; color:${confColor}; border:1px solid ${confColor}40;">
                        ${sourceIcon} ${d.confidence}%
                    </span>
                </div>
            </div>
            <div class="disease-meta">
                <span class="disease-crop"><i class="fa-solid fa-leaf"></i> ${d.crop}</span>
                <span><i class="fa-solid fa-tag"></i> ${d.type}</span>
            </div>
            ${isHealthy ? `
                <div class="disease-section healthy-msg">
                    <p><i class="fa-solid fa-circle-check"></i> ${isHi
                        ? "यह पत्ती स्वस्थ दिखती है! कोई बीमारी नहीं पाई गई।"
                        : "This leaf looks healthy! No disease detected."}</p>
                </div>
            ` : `
                ${d.symptoms ? `
                <div class="disease-section">
                    <h4><i class="fa-solid fa-eye"></i> ${isHi ? "लक्षण" : "Symptoms"}</h4>
                    <p>${isHi && d.symptoms_hi ? d.symptoms_hi : d.symptoms}</p>
                </div>` : ""}
                <div class="disease-section treatment">
                    <h4><i class="fa-solid fa-prescription-bottle-medical"></i> ${isHi ? "उपचार" : "Treatment"}</h4>
                    <p>${isHi && d.treatment_hi ? d.treatment_hi : d.treatment}</p>
                </div>
            `}
        </div>`;
    }).join("");

    // TTS
    const speakBtn = document.getElementById("speakDiagnosis");
    if (speakBtn && diseases.length) {
        speakBtn.onclick = () => {
            const d = diseases[0];
            if (d.is_healthy) {
                speakText(isHi ? "पत्ती स्वस्थ है, कोई बीमारी नहीं।" : "The leaf is healthy, no disease detected.");
            } else {
                speakText(isHi
                    ? `सबसे संभावित रोग: ${d.disease_hi || d.disease}। उपचार: ${d.treatment_hi || d.treatment}`
                    : `Most likely disease: ${d.disease}. Treatment: ${d.treatment}`
                );
            }
        };
    }

    card.scrollIntoView({ behavior: "smooth" });
}

// ================================================================
//  GOVERNMENT SCHEMES (Feature 5)
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("schemeForm");
    if (!form) return;

    // Load all schemes
    loadAllSchemes();

    form.addEventListener("submit", async e => {
        e.preventDefault();
        try {
            const data = await api("/api/schemes/check", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    land_ha: document.getElementById("schemeLand").value,
                    category: document.getElementById("schemeCategory").value,
                    state: document.getElementById("schemeState").value,
                }),
            });
            renderSchemeResults(data);
        } catch (err) { toast(err.message, "error"); }
    });
});

async function loadAllSchemes() {
    try {
        const data = await api("/api/schemes");
        const grid = document.getElementById("allSchemes");
        if (!grid) return;
        const isHi = LangManager.current === "hi";
        grid.innerHTML = data.schemes.map(s => `
            <div class="info-block">
                <div class="info-header">
                    <i class="fa-solid fa-landmark"></i>
                    <h3>${isHi ? s.name_hi : s.name}</h3>
                </div>
                <div class="info-body">
                    <p>${isHi ? s.desc_hi : s.desc}</p>
                    <p style="margin-top:.5rem;"><strong>Benefits:</strong> ${s.benefits}</p>
                    <a href="${s.url}" target="_blank" class="btn btn-primary" style="margin-top:.75rem;font-size:.85rem;">
                        <i class="fa-solid fa-external-link-alt"></i> Apply Online
                    </a>
                </div>
            </div>
        `).join("");
    } catch (e) { console.error(e); }
}

function renderSchemeResults(data) {
    document.getElementById("schemeResult").style.display = "block";
    const isHi = LangManager.current === "hi";
    document.getElementById("schemeCount").innerHTML = `
        <div class="crop-name"><i class="fa-solid fa-check-circle" style="color:#27ae60"></i> ${data.total} ${isHi ? "योजनाएँ उपलब्ध" : "Schemes Available"}</div>
    `;

    document.getElementById("schemeList").innerHTML = data.eligible.map(s => `
        <div class="scheme-item">
            <h3><i class="fa-solid fa-landmark"></i> ${isHi ? s.name_hi : s.name}</h3>
            <p>${isHi ? s.desc_hi : s.desc}</p>
            <p class="scheme-benefit"><i class="fa-solid fa-gift"></i> ${s.benefits}</p>
            <a href="${s.url}" target="_blank" class="btn btn-primary" style="font-size:.85rem;">
                <i class="fa-solid fa-external-link-alt"></i> ${isHi ? "ऑनलाइन आवेदन" : "Apply Online"}
            </a>
        </div>
    `).join("");

    document.getElementById("schemeResult").scrollIntoView({ behavior: "smooth" });
}

// ================================================================
//  SOIL TESTING (Feature 2)
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    const lookupForm = document.getElementById("soilLookupForm");
    const soilForm = document.getElementById("soilForm");
    if (!lookupForm && !soilForm) return;

    if (lookupForm) {
        lookupForm.addEventListener("submit", async e => {
            e.preventDefault();
            const id = document.getElementById("reportId").value.trim();
            if (!id) return toast("Enter a report ID", "error");
            try {
                const data = await api("/api/soil/submit", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ report_id: id }),
                });
                renderSoilReport(data);
            } catch (err) { toast(err.message, "error"); }
        });
    }

    if (soilForm) {
        soilForm.addEventListener("submit", async e => {
            e.preventDefault();
            try {
                const data = await api("/api/soil/submit", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        N: document.getElementById("soilN").value,
                        P: document.getElementById("soilP").value,
                        K: document.getElementById("soilK").value,
                        pH: document.getElementById("soilPH").value,
                        EC: document.getElementById("soilEC")?.value || 0,
                        OC: document.getElementById("soilOC")?.value || 0,
                        S: document.getElementById("soilS")?.value || 0,
                        Zn: document.getElementById("soilZn")?.value || 0,
                        soil_type: document.getElementById("soilType")?.value || "",
                        location: document.getElementById("soilLocation")?.value || "",
                    }),
                });
                renderSoilReport(data);
                toast("Soil analysis complete!", "success");
            } catch (err) { toast(err.message, "error"); }
        });
    }
});

function renderSoilReport(data) {
    document.getElementById("soilResult").style.display = "block";
    document.getElementById("soilReportId").innerHTML = `
        <div class="soil-id"><i class="fa-solid fa-file-lines"></i> Report: <strong>${data.report_id || "N/A"}</strong></div>
    `;

    if (data.recommendations) {
        document.getElementById("soilRecommendations").innerHTML = data.recommendations.map(r => `
            <div class="soil-rec status-${r.status.toLowerCase()}">
                <div class="soil-rec-header">
                    <span class="soil-nutrient">${r.nutrient}</span>
                    <span class="soil-status status-${r.status.toLowerCase()}">${r.status}</span>
                </div>
                <p class="soil-action"><i class="fa-solid fa-arrow-right"></i> ${r.action}</p>
            </div>
        `).join("");
    }

    document.getElementById("soilResult").scrollIntoView({ behavior: "smooth" });
}

// ================================================================
//  COMMUNITY FORUM (Feature 10)
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    const postForm = document.getElementById("forumPostForm");
    if (!postForm) return;

    loadForumPosts();

    postForm.addEventListener("submit", async e => {
        e.preventDefault();
        try {
            await api("/api/forum/post", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: document.getElementById("postTitle").value.trim(),
                    content: document.getElementById("postContent").value.trim(),
                    category: document.getElementById("postCategory").value,
                }),
            });
            toast("Post created!", "success");
            document.getElementById("postTitle").value = "";
            document.getElementById("postContent").value = "";
            loadForumPosts();
        } catch (err) { toast(err.message, "error"); }
    });

    // Category filters
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            loadForumPosts(btn.dataset.cat);
        });
    });

    // Reply form
    const replyForm = document.getElementById("replyForm");
    if (replyForm) {
        replyForm.addEventListener("submit", async e => {
            e.preventDefault();
            try {
                const data = await api("/api/forum/reply", {
                    method: "POST", headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        post_id: document.getElementById("replyPostId").value,
                        content: document.getElementById("replyContent").value.trim(),
                    }),
                });
                document.getElementById("replyContent").value = "";
                renderReplies(data.replies);
                toast("Reply sent!", "success");
            } catch (err) { toast(err.message, "error"); }
        });
    }
});

async function loadForumPosts(category = "") {
    try {
        const url = category ? `/api/forum/posts?category=${category}` : "/api/forum/posts";
        const data = await api(url);
        const container = document.getElementById("forumPosts");
        if (!container) return;

        if (!data.posts.length) {
            container.innerHTML = '<div class="no-posts"><i class="fa-solid fa-comments"></i><p>No posts yet. Be the first to ask!</p></div>';
            return;
        }

        const catIcons = { general: "💬", crop: "🌾", pest: "🐛", market: "💰", govt: "🏛️", equipment: "🔧" };
        container.innerHTML = data.posts.map(p => `
            <div class="forum-post">
                <div class="post-header">
                    <span class="post-cat">${catIcons[p.category] || "💬"} ${p.category}</span>
                    <span class="post-time">${new Date(p.created_at).toLocaleDateString("en-IN")}</span>
                </div>
                <h3 class="post-title">${p.title}</h3>
                <p class="post-content">${p.content.substring(0, 200)}${p.content.length > 200 ? "..." : ""}</p>
                <div class="post-footer">
                    <span class="post-author"><i class="fa-solid fa-user"></i> ${p.username}</span>
                    <div class="post-actions">
                        <button onclick="likePost(${p.id})" class="post-action-btn"><i class="fa-solid fa-heart"></i> ${p.likes}</button>
                        <button onclick="openReplyModal(${p.id}, '${p.title.replace(/'/g, "\\'")}', '${p.content.replace(/'/g, "\\'").substring(0, 100)}')" class="post-action-btn"><i class="fa-solid fa-reply"></i> ${p.replies}</button>
                    </div>
                </div>
            </div>
        `).join("");
    } catch (e) { console.error(e); }
}

async function likePost(id) {
    try {
        await api("/api/forum/like", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: id }),
        });
        loadForumPosts();
    } catch (e) { toast(e.message, "error"); }
}

function openReplyModal(postId, title, content) {
    document.getElementById("replyPostId").value = postId;
    document.getElementById("replyPostContent").innerHTML = `<h4>${title}</h4><p>${content}</p>`;
    document.getElementById("repliesList").innerHTML = '<div class="loading-box"><div class="spinner"></div></div>';
    document.getElementById("replyModal").style.display = "flex";
    // Load existing replies
    api(`/api/forum/posts`).then(data => {
        // Find replies in a separate call if needed
    }).catch(() => {});
}

function closeReplyModal() {
    document.getElementById("replyModal").style.display = "none";
}

function renderReplies(replies) {
    document.getElementById("repliesList").innerHTML = replies.map(r => `
        <div class="reply-item">
            <div class="reply-author"><i class="fa-solid fa-user"></i> ${r.username} • ${new Date(r.created_at).toLocaleDateString("en-IN")}</div>
            <p>${r.content}</p>
        </div>
    `).join("");
}

// ================================================================
//  SMS ALERTS (Feature 3)
// ================================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("alertForm");
    if (!form) return;

    loadAlertStatus();

    form.addEventListener("submit", async e => {
        e.preventDefault();
        try {
            const data = await api("/api/alerts/subscribe", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    phone: document.getElementById("alertPhone").value.trim(),
                    alert_type: document.getElementById("alertType").value,
                    city: document.getElementById("alertCity").value.trim(),
                }),
            });
            toast(data.message, "success");
            loadAlertStatus();
        } catch (err) { toast(err.message, "error"); }
    });
});

async function loadAlertStatus() {
    try {
        const data = await api("/api/alerts/status");
        const container = document.getElementById("activeAlerts");
        if (!container) return;

        if (!data.subscriptions || !data.subscriptions.length) {
            container.innerHTML = '<p class="no-posts">No active subscriptions. Subscribe above to get alerts!</p>';
            return;
        }

        const typeLabels = { all: "All Alerts", weather: "Weather", pest: "Pest Warnings", market: "Market", scheme: "Schemes" };
        container.innerHTML = data.subscriptions.map(s => `
            <div class="alert-item">
                <div class="alert-item-info">
                    <i class="fa-solid fa-bell"></i>
                    <div>
                        <strong>${typeLabels[s.alert_type] || s.alert_type}</strong>
                        <p>📱 +91-${s.phone} • 📍 ${s.city}</p>
                    </div>
                </div>
                <button onclick="unsubscribeAlert(${s.id})" class="btn btn-danger-sm"><i class="fa-solid fa-times"></i></button>
            </div>
        `).join("");
    } catch (e) { console.error(e); }
}

async function unsubscribeAlert(id) {
    try {
        await api("/api/alerts/unsubscribe", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        toast("Unsubscribed", "success");
        loadAlertStatus();
    } catch (e) { toast(e.message, "error"); }
}


/* ═══════════════════════════════════════════════════════════════
   IoT SENSOR DASHBOARD
   ═══════════════════════════════════════════════════════════════ */

let sensorHistoryChart = null;
let sensorPollTimer = null;

// ─── Initialise IoT page when detected ───
function initIoTDashboard() {
    if (!document.getElementById("valTemp")) return;
    refreshSensorData();
    loadHistory(6);
    // Auto-refresh every 30 seconds
    sensorPollTimer = setInterval(refreshSensorData, 30000);
}

// ─── Fetch latest sensor reading ───
async function refreshSensorData() {
    try {
        const res = await fetch("/api/sensor/latest");
        const data = await res.json();

        if (!data.success) {
            showNoSensorData();
            return;
        }

        const r = data.reading;
        hideSetupGuide();

        // Handle disconnected sensors (Flask sends moisture_connected / ph_connected / ph_in_air flags)
        const moistureOk = r.moisture_connected !== false;
        const phOk = r.ph_connected !== false;
        const phInAir = r.ph_in_air === true;

        // Update gauge values
        animateValue("valTemp", r.temperature, 1, "°C");
        animateValue("valHumidity", r.humidity, 0, "%");
        if (moistureOk) {
            animateValue("valMoisture", r.moisture, 0, "%");
        } else {
            const el = document.getElementById("valMoisture");
            if (el) el.textContent = "N/C";
        }
        if (phOk) {
            animateValue("valPH", r.ph, 1, "");
        } else {
            const el = document.getElementById("valPH");
            if (el) el.textContent = phInAir ? "AIR" : "N/C";
        }

        // Update gauge bars (percentage of max)
        setBarWidth("barTemp", r.temperature, 50);       // max 50°C
        setBarWidth("barHumidity", r.humidity, 100);
        setBarWidth("barMoisture", moistureOk ? r.moisture : 0, 100);
        setBarWidth("barPH", phOk ? r.ph : 0, 14);       // pH 0-14

        // Colour-code gauge cards based on severity
        colourGauge("gaugeTemp", r.temperature, [
            [5, "danger"], [10, "warning"], [38, "success"], [42, "warning"], [99, "danger"]
        ]);
        if (moistureOk) {
            colourGauge("gaugeMoisture", r.moisture, [
                [25, "danger"], [40, "warning"], [80, "success"], [85, "warning"], [100, "danger"]
            ]);
        } else {
            // Grey out disconnected sensor
            const mc = document.getElementById("gaugeMoisture");
            if (mc) { mc.classList.remove("gauge-success","gauge-warning","gauge-danger"); mc.classList.add("gauge-warning"); }
        }
        if (phOk) {
            colourGauge("gaugePH", r.ph, [
                [4.5, "danger"], [5.5, "warning"], [8.0, "success"], [8.5, "warning"], [14, "danger"]
            ]);
        } else {
            const pc = document.getElementById("gaugePH");
            if (pc) { pc.classList.remove("gauge-success","gauge-warning","gauge-danger"); pc.classList.add("gauge-warning"); }
        }
        colourGauge("gaugeHumidity", r.humidity, [
            [20, "warning"], [85, "success"], [100, "warning"]
        ]);

        // Show raw debug info (ADC values) as subtitles under moisture & pH cards
        const moistureCard = document.getElementById("gaugeMoisture");
        if (moistureCard) {
            let rawEl = moistureCard.querySelector(".iot-raw-debug");
            if (!rawEl) { rawEl = document.createElement("small"); rawEl.className = "iot-raw-debug"; moistureCard.querySelector(".iot-gauge-body").appendChild(rawEl); }
            rawEl.textContent = `Raw ADC: ${r.moisture_raw ?? '--'}` + (!moistureOk ? ' (disconnected)' : '');
        }
        const phCard = document.getElementById("gaugePH");
        if (phCard) {
            let rawEl = phCard.querySelector(".iot-raw-debug");
            if (!rawEl) { rawEl = document.createElement("small"); rawEl.className = "iot-raw-debug"; phCard.querySelector(".iot-gauge-body").appendChild(rawEl); }
            rawEl.textContent = `Raw ADC: ${r.ph_raw ?? '--'} | ${(r.ph_voltage ?? 0).toFixed(3)}V` + (!phOk ? ' (disconnected)' : '');
        }

        // ── Check if ESP32 is still actively sending data ──
        const deviceOnline = r.device_online !== false;
        const ageSec = r.data_age_seconds || 0;

        // Update status bar — show per-sensor health OR offline
        if (!deviceOnline) {
            // ESP32 is off / disconnected from WiFi — data is stale
            updateDeviceStatus("offline", r.device_id, null, ageSec);
        } else {
            const dhtOk = (r.temperature !== -999 && r.humidity !== -999);
            const sensorsDown = [!dhtOk && "DHT11", !moistureOk && "Moisture", !phOk && "pH"].filter(Boolean);
            if (sensorsDown.length === 0) {
                updateDeviceStatus("online", r.device_id);
            } else {
                updateDeviceStatus("online", r.device_id, sensorsDown);
            }
        }
        const el = document.getElementById("lastUpdateTime");
        if (el) {
            const timeStr = new Date(r.created_at).toLocaleTimeString();
            if (!deviceOnline) {
                const agoText = formatTimeAgo(ageSec);
                el.innerHTML = `<i class="fa-regular fa-clock"></i> Last seen: ${agoText} (${timeStr})`;
            } else {
                el.innerHTML = `<i class="fa-regular fa-clock"></i> ${timeStr}`;
            }
        }
        const wifi = document.getElementById("wifiSignal");
        if (wifi) {
            if (!deviceOnline) {
                wifi.innerHTML = `<i class="fa-solid fa-wifi" style="opacity:0.4"></i> --`;
            } else {
                wifi.innerHTML = `<i class="fa-solid fa-wifi"></i> ${r.wifi_rssi || '--'} dBm`;
            }
        }
        const bat = document.getElementById("batteryLevel");
        if (bat && r.battery_v) {
            const pct = Math.min(100, Math.max(0, ((r.battery_v - 6.0) / (8.4 - 6.0)) * 100));
            const icon = pct > 75 ? "full" : pct > 50 ? "three-quarters" : pct > 25 ? "half" : pct > 10 ? "quarter" : "empty";
            bat.innerHTML = `<i class="fa-solid fa-battery-${icon}"></i> ${r.battery_v.toFixed(1)}V`;
        }

        // Render advisories
        renderAdvisories(r.advisories || []);

        // Update mini-widget on dashboard if present
        updateDashboardWidget(r);

    } catch (e) {
        console.error("Sensor fetch error:", e);
        updateDeviceStatus("offline");
    }
}

function showNoSensorData() {
    const guide = document.getElementById("iotSetupGuide");
    if (guide) guide.style.display = "block";
    updateDeviceStatus("offline");
}

function hideSetupGuide() {
    const guide = document.getElementById("iotSetupGuide");
    if (guide) guide.style.display = "none";
}

function animateValue(elementId, value, decimals, suffix) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const formatted = (typeof value === "number") ? value.toFixed(decimals) : "--";
    el.textContent = formatted;
}

function setBarWidth(barId, value, max) {
    const bar = document.getElementById(barId);
    if (!bar) return;
    const pct = Math.min(100, Math.max(0, (value / max) * 100));
    bar.style.width = pct + "%";
}

function colourGauge(cardId, value, thresholds) {
    const card = document.getElementById(cardId);
    if (!card) return;
    card.classList.remove("gauge-success", "gauge-warning", "gauge-danger");
    for (const [limit, level] of thresholds) {
        if (value <= limit) {
            card.classList.add("gauge-" + level);
            return;
        }
    }
}

function formatTimeAgo(seconds) {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}

function updateDeviceStatus(status, deviceId, sensorsDown, ageSec) {
    const chip = document.getElementById("deviceStatusChip");
    const text = document.getElementById("deviceStatusText");
    const pulse = document.getElementById("iotPulse");
    if (!chip) return;

    chip.classList.remove("status-online", "status-offline", "status-connecting");

    if (text) {
        const lang = localStorage.getItem("lang") || "en";
        if (status === "offline" && ageSec != null) {
            // ESP32 powered off or disconnected from WiFi — stale data
            chip.classList.add("status-offline");
            const ago = formatTimeAgo(ageSec);
            text.textContent = lang === "hi"
                ? `ऑफ़लाइन — आखिरी डेटा ${ago} पहले`
                : `Offline — last data ${ago}`;
        } else if (status === "online" && sensorsDown && sensorsDown.length > 0) {
            // ESP32 online but some sensors disconnected
            chip.classList.add("status-online");
            const sensorList = sensorsDown.join(", ");
            text.textContent = lang === "hi"
                ? `ऑनलाइन — ${sensorsDown.length} सेंसर डिस्कनेक्ट (${sensorList})`
                : `Online — ${sensorsDown.length} sensor${sensorsDown.length > 1 ? 's' : ''} disconnected (${sensorList})`;
        } else {
            chip.classList.add("status-" + status);
            const labels = {
                online:  lang === "hi" ? "ऑनलाइन — सभी सेंसर कनेक्ट" : "Online — All sensors connected",
                offline: lang === "hi" ? "ऑफ़लाइन — ESP32 कनेक्ट करें" : "Offline — Connect ESP32",
                connecting: lang === "hi" ? "कनेक्ट हो रहा है..." : "Connecting...",
            };
            text.textContent = labels[status] || status;
        }
    }
    if (pulse) pulse.className = "iot-pulse " + (status === "online" ? "pulse-active" : "");
}

function renderAdvisories(advisories) {
    const container = document.getElementById("advisoryList");
    const section = document.getElementById("iotAdvisories");
    if (!container || !section) return;

    if (!advisories.length) { section.style.display = "none"; return; }
    section.style.display = "block";

    const lang = localStorage.getItem("lang") || "en";
    container.innerHTML = advisories.map(a => `
        <div class="iot-advisory iot-advisory-${a.type}">
            <i class="fa-solid fa-${a.icon}"></i>
            <span>${lang === "hi" && a.msg_hi ? a.msg_hi : a.msg}</span>
        </div>
    `).join("");
}

// ─── Sensor history chart ───
async function loadHistory(hours, btn) {
    // Toggle active button
    if (btn) {
        document.querySelectorAll(".iot-chart-controls .btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    }

    try {
        const res = await fetch(`/api/sensor/history?hours=${hours}`);
        const data = await res.json();

        const chartEl = document.getElementById("sensorHistoryChart");
        const emptyEl = document.getElementById("chartEmpty");
        if (!chartEl) return;

        if (!data.success || !data.history.length) {
            chartEl.style.display = "none";
            if (emptyEl) emptyEl.style.display = "block";
            return;
        }
        chartEl.style.display = "block";
        if (emptyEl) emptyEl.style.display = "none";

        const labels = data.history.map(h => {
            const d = new Date(h.created_at);
            return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        });

        const datasets = [
            { label: "Temperature (°C)", data: data.history.map(h => h.temperature), borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)", tension: 0.3, fill: true },
            { label: "Humidity (%)", data: data.history.map(h => h.humidity), borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.1)", tension: 0.3, fill: true },
            { label: "Soil Moisture (%)", data: data.history.map(h => h.moisture), borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)", tension: 0.3, fill: true },
            { label: "pH", data: data.history.map(h => h.ph), borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.1)", tension: 0.3, fill: true },
        ];

        if (sensorHistoryChart) sensorHistoryChart.destroy();

        sensorHistoryChart = new Chart(chartEl, {
            type: "line",
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { position: "top", labels: { usePointStyle: true, padding: 15 } },
                    tooltip: { mode: "index", intersect: false },
                },
                scales: {
                    x: { display: true, grid: { display: false } },
                    y: { display: true, grid: { color: "rgba(0,0,0,0.05)" } },
                }
            }
        });

    } catch (e) {
        console.error("History load error:", e);
    }
}

// ─── Auto-fill crop form from sensors ───
async function autoFillFromSensors() {
    try {
        const res = await fetch("/api/sensor/autofill");
        const data = await res.json();

        if (!data.success) {
            toast(data.error || "No sensor data available", "error");
            return;
        }

        const a = data.autofill;

        // If we're on the crop page, fill directly
        const phInput = document.getElementById("ph");
        const tempInput = document.getElementById("temperature");
        const humInput = document.getElementById("humidity");

        if (phInput) phInput.value = a.ph;
        if (tempInput) tempInput.value = a.temperature;
        if (humInput) humInput.value = a.humidity;

        toast("✅ Sensor data filled! Add N/P/K and rainfall manually.", "success");

        // If on IoT page, redirect to crop page with params
        if (!phInput) {
            const params = new URLSearchParams({
                ph: a.ph,
                temperature: a.temperature,
                humidity: a.humidity,
                moisture: a.moisture,
                from: "iot"
            });
            window.location.href = "/crop?" + params.toString();
        }
    } catch (e) {
        toast("Cannot fetch sensor data. Is ESP32 connected?", "error");
    }
}

// ─── Dashboard mini-widget update ───
function updateDashboardWidget(r) {
    const widget = document.getElementById("sensorMiniWidget");
    if (!widget || !r) return;
    widget.style.display = "flex";
    document.getElementById("miniTemp").textContent = r.temperature.toFixed(1) + "°C";
    document.getElementById("miniHumidity").textContent = r.humidity.toFixed(0) + "%";
    document.getElementById("miniMoisture").textContent = r.moisture.toFixed(0) + "%";
    document.getElementById("miniPH").textContent = r.ph.toFixed(1);
}

// ─── Crop page: auto-fill from URL params (coming from IoT page) ───
function autoFillFromURLParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("from") !== "iot") return;

    const fields = { ph: "ph", temperature: "temperature", humidity: "humidity" };
    for (const [param, inputId] of Object.entries(fields)) {
        const val = params.get(param);
        const input = document.getElementById(inputId);
        if (val && input) input.value = val;
    }
    toast("📡 Sensor data auto-filled from IoT!", "success");
}

// ─── Hook into page init ───
document.addEventListener("DOMContentLoaded", () => {
    initIoTDashboard();
    autoFillFromURLParams();

    // If on dashboard, try a silent sensor fetch for the mini-widget
    if (document.getElementById("sensorMiniWidget")) {
        fetch("/api/sensor/latest").then(r => r.json()).then(data => {
            if (data.success) updateDashboardWidget(data.reading);
        }).catch(() => {});
    }
});
