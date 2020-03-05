/**
 * Internal dependencies
 */
import createDataLayerPush from './createDataLayerPush';
import {
	DATA_LAYER,
	SCRIPT_IDENTIFIER,
} from './index';

/**
 * Returns a function which, when invoked enables tracking and injects the gtag script if necessary.
 *
 * @param {Object} config Tracking configuration.
 * @param {Object} dataLayerTarget Data layer parent object.
 * @return {Function} Function that tracks an event.
 */
export default function createEnableTracking( config, dataLayerTarget ) {
	const dataLayerPush = createDataLayerPush( dataLayerTarget );

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
