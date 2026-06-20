/* modules/quiz.js */

const Quiz = {
  questions: [],
  current: 0,
  score: 0,
  answered: [],

  async load(categoryId) {
    const qs = await API.call('getQuiz', { categoryId });
    this.questions = qs || [];
    this.current   = 0;
    this.score     = 0;
    this.answered  = [];
    this.render();
  },

  render() {
    const container = document.getElementById('quizContainer');
    const scoreDiv  = document.getElementById('quizScore');
    const retryBtn  = document.getElementById('quizRetry');
    scoreDiv.style.display = 'none';
    retryBtn.style.display = 'none';

    if (!this.questions.length) {
      container.innerHTML = `<div class="empty"><div class="empty-icon">📝</div><div>ยังไม่มีแบบทดสอบในหมวดนี้</div><div style="font-size:13px;margin-top:4px;">Admin สามารถเพิ่มได้ที่หน้า Admin</div></div>`;
      return;
    }

    container.innerHTML = this.questions.map((q, i) => {
      const ans = this.answered[i];
      const opts = ['A','B','C','D'].map(letter => {
        const text = q[`opt${letter}`];
        if (!text) return '';
        let cls = 'quiz-opt';
        if (ans) {
          if (letter === q.answer) cls += ' correct';
          else if (letter === ans && ans !== q.answer) cls += ' wrong';
        }
        return `<button class="${cls}" onclick="Quiz.answer(${i},'${letter}')" ${ans?'disabled':''}>${letter}. ${text}</button>`;
      }).join('');

      const explainHtml = ans ? `<div style="margin-top:10px;padding:10px;background:#f0fdf4;border-radius:8px;font-size:13px;color:#065f46;">💡 ${q.explanation||'ตอบถูกต้อง!'}</div>` : '';

      return `<div class="quiz-q" id="quiz-${i}">
        <div style="font-size:12px;color:#9ca3af;margin-bottom:6px;">ข้อที่ ${i+1} / ${this.questions.length}</div>
        <div style="font-weight:700;font-size:15px;line-height:1.4;">${q.question}</div>
        <div class="quiz-opts">${opts}</div>
        ${explainHtml}
      </div>`;
    }).join('');
  },

  answer(idx, letter) {
    if (this.answered[idx]) return;
    this.answered[idx] = letter;
    const q = this.questions[idx];
    if (letter === q.answer) this.score++;
    this.render();

    // check if done
    if (this.answered.filter(Boolean).length === this.questions.length) {
      setTimeout(() => this.showScore(), 400);
    }
  },

  showScore() {
    const scoreDiv = document.getElementById('quizScore');
    const pct = Math.round((this.score / this.questions.length) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : '📚';
    scoreDiv.innerHTML = `
<div style="text-align:center;padding:8px;">
  <div style="font-size:40px;">${emoji}</div>
  <div style="font-size:24px;font-weight:800;color:#d97706;">${this.score} / ${this.questions.length}</div>
  <div style="font-size:14px;color:#6b7280;">${pct >= 80 ? 'ยอดเยี่ยม! คุณรู้จักสินค้าดีมาก' : pct >= 60 ? 'ดี! ลองทบทวนเพิ่มเติม' : 'ลองศึกษาข้อมูลสินค้าเพิ่มเติมนะ'}</div>
</div>`;
    scoreDiv.style.display = 'block';
    document.getElementById('quizRetry').style.display = 'block';
    scoreDiv.scrollIntoView({ behavior: 'smooth' });
  },
};

async function loadQuiz() {
  const catId = (document.getElementById('quizCatSelect') || {}).value || '';
  await Quiz.load(catId || null);
}