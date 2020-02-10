
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
 * @param {Object} newConfig New configuration.
 * @return {Object} Tracking config.
 */
export default function createTracking( newConfig ) {
	const config = {
		...DEFAULT_CONFIG,
		...newConfig,
	};
	// Remove any trailing slash from the reference URL.
	if ( config.referenceSiteURL ) {
		config.referenceSiteURL = config.referenceSiteURL.toString().replace( /\/+$/, '' );
	}

	return {
		enableTracking: createEnableTracking( config ),
		disableTracking: function disableTracking() {
			config.trackingEnabled = false;
		},
		isTrackingEnabled: function isTrackingEnabled() {
			return !! config.trackingEnabled;
		},
		trackEvent: createTrackEvent( config ),
	};
}
