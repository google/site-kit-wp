
/**
 * Internal dependencies
 */
import createTracking from './createTracking';
import {
	disableTracking,
	enableTracking,
	isTrackingEnabled,
} from '.';
import {
	DATA_LAYER,
} from './index.private';

/**
 * Note: The global document object is provided by Jest using JSDOM.
 * This is necessary for `querySelector` and `createElement` calls to not raise errors.
 */

describe( 'createTracking', () => {
	it( 'initializes disabled tracking based on user preference', () => {
		const { isTrackingEnabled: isEnabled } = createTracking( { trackingEnabled: false } );

		expect( isEnabled() ).toStrictEqual( false );
	} );

	it( 'initializes enabled tracking based on user preference', () => {
		const { isTrackingEnabled: isEnabled } = createTracking( { trackingEnabled: true } );

		expect( isEnabled() ).toStrictEqual( true );
	} );
} );

describe( 'disableTracking and isTrackingEnabled', () => {
	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBase = { trackingEnabled: true };

		disableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( false );
		expect( global._googlesitekitBase.trackingEnabled ).toStrictEqual( true );
	} );
} );

describe( 'enableTracking and isTrackingEnabled', () => {
	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBase = { trackingEnabled: false };

		enableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( true );
		expect( global._googlesitekitBase.trackingEnabled ).toStrictEqual( false );
	} );
} );

describe( 'trackEvent', () => {
	it( 'adds a tracking event to the dataLayer', () => {
		const config = {
			referenceSiteURL: 'https://www.example.com/',
			userIDHash: 'a1b2c3',
			trackingID: 'UA-12345678-1',
			isFirstAdmin: true,
			trackingEnabled: true,
		};

		const push = jest.fn();
		global[ DATA_LAYER ] = { push };
		const { trackEvent } = createTracking( config );

		trackEvent( 'category', 'name', 'label', 'value' );

		expect( push ).toHaveBeenCalledWith( [
			'event',
			'name',
			{
				send_to: config.trackingID,
				event_category: 'category',
				event_label: 'label',
				event_value: 'value',
				dimension1: 'https://www.example.com',
				dimension2: 'true',
				dimension3: config.userIDHash,
			},
		] );
	} );
} );
