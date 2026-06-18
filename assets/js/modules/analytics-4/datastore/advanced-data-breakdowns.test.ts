/**
 * `modules/analytics-4` data store: advanced data breakdowns tests.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	subscribeUntil,
} from '../../../../../tests/js/utils';
import { MODULES_ANALYTICS_4, PROPERTY_CREATE } from './constants';

describe( 'modules/analytics-4 advanced data breakdowns', () => {
	let registry: WPDataRegistry;

	const propertyID = '123456789';
	const otherPropertyID = '987654321';

	const getEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/advanced-data-breakdowns-settings'
	);
	const saveEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/save-advanced-data-breakdowns-settings'
	);

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	describe( 'actions', () => {
		describe( 'setAdvancedDataBreakdownsEnabled', () => {
			it( 'sets the enabled flag for one property and leaves the other properties unchanged', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAdvancedDataBreakdownsSettings( {
						[ otherPropertyID ]: true,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdvancedDataBreakdownsEnabled( propertyID, true );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAdvancedDataBreakdownsSettings()
				).toEqual( {
					[ otherPropertyID ]: true,
					[ propertyID ]: true,
				} );
			} );

			it( 'requires a valid property ID', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setAdvancedDataBreakdownsEnabled(
							PROPERTY_CREATE,
							true
						)
				).toThrow( 'A valid GA4 propertyID is required.' );
			} );

			it( 'requires the enabled flag to be a boolean', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setAdvancedDataBreakdownsEnabled( propertyID, 'yes' )
				).toThrow( 'enabled should be a boolean.' );
			} );
		} );

		describe( 'saveAdvancedDataBreakdownsSettings', () => {
			it( 'saves the current property map and returns the response', async () => {
				const settings = { [ propertyID ]: true };

				fetchMock.post( saveEndpoint, {
					body: settings,
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdvancedDataBreakdownsEnabled( propertyID, true );

				const { response, error } = await registry
					.dispatch( MODULES_ANALYTICS_4 )
					.saveAdvancedDataBreakdownsSettings();

				expect( response ).toEqual( settings );
				expect( error ).toBeUndefined();
			} );
		} );
	} );

	describe( 'selectors', () => {
		describe( 'isAdvancedDataBreakdownsEnabled', () => {
			it( 'returns undefined while the resolver is pending', () => {
				fetchMock.getOnce( getEndpoint, {
					body: {},
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAdvancedDataBreakdownsEnabled( propertyID )
				).toBeUndefined();
			} );

			it( 'returns false for a property that is not in the property map', async () => {
				fetchMock.getOnce( getEndpoint, {
					body: { [ otherPropertyID ]: true },
					status: 200,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.isAdvancedDataBreakdownsEnabled( propertyID );

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasFinishedResolution(
							'getAdvancedDataBreakdownsSettings',
							[]
						)
				);

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAdvancedDataBreakdownsEnabled( propertyID )
				).toBe( false );
			} );

			it( 'returns the stored flag for the given property', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAdvancedDataBreakdownsSettings( {
						[ propertyID ]: true,
						[ otherPropertyID ]: false,
					} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAdvancedDataBreakdownsEnabled( propertyID )
				).toBe( true );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAdvancedDataBreakdownsEnabled( otherPropertyID )
				).toBe( false );
			} );
		} );

		describe( 'getAdvancedDataBreakdownsSettings', () => {
			it( 'fetches the property map from the GET endpoint via the resolver', async () => {
				fetchMock.getOnce( getEndpoint, {
					body: { [ propertyID ]: true },
					status: 200,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.getAdvancedDataBreakdownsSettings();

				await subscribeUntil( registry, () =>
					registry
						.select( MODULES_ANALYTICS_4 )
						.hasFinishedResolution(
							'getAdvancedDataBreakdownsSettings',
							[]
						)
				);

				expect( fetchMock ).toHaveFetchedTimes( 1 );
				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.getAdvancedDataBreakdownsSettings()
				).toEqual( { [ propertyID ]: true } );
			} );
		} );
	} );
} );
