const express = require('express');
const app = express();
const fs = require('fs').promises;

app.get('/forms', (req, res) => {
    res.sendFile('public/index.html', { root: clientPath });
});