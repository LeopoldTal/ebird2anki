const fs = require('fs');

const LIST_PATH = '../step_1_victoria_bird_list.tsv';
const PHOTO_PATH = '../step_4_media/'
const ANKI_COLLECTION_DIR = '/Users/leo/Library/Application Support/Anki2/User\ 1/collection.media/';

// Turns a bird name into an expected path
const canonicalise = (name) => name.toLowerCase().replace(/[ \-]/g, '_').replace(/'/g, '');

const birdName = canonicalise(process.argv.slice(2).join(' '));
if (!birdName) {
	console.error('Usage: make_audio_cards common name of species');
	process.exit(1);
}
console.log('Making cards for', birdName);

// Find bird
const birdList = fs.readFileSync(LIST_PATH, 'utf-8')
	.trim().split('\n')
	.map(line => {
		const [commonName, sciName, url] = line.trim().split('\t');
		const slug = url.split('/').filter(s => s).pop();
		return { commonName, sciName, slug };
	});
const matchingLines = birdList.filter(({ commonName }) => canonicalise(commonName) === birdName);

if (matchingLines.length !== 1) {
	console.error(matchingLines.length, 'matches for', birdName);
	process.exit(1);
}
const { commonName, sciName, slug } = matchingLines[0];
console.log(commonName, '|', sciName, '|', slug);

// Find images
console.log('Looking for images in', PHOTO_PATH);
const photos = fs.readdirSync(PHOTO_PATH).filter(fname => fname.endsWith('.jpg') && fname.startsWith(`ebird2anki-${slug}-`));
console.log('Found', photos.length, 'photos');

// Find sound clips
const audioPath = `./clips/${birdName}/`;
console.log('Looking for sound clips in', audioPath);
const clips = fs.readdirSync(audioPath).filter(fname => fname.endsWith('.mp3'));
console.log('Found', clips.length, 'sound clips');

// Copies a file iff target doesn't already exist
const copyUpdate = (dirFrom, dirTo, fname) => {
	const pathFrom = `${dirFrom}${fname}`;
	const pathTo = `${dirTo}${fname}`;
	if (fs.existsSync(pathTo)) {
		console.log(pathTo, 'exists: skipping');
	} else {
		console.log(`cp ${pathFrom} → ${pathTo}`);
		fs.cpSync(pathFrom, pathTo, { errorOnExist: true, force: false });
	}
};

// Import media
photos.forEach(fname => {
	copyUpdate(PHOTO_PATH, ANKI_COLLECTION_DIR, fname);
});
clips.forEach(fname => {
	copyUpdate(audioPath, ANKI_COLLECTION_DIR, fname);
});

// Generate cards
const cards = clips.map((clipFname, index) => {
	const photoFname = photos[index % photos.length];
	return `[sound:${clipFname}];${commonName};${sciName};<img src="${photoFname}">\n`;
});
const output = 'tags:bird-audio\n' + cards.join('');
const outPath = `./cards/${birdName}.csv`;
fs.writeFileSync(outPath, output, 'utf-8');
console.log('Wrote', cards.length, 'cards to', outPath);
