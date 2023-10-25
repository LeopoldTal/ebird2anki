// Quick and dirty snippet to get birds from a region page
freq_threshold = 0.0015 // percent
birds = Array.from(document.querySelectorAll('.ProgressBar'))
	.map(e => e.parentElement) // all species with a measurable frequency
	.map(e => ({
		e,
		freq: parseFloat(e.textContent.split('%')[0].trim())
	}))
	.filter(({ freq }) => freq > freq_threshold) // remove extreme rarities
	.map(({ e, freq }) => ({
		a: e.parentElement.parentElement.querySelector('h5 a'),
		freq
	}))
	.filter(e => e.a) // only species with a page (e.g. no spuhs)
	.map(({ a, freq }) => ({
		url: a.href.split('/').slice(0, 5).join('/') + '/',
		common: a.firstChild.textContent.trim(),
		sci: a.firstElementChild.textContent.trim(),
		freq
	})).sort((a, b) => b.freq - a.freq); // most to least frequent
console.log(
	birds
		.map(({ common, sci, url, freq }) => `${common}\t${sci}\t${url}\t${freq}\n`)
		.join('')
)
