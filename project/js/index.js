let currentComparisonId = null;

async function loadComparison() {
    const res = await fetch('/comparison');
    const data = await res.json();
    currentComparisonId = data.comparison_id;
    document.getElementById('review-a-text').innerText = data.review_a;
    document.getElementById('review-b-text').innerText = data.review_b;
}

async function submitVote(winner) {
    document.getElementById('btn-a').disabled = true;
    document.getElementById('btn-tie').disabled = true;
    document.getElementById('btn-b').disabled = true;

    const res = await fetch('/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comparison_id: currentComparisonId, winner: winner })
    });
    const result = await res.json();

    const nameA = document.getElementById('model-a-name');
    const nameB = document.getElementById('model-b-name');
    
    nameA.innerText = "🤖 " + result.model_a;
    nameB.innerText = "🤖 " + result.model_b;
    nameA.style.display = 'block';
    nameB.style.display = 'block';

    setTimeout(() => location.reload(), 3500);
}

loadComparison();