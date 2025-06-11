module.exports = async ( page, scenario, viewport ) => {
	// for debug, loop through all .googlesitekit-data-block__datapoint and set font size to ''

	await page.evaluate( () => {
		const dataBlocks = document.querySelectorAll(
			'.googlesitekit-data-block__datapoint'
		);
		dataBlocks.forEach( ( block ) => {
			console.log( '🚀 ~ onBefore.js ~ block resetting.' );
			block.style.fontSize = '';
		} );
	} );
	// Log the viewport label for debugging
	console.log( `🚀 ${ viewport.label } ~ onBefore.js ~ scenario:`, scenario );
};
