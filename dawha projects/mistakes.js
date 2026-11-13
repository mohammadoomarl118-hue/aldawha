/* ============================================================
   تدرّب على أخطائي
   يُحمَّل بعد السكربت الرئيسي مباشرة:
   <script src="mistakes.js"></script>
   ============================================================ */
(function () {

  /* ---------- 1) حفظ الأخطاء على هذا الجهاز ---------- */

  const KEY = "dawha-mistakes";
  const MAX_SAVED = 60;

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); }
    catch (e) { return []; }
  }

  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_SAVED))); }
    catch (e) { /* التخزين غير متاح */ }
  }

  function record(word, pos) {
    if (!ALL.some(x => x.w === word && x.p === pos)) return;
    const list = read();
    if (!list.some(m => m.w === word && m.p === pos)) {
      list.unshift({ w: word, p: pos });
      write(list);
    }
  }

  function clear(word, pos) {
    write(read().filter(m => !(m.w === word && m.p === pos)));
  }


  /* ---------- 2) تسجيل الخطأ داخل الألعاب الموجودة ---------- */

  // اكمل الفراغ + تدريب القواعد: نراقب الضغط على الخيارات
  const originalRunQuiz = runQuiz;
  runQuiz = function (box, questions) {
    if (box._mkListener) box.removeEventListener("click", box._mkListener, true);

    let answered = 0;
    box._mkListener = function (e) {
      const btn = e.target.closest(".opt");
      if (!btn || btn.disabled || !questions[answered]) return;

      const q = questions[answered++];
      const options = [...new Set([...(q.o || []), q.a])];
      const right = options[Number(btn.dataset.k)] === q.a;
      if (q.train && right) clear(q.w, q.p);   // أتقن الكلمة، فتختفي من القائمة
      if (!q.train && !right) record(q.w, q.p); // أخطأ، فتُحفظ الكلمة
    };
    box.addEventListener("click", box._mkListener, true);

    return originalRunQuiz.apply(this, arguments);
  };

  // السباق + صنّف الهمزة + تصحيح الخطأ: الصوت الخاطئ يدل على خطأ
  const originalSfx = sfx;
  sfx = function (ok) {
    if (!ok) {
      const page = location.hash.slice(1);
      let q = null;
      if (page === "race" && rc && rc.cur) q = rc.cur;
      else if (page === "classify" && cl) q = cl.q[cl.i];
      else if (page === "fix" && fx) q = fx.items[fx.i];
      if (q) record(q.w, q.p);
    }
    return originalSfx.apply(this, arguments);
  };

  // اسحب الهمزة
  const originalPlaceDrag = placeDrag;
  placeDrag = function (slot, chip) {
    const pick = dg && dg.picks[slot];
    if (pick && dg.chips[chip] !== pick.a) record(pick.w, pick.p);
    return originalPlaceDrag.apply(this, arguments);
  };


  /* ---------- 3) صفحة اللعبة ---------- */

  function pageHtml() {
    return `
      <section class="view">
        <div class="hero">
          <h2>تدرّب على أخطائي</h2>
          <p>هنا تظهر الكلمات التي أخطأت فيها سابقًا. أجب عنها صحيحًا لتختفي من القائمة.</p>
        </div>
        <div class="panel" id="mkBox"></div>
      </section>`;
  }

  function drawGame() {
    const box = document.getElementById("mkBox");
    if (!box) return;

    const items = read()
      .map(m => ALL.find(x => x.w === m.w && x.p === m.p))
      .filter(Boolean);

    if (!items.length) {
      box.innerHTML = `
        <div class="final">
          <div class="trophy">🌟</div>
          <h2>لا توجد أخطاء محفوظة</h2>
          <p>العب أي لعبة، وستظهر هنا الكلمات التي تحتاج إلى مراجعة.</p>
          <a class="btn" href="#games">إلى الألعاب</a>
        </div>`;
      return;
    }

      const questions = shuffle(items).slice(0, 10).map(x => ({
        w: x.w,
        p: x.p,
        a: x.a,
        o: shuffle([...new Set([...(x.r.opts || []), x.a])]),
        train: true
      }));

    runQuiz(box, questions, 0, (score, total) => {
      const left = read().length;
      box.innerHTML = `
        <div class="final">
          <div class="trophy">${score === total ? "🎉" : "📚"}</div>
          <h2>نتيجتك: ${score} من ${total}</h2>
          <p>${left ? "عدد الكلمات المتبقية للمراجعة: " + left : "أحسنت! أتقنت كل الكلمات."}</p>
          ${left ? `<button class="btn" id="mkAgain">تدرّب مرة أخرى</button>` : ""}
          <a class="btn alt" href="#games">إلى الألعاب</a>
        </div>`;
      const again = document.getElementById("mkAgain");
      if (again) again.onclick = drawGame;
      if (score === total) confetti();
    });
  }


  /* ---------- 4) الربط بالتنقل وصفحة الألعاب ---------- */

  function addHubCard() {
    const cards = document.querySelector(".cards");
    if (!cards || document.getElementById("mkCard")) return;
    cards.insertAdjacentHTML("beforeend", `
      <a class="rule-card" id="mkCard" href="#mistakes">
        <div class="glyph">🎯</div>
        <h3>تدرّب على أخطائي</h3>
        <p>راجع الكلمات التي أخطأت فيها.</p>
      </a>`);
  }

  function onRoute() {
    const page = location.hash.slice(1);

    if (page === "mistakes") {
      document.getElementById("app").innerHTML = pageHtml();
      drawGame();
      document.querySelectorAll("nav.top a").forEach(a =>
        a.classList.toggle("active", a.dataset.nav === "game"));
      window.scrollTo(0, 0);
    } else if (page === "games") {
      addHubCard();
    }
  }

  window.addEventListener("hashchange", onRoute);
  onRoute();

})();
