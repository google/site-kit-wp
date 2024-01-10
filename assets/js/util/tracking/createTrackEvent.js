/**
 * Internal dependencies
 */
import createDataLayerPush from './createDataLayerPush';

/**
 * Returns a function which, when invoked tracks a single event.
 *
 * @since 1.3.0
 *
 * @param {Object}   config            Tracking configuration.
 * @param {Object}   dataLayerTarget   Data layer parent object.
 * @param {Function} initializeSnippet Function to initialize tracking.
 * @param {Object}   _global           The global window object.
 * @return {Function} Function that tracks an event.
 */
export default function createTrackEvent(
	config,
	dataLayerTarget,
	initializeSnippet,
	_global
) {
	const dataLayerPush = createDataLayerPush( dataLayerTarget );

	/**
	 * Send an Analytics tracking event.
	 *
	 * @since 1.3.0
	 *
	 * @param {string} category The category of the event.
	 * @param {string} action   The action name of the event.
	 * @param {string} [label]  Optional. The label of the event.
	 * @param {number} [value]  Optional. A non-negative integer that will appear as the event value.
	 * @return {Promise} Promise that always resolves.
	 */
	// eslint-disable-next-line require-await
	return async function trackEvent( category, action, label, value ) {
		const { trackingEnabled } = config;

		if ( ! trackingEnabled ) {
			// Resolve immediately if tracking is disabled.
			return;
		}

		initializeSnippet();

		const eventData = {
			send_to: 'site_kit',
			event_category: category,
			event_label: label,
			value,
		};

		return new Promise( ( resolve ) => {
			// This timeout ensures a tracking event does not block the user
			// event if it is not sent (in time).
			// If the event beacon fails, it shouldn't reject the promise since event
			// tracking should not result in user-facing errors. It will just
			// trigger a console warning.
			const failCallback = () => {
				_global.console.warn(
					`Tracking event "${ action }" (category "${ category }") took too long to fire.`
				);
				resolve();
			};
			const failTimeout = setTimeout( failCallback, 1000 );
			// eslint-disable-next-line camelcase
			const event_callback = () => {
				clearTimeout( failTimeout );
				resolve();
			};

			dataLayerPush( 'event', action, { ...eventData, event_callback } );

			// If the client-side opt-out is present, the event_callback will never be called
			// so we call it here to prevent the warning and added delay.
			if ( _global._gaUserPrefs?.ioo?.() ) {
				event_callback();
			}
		} );
	};
}
