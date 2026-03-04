async function loadLeaderboard() {
const res = await fetch('/leaderboard');
const models = await res.json();

const tbody = document.getElementById('leaderboard-body');
models.forEach((model, index) => {
    let rankIcon = index + 1;
    if(index === 0) rankIcon = "🥇 1";
    if(index === 1) rankIcon = "🥈 2";
    if(index === 2) rankIcon = "🥉 3";
    const row = `<tr>
        <td class="rank">${rankIcon}</td>
        <td style="font-weight: 500;">🤖 ${model.model}</td>
        <td>${model.votes}</td>
        </tr>`;
    tbody.innerHTML += row;
});
}

loadLeaderboard();