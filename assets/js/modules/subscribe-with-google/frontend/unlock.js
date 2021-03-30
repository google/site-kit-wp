import { $, $$ } from './utils/dom';

/** Local storage key where SwG entitlements are cached. */
export const CACHE_KEY = 'subscribewithgoogle-entitlements-cache';

/**
 * Unlocks current page, if possible.
 *
 * @since 1.29.0
 *
 * @param {*} swg Subscribe with Google API.
 */
export async function unlockPageMaybe( swg ) {
	const $article = $( 'article' );
	if ( ! $article ) {
		return;
	}

	const product = getProduct();
	if ( ! product ) {
		return;
	}

	const entitled = await userIsEntitledToProduct( product, swg );
	if ( entitled ) {
		$article.classList.add( 'swg--page-is-unlocked' );
	} else {
		$article.classList.add( 'swg--page-is-locked' );
	}
}

/**
 * Returns current page's SwG product.
 *
 * @since 1.29.0
 *
 * @return {?string} Current page's SwG product.
 */
function getProduct() {
	const linkingDataScripts = $$( 'script[type="application/ld+json"]' );
	for ( const linkingDataScript of linkingDataScripts ) {
		const linkingData = JSON.parse( linkingDataScript.innerText );
		if ( linkingData.isPartOf && linkingData.isPartOf.productID ) {
			return linkingData.isPartOf.productID;
		}
	}
	return null;
}

/**
 * Returns true if user is entitled to a given product.
 *
 * @since 1.29.0
 *
 * @param {string} product Product user might be entitled to.
 * @param {*}      swg     Subscribe with Google API.
 * @return {boolean} True if user is entitled to the product.
 */
async function userIsEntitledToProduct( product, swg ) {
	if ( cacheEntitlesUserToProduct( product ) ) {
		return true;
	}

	// Fetch and cache entitlements.
	const products = await fetchEntitlements( swg );
	updateCache( products );
	return products.indexOf( product ) > -1;
}

/**
 * Returns true if the cache entitles user to a given product via cache.
 *
 * @since 1.29.0
 *
 * @param {string} product Product user might be entitled to.
 * @return {boolean} True if user is entitled to the product.
 */
function cacheEntitlesUserToProduct( product ) {
	try {
		const cache = JSON.parse( global.localStorage[ CACHE_KEY ] );
		if ( cache.expiration < Date.now() ) {
			return false;
		}
		const entitled = cache.products.indexOf( product ) > -1;
		return entitled;
	} catch ( err ) {
		return false;
	}
}

/**
 * Updates caches with unlocked products.
 *
 * @since 1.29.0
 *
 * @param {string[]} products Unlocked products.
 */
function updateCache( products ) {
	try {
		// 6 hours.
		const expiration = Date.now() + ( 1000 * 60 * 60 * 6 );
		const cache = {
			expiration,
			products,
		};
		global.localStorage[ CACHE_KEY ] = JSON.stringify( cache );
	} catch ( err ) {
		// Sometimes privacy is more important than convenience.
	}
}

/**
 * Returns entitlements response.
 *
 * @since 1.29.0
 *
 * @param {*} swg Subscribe with Google API.
 * @return {Promise<!Array<string>>} Unlocked products.
 */
async function fetchEntitlements( swg ) {
	// Note: We might fetch entitlements with 1p cookies in the future.
	return fetchEntitledProductsWith3pCookie( swg );
}

/**
 * Returns unlocked products with a 3rd party cookie.
 *
 * @since 1.29.0
 *
 * @param {*} swg Subscribe with Google API.
 * @return {Promise<!Array<string>>} Unlocked products.
 */
async function fetchEntitledProductsWith3pCookie( swg ) {
	return swg.getEntitlements()
		.catch( () => ( {} ) )
		.then( extractProductsFromEntitlementsResponse );
}

/**
 * Returns set of products from an entitlements response.
 *
 * @since 1.29.0
 *
 * @param {*} response Entitlements response.
 * @return {!Array<string>} Products the user owns.
 */
function extractProductsFromEntitlementsResponse( response ) {
	const products = [];
	const entitlements = response.entitlements || [];
	for ( const entitlement of entitlements ) {
		products.push( ...entitlement.products );
	}
	return products;
}
