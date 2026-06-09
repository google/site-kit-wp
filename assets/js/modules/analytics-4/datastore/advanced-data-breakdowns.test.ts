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
import { MODULES_ANALYTICS_4 } from './constants';

describe( 'modules/analytics-4 advanced data breakdowns', () => {
	let registry: WPDataRegistry;

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
			it( 'should set the enabled flag in local state', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdvancedDataBreakdownsEnabled( true );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAdvancedDataBreakdownsEnabled()
				).toBe( true );
			} );

			it( 'should validate the enabled flag is a boolean', () => {
				expect( () =>
					registry
						.dispatch( MODULES_ANALYTICS_4 )
						.setAdvancedDataBreakdownsEnabled( 'yes' )
				).toThrow( 'enabled should be a boolean.' );
			} );
		} );

		describe( 'saveAdvancedDataBreakdownsSettings', () => {
			it( 'should POST the current settings and return the response', async () => {
				const settings = { enabled: true };

				fetchMock.post( saveEndpoint, {
					body: settings,
					status: 200,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdvancedDataBreakdownsEnabled( true );

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
			it( 'should return undefined while the resolver is pending', () => {
				fetchMock.getOnce( getEndpoint, {
					body: { enabled: false },
					status: 200,
				} );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAdvancedDataBreakdownsEnabled()
				).toBeUndefined();
			} );

			it( 'should return the enabled flag after the resolver completes', async () => {
				fetchMock.getOnce( getEndpoint, {
					body: { enabled: true },
					status: 200,
				} );

				registry
					.select( MODULES_ANALYTICS_4 )
					.isAdvancedDataBreakdownsEnabled();

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
						.isAdvancedDataBreakdownsEnabled()
				).toBe( true );
			} );

			it( 'should reflect the local state set by setAdvancedDataBreakdownsEnabled', () => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setAdvancedDataBreakdownsEnabled( false );

				expect(
					registry
						.select( MODULES_ANALYTICS_4 )
						.isAdvancedDataBreakdownsEnabled()
				).toBe( false );
			} );
		} );

		describe( 'getAdvancedDataBreakdownsSettings', () => {
			it( 'should fetch the settings from the GET endpoint via the resolver', async () => {
				fetchMock.getOnce( getEndpoint, {
					body: { enabled: true },
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
				).toEqual( { enabled: true } );
			} );
		} );
	} );
} );
