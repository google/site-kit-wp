/**
 * Internal dependencies
 */
import createInitializeSnippet from './createInitializeSnippet';
import createTrackEvent from './createTrackEvent';

const DEFAULT_CONFIG = {
	activeModules: [],
	isAuthenticated: false,
	referenceSiteURL: '',
	trackingEnabled: false,
	trackingID: '',
	userIDHash: '',
	userRoles: [],
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
export default function createTracking(
	newConfig,
	dataLayerTarget = global,
	_global = global
) {
	const config = {
		...DEFAULT_CONFIG,
		...newConfig,
	};
	// Remove any trailing slash from the reference URL.
	if ( config.referenceSiteURL ) {
		config.referenceSiteURL = config.referenceSiteURL
			.toString()
			.replace( /\/+$/, '' );
	}
	const initializeSnippet = createInitializeSnippet(
		config,
		dataLayerTarget
	);

	return {
		enableTracking: function enableTracking() {
			config.trackingEnabled = true;
		},
		disableTracking: function disableTracking() {
			config.trackingEnabled = false;
		},
		initializeSnippet,
		isTrackingEnabled: function isTrackingEnabled() {
			return !! config.trackingEnabled;
		},
		trackEvent: createTrackEvent(
			config,
			dataLayerTarget,
			initializeSnippet,
			_global
		),
	};
}
