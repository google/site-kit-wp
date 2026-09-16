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
import { createTestRegistry } from '@tests/js/utils';
import { useChangeMetricsFeatureTourEffect } from './useChangeMetricsFeatureTourEffect';

jest.mock( '@/js/feature-tours/shared-key-metrics', () => ( {
	slug: 'mocked-tour',
} ) );

const DASHBOARD_URL =
	'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard';
const WELCOME_MODAL_URL = `${ DASHBOARD_URL }&notification=initial_setup_success`;

describe( 'useChangeMetricsFeatureTourEffect', () => {
	mockLocation();

	let registry: WPDataRegistry;
	let dismissTourSpy: jest.SpyInstance;

	beforeEach( () => {
		global.location.href = DASHBOARD_URL;
		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetDismissedTours( [] );
		dismissTourSpy = jest.spyOn(
			registry.dispatch( CORE_USER ),
			'dismissTour'
		);
		dismissTourSpy.mockImplementation( () => {} );
	} );

	it( 'should dismiss the tour when the welcome modal is present', () => {
		global.location.href = WELCOME_MODAL_URL;

		renderHook( () => useChangeMetricsFeatureTourEffect(), {
			registry,
			features: [ 'setupFlowRefresh' ],
		} );

		expect( dismissTourSpy ).toHaveBeenCalledWith( 'mocked-tour' );
	} );

	it( 'should not dismiss the tour when the welcome modal is present and the tour is already dismissed', () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedTours( [ 'mocked-tour' ] );
		global.location.href = WELCOME_MODAL_URL;

		renderHook( () => useChangeMetricsFeatureTourEffect(), {
			registry,
			features: [ 'setupFlowRefresh' ],
		} );

		expect( dismissTourSpy ).not.toHaveBeenCalled();
	} );

	it( 'should not dismiss the tour when the welcome modal is not present', () => {
		renderHook( () => useChangeMetricsFeatureTourEffect(), {
			registry,
			features: [ 'setupFlowRefresh' ],
		} );

		expect( dismissTourSpy ).not.toHaveBeenCalled();
	} );

	it( 'should not dismiss the tour when setupFlowRefresh is disabled', () => {
		global.location.href = WELCOME_MODAL_URL;

		renderHook( () => useChangeMetricsFeatureTourEffect(), {
			registry,
		} );

		expect( dismissTourSpy ).not.toHaveBeenCalled();
	} );
} );
