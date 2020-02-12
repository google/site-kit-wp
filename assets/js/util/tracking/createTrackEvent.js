
/**
 * Internal dependencies
 */
import createDataLayerPush from './createDataLayerPush';

/**
 * Returns a function which, when invoked tracks a single event.
 *
 * @param {Object} config Tracking configuration.
 * @param {Object} dataLayerTarget Data layer parent object.
 * @return {Function} Function that tracks an event.
 */
export default function createTrackEvent( config, dataLayerTarget ) {
	const dataLayerPush = createDataLayerPush( dataLayerTarget );

	/**
	 * Send an Analytics tracking event.
	 *
	 * @param {string} eventCategory The event category. Required.
	 * @param {string} eventName The event category. Required.
	 * @param {string} eventLabel The event category. Optional.
	 * @param {string} eventValue The event category. Optional.
	 */
	return function trackEvent( eventCategory, eventName, eventLabel = '', eventValue = '' ) {
		const {
			isFirstAdmin,
			referenceSiteURL,
			trackingEnabled,
			trackingID,
			userIDHash,
		} = config;

		if ( ! trackingEnabled ) {
			return;
		}

		dataLayerPush( 'event', eventName, {
			send_to: trackingID,
			event_category: eventCategory,
			event_label: eventLabel,
			event_value: eventValue,
			dimension1: referenceSiteURL,
			dimension2: isFirstAdmin ? 'true' : 'false',
			dimension3: userIDHash,
		} );
	};
}
