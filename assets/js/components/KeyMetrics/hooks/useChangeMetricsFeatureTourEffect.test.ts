/**
 * Hook useChangeMetricsFeatureTourEffect tests.
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
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { renderHook } from '@tests/js/test-utils';
import {
	createTestRegistry,
	provideSiteInfo,
	provideUserInfo,
} from '@tests/js/utils';
import { useChangeMetricsFeatureTourEffect } from './useChangeMetricsFeatureTourEffect';

jest.mock( '@/js/feature-tours/shared-key-metrics', () => ( {
	slug: 'mocked-tour',
} ) );

describe( 'useChangeMetricsFeatureTourEffect', () => {
	mockLocation();

	let registry: WPDataRegistry;
	let triggerOnDemandTourSpy: jest.SpyInstance;
	let dismissTourSpy: jest.SpyInstance;

	beforeEach( () => {
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
		triggerOnDemandTourSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'triggerOnDemandTour'
		);
		dismissTourSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'dismissTour'
		);
		dismissTourSpy.mockImplementation( () => {} );
	} );

	it( 'should trigger Key Metrics feature tour when conditions are met', () => {
		provideUserInfo( registry, {
			id: 2,
		} );
		provideSiteInfo( registry, {
			keyMetricsSetupCompletedBy: 1,
		} );

		renderHook(
			() =>
				useChangeMetricsFeatureTourEffect( {
					renderChangeMetricLink: true,
				} ),
			{
				registry,
			}
		);

		expect( triggerOnDemandTourSpy ).toHaveBeenCalledWith( {
			slug: 'mocked-tour',
		} );
	} );

	it.each( [
		[ 1, 2, false ],
		[ 2, 1, false ],
		[ 1, 1, false ],
		[ 1, 1, true ],
	] )(
		'should not trigger Key Metrics feature tour when current user is %s, key metrics were set up by %s and renderChangeMetricLink is %s',
		( userID, keyMetricsSetupCompletedBy, renderChangeMetricLink ) => {
			provideUserInfo( registry, {
				id: userID,
			} );
			provideSiteInfo( registry, {
				keyMetricsSetupCompletedBy,
			} );

			renderHook(
				() =>
					useChangeMetricsFeatureTourEffect( {
						renderChangeMetricLink,
					} ),
				{
					registry,
				}
			);

			expect( triggerOnDemandTourSpy ).not.toHaveBeenCalled();
		}
	);

	it( 'should not trigger Key Metrics feature tour when welcome modal is present', () => {
		provideUserInfo( registry, {
			id: 2,
		} );
		provideSiteInfo( registry, {
			keyMetricsSetupCompletedBy: 1,
		} );
		global.location.href =
			'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&notification=initial_setup_success';

		renderHook(
			() =>
				useChangeMetricsFeatureTourEffect( {
					renderChangeMetricLink: true,
				} ),
			{
				registry,
				features: [ 'setupFlowRefresh' ],
			}
		);

		expect( triggerOnDemandTourSpy ).not.toHaveBeenCalled();
		expect( dismissTourSpy ).toHaveBeenCalledWith( 'mocked-tour' );
	} );

	it( 'should not call dismissTour when welcome modal is present and tour is already dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedTours( [ 'mocked-tour' ] );
		provideUserInfo( registry, {
			id: 2,
		} );
		provideSiteInfo( registry, {
			keyMetricsSetupCompletedBy: 1,
		} );
		global.location.href =
			'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&notification=initial_setup_success';

		renderHook(
			() =>
				useChangeMetricsFeatureTourEffect( {
					renderChangeMetricLink: true,
				} ),
			{ registry, features: [ 'setupFlowRefresh' ] }
		);

		expect( triggerOnDemandTourSpy ).not.toHaveBeenCalled();
		expect( dismissTourSpy ).not.toHaveBeenCalled();
	} );
} );
