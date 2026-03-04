const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'project')));


// initialize the database
const db = new sqlite3.Database('./test.db');
// create the tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS models (id INTEGER PRIMARY KEY, name TEXT, votes FLOAT DEFAULT 0)`);
    db.run(`CREATE TABLE IF NOT EXISTS reviews (id INTEGER PRIMARY KEY, model_id INTEGER, text TEXT, FOREIGN KEY(model_id) REFERENCES models(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS comparisons (id INTEGER PRIMARY KEY, review_a_id INTEGER, review_b_id INTEGER,
         FOREIGN KEY(review_a_id) REFERENCES reviews(id), FOREIGN KEY(review_b_id) REFERENCES reviews(id))`);
    db.run(`CREATE TABLE IF NOT EXISTS votes (id INTEGER PRIMARY KEY, comparison_id INTEGER, winner TEXT, FOREIGN KEY(comparison_id) REFERENCES comparisons(id))`);
    // insert dummy data
    db.get("SELECT COUNT(*) as count FROM models", (err, row) => {
        if (row.count === 0) {
            // insert the models
            db.run(`INSERT INTO models (name, votes) VALUES ('GPT-5', 0), ('Gemini-3 Pro', 0), ('Claude-Opus-4', 0)`);
            // insert the reviews
            db.run(`INSERT INTO reviews (model_id, text) VALUES (1, 'This paper proposes a novel framework that improves performance by 20%...'),
                (2, 'The methodology is unclear, but the results suggest a minor improvement...'),
                (3, 'Excellent structure and the experimental data provides strong evidence for the claims...')`);
            // insert some comparisons
            db.run(`INSERT INTO comparisons (review_a_id, review_b_id) VALUES (1, 2)`);
            db.run(`INSERT INTO comparisons (review_a_id, review_b_id) VALUES (1, 3)`);
            db.run(`INSERT INTO comparisons (review_a_id, review_b_id) VALUES (2, 3)`);
        }
    });
});
// Endpoint 1: comparison
app.get('/comparison', (req, res) => {
    // get a comparison
    const query = `
        SELECT c.id as comparison_id, r1.text as review_a, r2.text as review_b 
        FROM comparisons c 
        JOIN reviews r1 ON c.review_a_id = r1.id 
        JOIN reviews r2 ON c.review_b_id = r2.id 
        ORDER BY RANDOM() LIMIT 1`;
    db.get(query, [], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(row); 
    });
});
// Endpoint 2: vote
app.post('/vote', (req, res) => {
    const { comparison_id, winner } = req.body; 
    // save the vote
    db.run(`INSERT INTO votes (comparison_id, winner) VALUES (?, ?)`, [comparison_id, winner], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        // Find the models
        const query = `
            SELECT r1.model_id as model_a_id, r2.model_id as model_b_id, m1.name as model_a_name, m2.name as model_b_name
            FROM comparisons c
            JOIN reviews r1 ON c.review_a_id = r1.id JOIN models m1 ON r1.model_id = m1.id
            JOIN reviews r2 ON c.review_b_id = r2.id JOIN models m2 ON r2.model_id = m2.id
            WHERE c.id = ?`;
        db.get(query, [comparison_id], (err, comp) => {
            if (err) return res.status(500).json({ error: err.message });
            // If A or B then 1 point, if tie then half a point
            if (winner === 'A') {
                db.run(`UPDATE models SET votes = votes + 1 WHERE id = ?`, [comp.model_a_id]);
            } else if (winner === 'B') {
                db.run(`UPDATE models SET votes = votes + 1 WHERE id = ?`, [comp.model_b_id]);
            }else{
                db.run(`UPDATE models SET votes = votes + 0.5 WHERE id = ?`, [comp.model_a_id]);
                db.run(`UPDATE models SET votes = votes + 0.5 WHERE id = ?`, [comp.model_b_id]);
            }
            // 4. update and show the names
            db.all(`SELECT name as model, votes FROM models ORDER BY votes DESC`, [], (err, updatedVotes) => {
                res.json({ 
                    message: "Vote recorded", 
                    model_a: comp.model_a_name, 
                    model_b: comp.model_b_name,
                    leaderboard: updatedVotes
                });
            });
        });
    });
});
// Endpoint 3: leaderboard
app.get('/leaderboard', (req, res) => {
    db.all(`SELECT name as model, votes FROM models ORDER BY votes DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});
app.listen(process.env.PORT ||3000, () => console.log('rnin on  http://localhost:3000'));