/**
 * Handles clicks on Contribute buttons.
 *
 * @since 1.29.0
 *
 * @param {*} swg Subscribe with Google API.
 */
export function handleContributeClicks( swg ) {
	const contributeButtons = new Set(
		[].concat(
			Array.from( document.querySelectorAll( '.swg-contribute-button' ) ),
			Array.from( document.querySelectorAll( 'a[href="#swg-contribute"]' ) )
		)
	);
	for ( const contributeButton of contributeButtons ) {
		contributeButton.addEventListener( 'click', () => {
			const skus = getPlayOffersFromElement( contributeButton );
			swg.showContributionOptions( { skus, isClosable: true } );
		} );
	}
}

/**
 * Handles clicks on Subscribe buttons.
 *
 * @since 1.29.0
 *
 * @param {*} swg Subscribe with Google API.
 */
export function handleSubscribeClicks( swg ) {
	const subscribeButtons = new Set(
		[].concat(
			Array.from( document.querySelectorAll( '.swg-subscribe-button' ) ),
			Array.from( document.querySelectorAll( 'a[href="#swg-subscribe"]' ) )
		)
	);
	for ( const subscribeButton of subscribeButtons ) {
		subscribeButton.addEventListener( 'click', () => {
			const skus = getPlayOffersFromElement( subscribeButton );
			swg.showOffers( { skus, isClosable: true } );
		} );
	}
}

/**
 * Gets a list of Play Offers from a given Element.
 *
 * @since 1.29.0
 *
 * @param {!Element} el Element to extract Play Offers from.
 * @return {string[]} List of Play Offers.
 */
function getPlayOffersFromElement( el ) {
	if ( ! el.dataset.playOffers ) {
		return [];
	}

	return el.dataset.playOffers
		.trim()
		.split( ',' )
		.map( ( p ) => p.trim() );
}
