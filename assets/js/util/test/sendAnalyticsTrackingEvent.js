/**
 * Internal dependencies
 */
import { sendAnalyticsTrackingEvent } from '../';

describe( 'sendAnalyticsTrackingEvent', () => {
	it( 'sends a tracking event', () => {
		// eslint-disable-next-line no-undef
		global.googlesitekit.admin.trackingOptin = true;
		// eslint-disable-next-line no-undef
		global.googlesitekit.setup.isFirstAdmin = true;

		const expected = '{"type":"event","name":"name","sendto":{"event_category":"category","event_label":"label","event_value":"value","dimension1":"","dimension2":"true"}}';
		const actual = JSON.stringify( sendAnalyticsTrackingEvent( 'category', 'name', 'label', 'value' ) );

		expect( actual ).toStrictEqual( expected );
	} );
} );
