
/**
 * Internal dependencies
 */
import createEnableTracking from './createEnableTracking';
import createTrackEvent from './createTrackEvent';

const DEFAULT_CONFIG = {
	isFirstAdmin: false,
	trackingEnabled: false,
	trackingID: '',
	referenceSiteURL: '',
	userIDHash: '',
};

/**
 * Initializes tracking.
 *
 * @since 1.3.0
 *
 * @param {Object} newConfig       New configuration.
 * @param {Object} dataLayerTarget Data layer parent object.
 * @param {Object} _global         The global window object.
 * @return {Object} Tracking config.
 */
export default function createTracking( newConfig, dataLayerTarget = global, _global = global ) {
	const config = {
		...DEFAULT_CONFIG,
		...newConfig,
	};
	// Remove any trailing slash from the reference URL.
	if ( config.referenceSiteURL ) {
		config.referenceSiteURL = config.referenceSiteURL.toString().replace( /\/+$/, '' );
	}

	return {
		enableTracking: createEnableTracking( config, dataLayerTarget ),
		disableTracking: function disableTracking() {
			config.trackingEnabled = false;
		},
		isTrackingEnabled: function isTrackingEnabled() {
			return !! config.trackingEnabled;
		},
		trackEvent: createTrackEvent( config, dataLayerTarget, _global ),
	};
}
