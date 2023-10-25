const diffuse1Elem = (haystack) => {
	const hereIndex = Math.floor(haystack.length * Math.random());
	const neighIndex = Math.random() < 0.5
		? Math.max(hereIndex - 1, 0)
		: Math.min(haystack.length - 1, hereIndex + 1);

	const hereElem = haystack[hereIndex];
	const neighElem = haystack[neighIndex];
	haystack[neighIndex] = hereElem;
	haystack[hereIndex] = neighElem;
};

const diffuse1Pass = (haystack) => {
	for (let _ = 0; _ < haystack.length; _++) {
		diffuse1Elem(haystack);
	}
};

const diffuseSort = (haystack, sortFn) => {
	// First, sort it perfectly
	haystack.sort(sortFn);
	const nbSteps = Math.floor(haystack.length / 2)
	for (let _ = 0; _ < nbSteps; _++) {
		diffuse1Pass(haystack);
	}
};

module.exports = { diffuseSort };
