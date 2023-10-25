const fs = require('fs');

const LIST_PATH = './step_1_victoria_bird_list.tsv';
const INPUT_DIR = './step_2_bird_pages/';
const MEDIA_DIR = './step_4_media/';
const CARDS_PATH = './step_4_cards.json';

const getBirdList = () => {
	const birdList = fs.readFileSync(LIST_PATH, 'utf-8')
		.trim().split('\n')
		.map(line => {
			const [commonName, sciName, url, freq ] = line.trim().split('\t');
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

const getMedia = (page, needle, fpath, { commonName, sciName, slug, freq }) => {
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
	
	// TODO: actually download the media
	
	const photoCards = photos.map((photo, index) => makePhotoCard(photo, audios, index));
	const audioCards = audios.map((audio, index) => makeAudioCard(audio, photos, index));
	return photoCards.concat(audioCards);
};

const makeAllCards = () => {
	const fnames = fs.readdirSync(INPUT_DIR);
	const allCards = fnames.map(fname => INPUT_DIR + fname).flatMap(parseBird);
	// TODO: I'd like something locally random but weighted by freq
	allCards.sort((a, b) => b.freq - a.freq);
	fs.writeFileSync(CARDS_PATH, JSON.stringify(allCards, null, 2), 'utf-8');
	console.log(allCards.length, 'cards');
};

makeAllCards();
