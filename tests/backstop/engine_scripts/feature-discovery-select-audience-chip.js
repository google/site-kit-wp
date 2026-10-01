module.exports = async ( page, scenario, viewport ) => {
	await require( './puppet/onReady' )( page, scenario, viewport );

	const audienceChipSelector =
		'.googlesitekit-category-filter-chips .mdc-chip[data-chip-id="audience"]';
	const allServicesChipSelector =
		'.googlesitekit-category-filter-chips .mdc-chip[data-chip-id="all-services"]';

	await page.waitForSelector( audienceChipSelector );
	await page.click( audienceChipSelector );

	// Ensure the click affected selection before capture.
	await page.waitForFunction(
		( audienceSel, allSel ) => {
			const audienceChip = document.querySelector( audienceSel );
			const allServicesChip = document.querySelector( allSel );

			if ( ! audienceChip || ! allServicesChip ) {
				return false;
			}

			return (
				audienceChip.classList.contains( 'mdc-chip--selected' ) &&
				! allServicesChip.classList.contains( 'mdc-chip--selected' )
			);
		},
		{},
		audienceChipSelector,
		allServicesChipSelector
	);
};
