/**
 * Internal dependencies
 */
import { bootstrapTracking, DATA_LAYER, trackEvent } from './index.private';

describe( 'trackEvent', () => {
	it( 'sends a tracking event', () => {
		const _googlesitekitBase = {
			referenceSiteURL: 'https://www.example.com/',
			userIDHash: 'a1b2c3',
			trackingID: 'UA-12345678-1',
			isFirstAdmin: true,
			trackingEnabled: true,
		};

		bootstrapTracking( { _googlesitekitBase } );

		const _global = {
			_googlesitekitBase,
			[ DATA_LAYER ]: {
				push: jest.fn(),
			},
		};

		trackEvent( 'category', 'name', 'label', 'value', _global );

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
