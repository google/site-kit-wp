/**
 * Internal dependencies
 */
import { sendAnalyticsTrackingEvent } from '../';

describe( 'sendAnalyticsTrackingEvent', () => {
	it( 'sends a tracking event', () => {
		// eslint-disable-next-line no-undef
		global.googlesitekitTrackingEnabled = true;
		// eslint-disable-next-line no-undef
		global._googlesitekitBase = {
			referenceSiteURL: 'https://www.example.com/',
			userIDHash: 'a1b2c3',
			trackingID: 'UA-12345678-1',
			isFirstAdmin: true,
		};

		const expected = '{"type":"event","name":"name","sendto":{"send_to":"UA-12345678-1","event_category":"category","event_label":"label","event_value":"value","dimension1":"https://www.example.com","dimension2":"true","dimension3":"a1b2c3"}}';
		const actual = JSON.stringify( sendAnalyticsTrackingEvent( 'category', 'name', 'label', 'value' ) );

		expect( actual ).toStrictEqual( expected );
	} );
} );
