// Minimal JS with sound triggers
const buzzer = document.getElementById('buzzer');
const ding = document.getElementById('ding');
const applause = document.getElementById('applause');
document.getElementById('revealAllBtn').onclick = ()=>{ding.play(); alert('Reveal all clicked');};
document.getElementById('nextQuestionBtn').onclick = ()=>{applause.play(); alert('Next Question clicked');};
