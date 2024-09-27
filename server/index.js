const express = require('express');
const path = require('path');
const fs = require('fs').promises;

// Initialize Express application
const app = express();

// Define paths
const clientPath = path.join(__dirname, '..', 'client/src');
const dataPath = path.join(__dirname, 'data', 'users.json');
const serverPublic = path.join(__dirname, 'public');
// Middleware setup
app.use(express.static(clientPath)); // Serve static files from client directory
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes

// Home route
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: clientPath });
});

app.get('/heroes', async (req, res) => {
    try {
        const data = await fs.readFile(dataPath, 'utf8');

        const heroes = JSON.parse(data);
        if (!heroes) {
            throw new Error("Error no heries available");
        }
        res.status(200).json(heroes);
    } catch (error) {
        console.error("Problem getting heroes" + error.universe);
        res.status(500).json({ error: "Problem reading heroes" });
    }
});

// Form route
app.get('/form', (req, res) => {
    res.sendFile('pages/form.html', { root: serverPublic });
});

// Form submission route
app.post('/submit-form', async (req, res) => {
    try {
        const { name, powers, universe } = req.body;

        // Read existing heroes from file
        let heroes = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            heroes = JSON.parse(data);
        } catch (error) {
            // If file doesn't exist or is empty, start with an empty array
            console.error('Error reading hero data:', error);
            heroes = [];
        }

        // Find or create hero
        let hero = heroes.find(h => h.name === name && h.powers === powers);
        if (hero) {
            hero.universe.push(universe);
        } else {
            hero = { name, powers, universe: [universe] };
            heroes.push(hero);
        }

        // Save updated heroes
        await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));
        res.redirect('/form');
    } catch (error) {
        console.error('Error processing form:', error);
        res.status(500).send('An error occurred while processing your submission.');
    }
});

// Update hero route (currently just logs and sends a response)
app.put('/update-hero/:currentName/:currentPowers', async (req, res) => {
    try {
        const { currentName, currentPowers } = req.params;
        const { newName, newPowers } = req.body;
        console.log('Current hero:', { currentName, currentPowers });
        console.log('New hero data:', { newName, newPowers });
        const data = await fs.readFile(dataPath, 'utf8');
        if (data) {
            let heroes = JSON.parse(data);
            const heroIndex = heroes.findIndex(hero => hero.name === currentName && hero.powers === currentPowers);
            console.log(heroIndex);
            if (heroIndex === -1) {
                return res.status(404).json({ universe: "hero not found" })
            }
            heroes[heroIndex] = { ...heroes[heroIndex], name: newName, powers: newPowers };
            console.log(heroes);
            await fs.writeFile(dataPath, JSON.stringify(heroes, null, 2));

            res.status(200).json({ universe: `You sent ${newName} and ${newPowers}` });
        }
    } catch (error) {
        console.error('Error updating hero:', error);
        res.status(500).send('An error occurred while updating the hero.');
    }
});

app.delete('/hero/:name/:powers', async (req, res) => {
    try {
        // console.log(req.params);
        // console.log(req.params.name);
        // console.log(req.params.email);
        const { name, powers } = req.params;
        let heroes = [];
        try {
            const data = await fs.readFile(dataPath, 'utf8');
            heroes = JSON.parse(data);
        } catch (error) {
            return res.status(404).send('Hero data not found');
        }
        const heroIndex = heroes.findIndex(hero => hero.name === name && hero.powers === powers);
        console.log(heroIndex);
        if (heroIndex === -1) {
            return res.status(404).send('Hero not found')
        }

        heroes.splice(heroIndex, 1);

        try {
            await fs.writeFile(data, JSON.stringify(heroes, null, 2));
        } catch (error) {
            console.error('Failed to write to database')
        }
        res.send('Hero deleted successfully');

    } catch (error) {
        res.status(500).send('There was an error deleting hero')
    }
})

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});