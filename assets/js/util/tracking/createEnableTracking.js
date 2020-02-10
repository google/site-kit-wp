/**
 * Internal dependencies
 */
import createDataLayerPush from './createDataLayerPush';
import {
	DATA_LAYER,
	SCRIPT_IDENTIFIER,
} from './index.private';

export default function createEnableTracking( config ) {
	const dataLayerPush = createDataLayerPush( global );

	/**
	 * Enables tracking by injecting the necessary script tag if not present.
	 */
	return function enableTracking() {
		config.trackingEnabled = true;

		const { document } = global;

		if ( document.querySelector( `script[${ SCRIPT_IDENTIFIER }]` ) ) {
			return;
		}

		// If not present, inject it and initialize dataLayer.
		const scriptTag = document.createElement( 'script' );
		scriptTag.setAttribute( SCRIPT_IDENTIFIER, '' );
		scriptTag.async = true;
		scriptTag.src = `https://www.googletagmanager.com/gtag/js?id=${ config.trackingID }&l=${ DATA_LAYER }`;
		document.head.appendChild( scriptTag );

		dataLayerPush( 'js', new Date() );
		dataLayerPush( 'config', config.trackingID );
	};
}
