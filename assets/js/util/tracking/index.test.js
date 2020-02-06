/**
 * Internal dependencies
 */
import {
	bootstrapTracking,
	DATA_LAYER,
	disableTracking,
	enableTracking,
	isTrackingEnabled,
	trackEvent,
} from './index.private';

/**
 * Note: The global document object is provided by Jest using JSDOM.
 * This is necessary for `querySelector` and `createElement` calls to not raise errors.
 */

describe( 'bootstrapTracking', () => {
	it( 'initializes tracking based on user preference', () => {
		const _global = {
			_googlesitekitBase: { trackingEnabled: false },
			document: global.document,
			[ DATA_LAYER ]: {
				push: jest.fn(),
			},
		};
		bootstrapTracking( _global );

		expect( isTrackingEnabled() ).toStrictEqual( false );
	} );
} );

describe( 'disableTracking and isTrackingEnabled', () => {
	it( 'does not mutate global tracking settings when toggling active state', () => {
		const _global = {
			_googlesitekitBase: { trackingEnabled: true },
			document: global.document,
			[ DATA_LAYER ]: {
				push: jest.fn(),
			},
		};
		bootstrapTracking( _global );

		expect( isTrackingEnabled() ).toStrictEqual( true );

		disableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( false );
	} );
} );

describe( 'enableTracking and isTrackingEnabled', () => {
	it( 'does not mutate global tracking settings when toggling active state', () => {
		const _global = {
			_googlesitekitBase: { trackingEnabled: false },
			document: global.document,
			[ DATA_LAYER ]: {
				push: jest.fn(),
			},
		};
		bootstrapTracking( _global );

		expect( isTrackingEnabled() ).toStrictEqual( false );

		enableTracking();

		expect( isTrackingEnabled() ).toStrictEqual( true );
	} );
} );

describe( 'trackEvent', () => {
	it( 'adds a tracking event to the dataLayer', () => {
		const _googlesitekitBase = {
			referenceSiteURL: 'https://www.example.com/',
			userIDHash: 'a1b2c3',
			trackingID: 'UA-12345678-1',
			isFirstAdmin: true,
			trackingEnabled: true,
		};
		const _global = {
			_googlesitekitBase,
			[ DATA_LAYER ]: {
				push: jest.fn(),
			},
			document: global.document,
		};
		bootstrapTracking( _global );

		trackEvent( 'category', 'name', 'label', 'value' );

		expect( _global[ DATA_LAYER ].push ).toHaveBeenCalledWith( [
			'event',
			'name',
			{
				send_to: _googlesitekitBase.trackingID,
				event_category: 'category',
				event_label: 'label',
				event_value: 'value',
				dimension1: 'https://www.example.com',
				dimension2: 'true',
				dimension3: _googlesitekitBase.userIDHash,
			},
		] );
	} );
} );
