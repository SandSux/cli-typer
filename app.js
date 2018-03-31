const fs = require('fs');

const stdin = process.stdin;
const stdout = process.stdout;

stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');

const SPECIAL = {
    CTRL_C: '\u0003',
    BACKSPACE: '\u007f',
    GREEN_BG: '\x1b[42m',
    RED_BG: '\x1b[41m',
    BG_END: '\x1b[0m'
}

function random(min, max) {
    if (max == null) {
        max = min;
        min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
};

function shuffle(obj) {
    let sample = obj.slice();
    const last = sample.length - 1;
    for (let index = 0; index < sample.length; index++) {
        let rand = random(index, last);
        let temp = sample[index];
        sample[index] = sample[rand];
        sample[rand] = temp;
    }
    return sample.slice();
};

function* lineGenerator(path, k) {
    const shuffledWords = shuffle(fs.readFileSync(path, 'utf8').split('\n'));
    for(let i = 0; i+k < shuffledWords.length-1; i += k) {
        yield shuffledWords.slice(i, i + k).join(' ');
    }
}

// the upper text which shows what to type
let results = '';
// the lower text which show what you typed
let wrote = '';
let started = false;
let startTime;
let givenSeconds = 6;
let wordsPerLine = 9;

let corrects = 0;
let errors = 0;
let keypresses = 0;

const lineGen = lineGenerator('data/mostCommon1000.txt', wordsPerLine);

let text = lineGen.next().value;
let nextText = lineGen.next().value;

process.stdout.write(text + '\n' + nextText + '\n\n');
let cursor = 0;

stdin.on('data', key => {
    if(!started) {
        setTimeout(()=>{
            stdout.clearLine();
            stdout.cursorTo(0);

            console.log(`Time's up!`);
            console.log(`WPM: ${Math.round(corrects/5*(60/givenSeconds))}`);
            console.log(`All keystrokes: ${keypresses}`);
            console.log(`Correct keystrokes: ${corrects}`);
            console.log(`Wrong keystrokes: ${errors}`);
            console.log(`Accuracy: ${Math.round(corrects/keypresses * 10000)/100}%`);
            process.exit();
        }, givenSeconds * 1000);

        startTime = Date.now();
        started = true;
    }

    // exit on ctrl-c
    if (key == SPECIAL.CTRL_C) {
        process.exit();
    }

    // end of current line
    if(cursor >= text.length) {
        text = nextText;
        nextText = lineGen.next().value;
        cursor = 0;
        wrote = '';
        results = '';
    } else if (key == SPECIAL.BACKSPACE) {
        // do nothing on the beginning of the line
        if(cursor == 0) return;
        wrote = wrote.slice(0, -1);
        // the last char with the colored background takes up 10 characters
        results = results.slice(0, -10);
        cursor--;
    } else {
        wrote += key;

        if(key == text[cursor]){
            results += SPECIAL.GREEN_BG;
            corrects++;
        } else {
            results += SPECIAL.RED_BG;
            errors++;
        }
        results += text[cursor] + SPECIAL.BG_END;

        cursor++;
        keypresses++;
    }


    // erease the whole thing and display the updated version
    stdout.clearLine();
    stdout.moveCursor(0, -2);
    stdout.clearLine();
    stdout.moveCursor(0, -1);
    stdout.clearLine();
    stdout.cursorTo(0);
    stdout.write(results + text.substring(cursor) + '\n' + nextText + '\n\n' + wrote);
});
