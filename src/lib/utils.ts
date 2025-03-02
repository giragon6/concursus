export function randomNumberBetween(min = 0, max = 1000) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

export function getRandomDateBefore(startingDate = new Date()) {
	const randomNumberOfDays = randomNumberBetween(20, 80);
	const randomDate = new Date(
		startingDate.getTime() - randomNumberOfDays * 24 * 60 * 60 * 1000
	);
	return randomDate;
}

export function getRandomDateAfter(startingDate = new Date()) {
	const randomNumberOfDays = randomNumberBetween(1, 19);
	const randomDate = new Date(
		startingDate.getTime() + randomNumberOfDays * 24 * 60 * 60 * 1000
	);
	return randomDate;
}

export function getRandomUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}