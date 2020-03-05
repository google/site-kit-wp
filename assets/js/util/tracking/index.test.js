
/**
 * Internal dependencies
 */
import createTracking from './createTracking';
import {
	DATA_LAYER,
	disableTracking,
	enableTracking,
	isTrackingEnabled,
} from './index';

const resetGlobals = () => {
	delete global._googlesitekitBaseData;
	delete global[ DATA_LAYER ];
};

describe( 'createTracking', () => {
	afterEach( resetGlobals );
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
	afterEach( resetGlobals );

	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBaseData = { trackingEnabled: true };

		disableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( false );
		expect( global._googlesitekitBaseData.trackingEnabled ).toStrictEqual( true );
	} );
} );

describe( 'enableTracking and isTrackingEnabled', () => {
	afterEach( resetGlobals );

	it( 'does not mutate global tracking settings when toggling active state', () => {
		global._googlesitekitBaseData = { trackingEnabled: false };

		enableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( true );
		expect( global._googlesitekitBaseData.trackingEnabled ).toStrictEqual( false );
	} );
} );

describe( 'trackEvent', () => {
	afterEach( resetGlobals );

	it( 'adds a tracking event to the dataLayer', () => {
		const config = {
			referenceSiteURL: 'https://www.example.com/',
			userIDHash: 'a1b2c3',
			trackingID: 'UA-12345678-1',
			isFirstAdmin: true,
			trackingEnabled: true,
		};

		const push = jest.fn();
		const dataLayer = {
			[ DATA_LAYER ]: { push },
		};
		const { trackEvent } = createTracking( config, dataLayer );

		trackEvent( 'category', 'name', 'label', 'value' );

		function makeArguments() {
			return arguments;
		}
		// dataLayerPush must push an instance of `Arguments` onto the data layer.
		// Because `arguments` is a special, `Array`-like object (but not an actual `Array`),
		// we can only create it using the magic `arguments` variable
		// made available to normal, non-arrow functions.
		expect( push ).toHaveBeenCalledWith(
			makeArguments(
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
				}
			)
		);
	} );
} );
