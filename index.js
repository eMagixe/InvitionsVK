const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Program = require('./classes/Program');
const program = new Program(process.env, path.join(__dirname, 'last.json'));
program.start()
    .then(() => {
        console.log('Program start.');
    });