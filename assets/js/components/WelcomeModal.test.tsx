/**
 * WelcomeModal component tests.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * Internal dependencies
 */
import { render, createTestRegistry } from '../../../tests/js/test-utils';
import {
	provideModules,
	provideUserAuthentication,
} from '../../../tests/js/utils';
import { provideGatheringDataState } from '../../../tests/js/gathering-data-utils';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { MODULE_SLUG_SEARCH_CONSOLE } from '@/js/modules/search-console/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import WelcomeModal from './WelcomeModal';

describe( 'WelcomeModal', () => {
	let registry: ReturnType< typeof createTestRegistry >;

	beforeEach( () => {
		registry = createTestRegistry();
	} );

	it( 'should show the dashboard tour variant when Analytics is connected and not gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_ANALYTICS_4 ]: false,
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveIsDataAvailableOnLoad( true );
		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Initial setup complete! Take a look at the special features Site Kit added to your dashboard based on your site goals'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Take the tour' } )
		).toBeInTheDocument();
	} );

	it( 'should show the dashboard tour variant when Analytics is not connected and Search Console is not gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				'Initial setup complete! Take a look at the special features Site Kit added to your dashboard based on your site goals'
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Maybe later' } )
		).toBeInTheDocument();
		expect(
			getByRole( 'button', { name: 'Take the tour' } )
		).toBeInTheDocument();
	} );

	it( 'should show the gathering data variant when Analytics is connected and gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: false,
		} );

		registry
			.dispatch( MODULES_SEARCH_CONSOLE )
			.receiveIsDataAvailableOnLoad( true );

		// The provideGatheringDataState() helper cannot handle the true case for Analytics 4, due to its dependence on additional state
		// that may vary between test scenarios. Therefore, we must manually set the state here. First, we set user authentication to false
		// to ensure "gathering data" can return true for the Analytics 4 module.
		provideUserAuthentication( registry, { authenticated: false } );

		// Then provide an empty report to ensure "gathering data" is true for Analytics 4.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetReport(
			{},
			{
				options: registry
					.select( MODULES_ANALYTICS_4 )
					.getSampleReportArgs(),
			}
		);

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				/Site Kit is gathering data and soon metrics for your site will show on your dashboard/
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Get started' } )
		).toBeInTheDocument();
	} );

	it( 'should show the gathering data variant when Analytics is not connected and Search Console is gathering data', async () => {
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: false,
				connected: false,
			},
			{
				slug: MODULE_SLUG_SEARCH_CONSOLE,
				active: true,
				connected: true,
			},
		] );

		provideGatheringDataState( registry, {
			[ MODULE_SLUG_SEARCH_CONSOLE ]: true,
		} );

		const { container, getByText, getByRole, waitForRegistry } = render(
			<WelcomeModal />,
			{
				registry,
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `render` is not typed yet.
		) as any;

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect(
			getByText(
				/Site Kit is gathering data and soon metrics for your site will show on your dashboard/
			)
		).toBeInTheDocument();

		expect(
			getByRole( 'button', { name: 'Get started' } )
		).toBeInTheDocument();
	} );
} );
