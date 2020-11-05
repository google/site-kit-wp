
/**
 * Internal dependencies
 */
import createDataLayerPush from './createDataLayerPush';

/**
 * Returns a function which, when invoked tracks a single event.
 *
 * @since 1.3.0
 *
 * @param {Object} config          Tracking configuration.
 * @param {Object} dataLayerTarget Data layer parent object.
 * @param {Object} _global         The global window object.
 * @return {Function} Function that tracks an event.
 */
export default function createTrackEvent( config, dataLayerTarget, _global ) {
	const dataLayerPush = createDataLayerPush( dataLayerTarget );

	/**
	 * Send an Analytics tracking event.
	 *
	 * @since 1.3.0
	 *
	 * @param {string} category The category of the event.
	 * @param {string} action   The value that will appear as the event action in Google Analytics Event reports.
	 * @param {string} [label]  The label of the event. Optional.
	 * @param {number} [value]  A non-negative integer that will appear as the event value. Optional.
	 * @return {Promise} Promise that always resolves.
	 */
	return async function trackEvent( category, action, label, value ) {
		const {
			isFirstAdmin,
			referenceSiteURL,
			trackingEnabled,
			trackingID,
			userIDHash,
		} = config;

		if ( _global._gaUserPrefs?.ioo?.() ) {
			return;
		}

		if ( ! trackingEnabled ) {
			// Resolve immediately if tracking is disabled.
			return;
		}

		const eventData = {
			send_to: trackingID,
			event_category: category,
			event_label: label,
			value,
			dimension1: referenceSiteURL,
			dimension2: isFirstAdmin ? 'true' : 'false',
			dimension3: userIDHash,
		};

		return new Promise( ( resolve ) => {
			// This timeout ensures a tracking event does not block the user
			// event if it is not sent (in time).
			// If this fails, it shouldn't reject the promise since event
			// tracking should not result in user-facing errors. It will just
			// trigger a console warning.
			const failTimeout = setTimeout( () => {
				global.console.warn( `Tracking event "${ action }" (category "${ category }") took too long to fire.` );
				resolve();
			}, 1000 );

			dataLayerPush( 'event', action, {
				...eventData,
				event_callback: () => {
					clearTimeout( failTimeout );
					resolve();
				},
			} );
		} );
	};
}
