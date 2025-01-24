/**
 * Hook useDisplayCTAWidget tests.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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

import {
	createTestRegistry,
	muteFetch,
	provideGatheringDataState,
	provideModules,
	renderHook,
} from '../../../../../tests/js/test-utils';
import useDisplayCTAWidget from './useDisplayCTAWidget';
import { CORE_USER } from '../../../googlesitekit/datastore/user/constants';
import { KEY_METRICS_SETUP_CTA_WIDGET_SLUG } from '../constants';
import { MODULES_ANALYTICS_4 } from '../../../modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '../../../modules/search-console/datastore/constants';

describe( 'useDisplayCTAWidget hook', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		provideModules( registry, [
			{
				slug: 'search-console',
				active: true,
				connected: true,
			},
			{
				slug: 'analytics-4',
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			'search-console': false,
			'analytics-4': false,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );
	} );

	it( 'should return true if the CTA widget is not dismissed', async () => {
		const { result } = await renderHook( () => useDisplayCTAWidget(), {
			registry,
		} );

		expect( result.current ).toBe( true );
	} );

	it( 'should return false if the CTA widget is dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ KEY_METRICS_SETUP_CTA_WIDGET_SLUG ] );

		const { result } = await renderHook( () => useDisplayCTAWidget(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'should return false if the CTA widget is being dismissed', async () => {
		registry
			.dispatch( CORE_USER )
			.setIsItemDimissing( KEY_METRICS_SETUP_CTA_WIDGET_SLUG, true );

		const { result } = await renderHook( () => useDisplayCTAWidget(), {
			registry,
		} );

		expect( result.current ).toBe( false );
	} );

	it( 'should return false if the Analytics data is not available on load', async () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( false );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/data-available'
			)
		);

		const { result, waitForRegistry } = await renderHook(
			() => useDisplayCTAWidget(),
			{
				registry,
			}
		);

		await waitForRegistry();

		expect( result.current ).toBe( false );
	} );

	it( 'should return false if the Search Console data is not available on load', async () => {
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( false );

		muteFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/search-console/data/data-available'
			)
		);

		const { result, waitForRegistry } = await renderHook(
			() => useDisplayCTAWidget(),
			{
				registry,
			}
		);

		await waitForRegistry();
		expect( result.current ).toBe( false );
	} );
} );
