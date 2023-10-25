const fs = require('fs');
const https = require('https');

const LIST_PATH = './step_1_victoria_bird_list.tsv';
const INPUT_DIR = './step_2_bird_pages/';
const MEDIA_DIR = './step_4_media/';
const CARDS_CSV_PATH = './step_4_cards.csv';
const CARDS_JSON_PATH = './step_4_cards.json';

const getBirdList = () => {
	const birdList = fs.readFileSync(LIST_PATH, 'utf-8')
		.trim().split('\n')
		.map(line => {
			const [commonName, sciName, url, freq] = line.trim().split('\t');
			const slug = url.split('/').filter(s => s).pop();
			return { commonName, sciName, slug, freq: parseFloat(freq) };
		});
	const birdDict = {};
	birdList.forEach((bird) => {
		birdDict[bird.slug] = bird;
	});
	return birdDict;
};

const BIRDS = getBirdList();

const EXTENSION = {
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'audio/wav': 'mp3',
};

const downloadAsset = ({ url, mediaFileName }) => {
	// TODO: remove guard
	TEST_MEDIA = [];
	if (!TEST_MEDIA.includes(mediaFileName)) {
		return;
	}

	const mediaFilePath = MEDIA_DIR + mediaFileName;
	if (fs.existsSync(mediaFileName)) {
		return;
	}

	console.log('Downloading', url, 'to', mediaFilePath);
	const outFile = fs.createWriteStream(mediaFilePath);
	https.get(url, (res) => {
		res.pipe(outFile);
		outFile.on('finish', () => {
			const callback = () => console.log('Download to', mediaFilePath, 'complete')
			outFile.close(callback);
		});
	}).on('error', (err) => {
		fs.unlink(mediaFilePath);
		console.error('Download failed', err, url, mediaFilePath);
	});
};

const getMedia = (page, needle, fpath, { commonName, sciName, slug, freq }) => {
	try {
		const statements = page.split(';\n');
		const mediaJson = statements
			.find(line => line.match(needle))
			.split(needle)[1]
			.trim();
		if (mediaJson === '{ galleryAssets: [] }') {
			console.warn('No media:', fpath);
			return [];
		}
		const media = JSON.parse(mediaJson);
		if (!media.galleryAssets) {
			console.warn('No media:', fpath);
			return [];
		}
		return media.galleryAssets.map(({ asset: { assetId, mlBaseDownloadUrl, mimeType } }) => ({
			url: `${mlBaseDownloadUrl}${assetId}`,
			mimeType,
			mediaFileName: `${slug}-${assetId}.${EXTENSION[mimeType]}`,
			commonName, sciName, slug, freq,
		}));
	} catch (err) {
		console.error('Error in', fpath, needle);
		throw err;
	}
}

const makePhotoCard = ({ mediaFileName, commonName, sciName, freq }, audios, index) => {
	if (!audios.length) {
		return [];
	}
	const audioIndex = index % audios.length;
	const answerMediaFileName = audios[audioIndex].mediaFileName;
	return {
		media: `<img src="${mediaFileName}">`,
		questionPlaceholder: '',
		commonName: commonName,
		scientificName: sciName,
		answerMedia: `[sound:${answerMediaFileName}]`,
		freq,
	};
};

const makeAudioCard = ({ mediaFileName, commonName, sciName, freq }, photos, index) => {
	if (!photos.length) {
		return [];
	}
	const photoIndex = (index + 1) % photos.length;
	const answerMediaFileName = photos[photoIndex].mediaFileName;
	return {
		media: `[sound:${mediaFileName}]`,
		questionPlaceholder: '🎵',
		commonName: commonName,
		scientificName: sciName,
		answerMedia: `<img src="${answerMediaFileName}">`,
		freq,
	};
};

const parseBird = (fpath) => {
	const slug = fpath.split('/').pop().split('.html')[0];
	const bird = BIRDS[slug];
	const page = fs.readFileSync(fpath, 'utf8');

	const photos = getMedia(page, /\bphotoAssetsJson\s*=/, fpath, bird);
	const audios = getMedia(page, /\baudioAssetsJson\s*=/, fpath, bird);

	photos.forEach(downloadAsset);
	audios.forEach(downloadAsset);

	const photoCards = photos.map((photo, index) => makePhotoCard(photo, audios, index));
	const audioCards = audios.map((audio, index) => makeAudioCard(audio, photos, index));
	return photoCards.concat(audioCards);
};

const formatCard = ({ media, questionPlaceholder, commonName, scientificName, answerMedia }) => [
	media, questionPlaceholder, commonName, scientificName, answerMedia
].join(';') + '\n';

const exportCards = (cards) => {
	const dump = cards.map(formatCard).join('');
	fs.writeFileSync(CARDS_PATH, dump, 'utf-8');
};

const makeAllCards = () => {
	const fnames = fs.readdirSync(INPUT_DIR);
	const allCards = fnames.map(fname => INPUT_DIR + fname).flatMap(parseBird);

	// TODO: I'd like something locally random but weighted by freq - see diffusion demo
	allCards.sort((a, b) => b.freq - a.freq);

	exportCards(allCards);
	console.log(allCards.length, 'cards');
};

makeAllCards();
