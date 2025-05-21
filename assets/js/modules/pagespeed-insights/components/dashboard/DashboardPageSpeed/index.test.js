/**
 * DashboardPageSpeed component tests.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import DashboardPageSpeed from '.';
import {
	fireEvent,
	render,
	waitFor,
	act,
} from '../../../../../../../tests/js/test-utils';
import {
	MODULES_PAGESPEED_INSIGHTS,
	STRATEGY_MOBILE,
	STRATEGY_DESKTOP,
} from '../../../datastore/constants';
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import * as fixtures from '../../../datastore/__fixtures__';
import {
	createTestRegistry,
	freezeFetch,
} from '../../../../../../../tests/js/utils';

const activeClass = 'mdc-tab--active';
const url = fixtures.pagespeedMobile.loadingExperience.id;

describe( 'DashboardPageSpeed', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();

		const { dispatch } = registry;

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedMobileNoStackPacks,
			{
				url,
				strategy: STRATEGY_MOBILE,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktopNoStackPacks,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );
		dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: url,
			currentEntityURL: null,
		} );
	} );

	afterEach( fetchMock.mockClear );

	const setupRegistryNoFieldDataDesktop = () => {
		registry = createTestRegistry();

		const { dispatch } = registry;

		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedMobileNoStackPacks,
			{
				url,
				strategy: STRATEGY_MOBILE,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_MOBILE,
		] );
		dispatch( MODULES_PAGESPEED_INSIGHTS ).receiveGetReport(
			fixtures.pagespeedDesktopNoFieldDataNoStackPacks,
			{
				url,
				strategy: STRATEGY_DESKTOP,
			}
		);
		dispatch( MODULES_PAGESPEED_INSIGHTS ).finishResolution( 'getReport', [
			url,
			STRATEGY_DESKTOP,
		] );
		dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: url,
			currentEntityURL: null,
		} );
	};

	it( 'renders preview blocks while reports are requested', async () => {
		registry = createTestRegistry();

		registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			referenceSiteURL: url,
			currentEntityURL: null,
		} );

		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		// Needs second freezeFetch call, as one is for desktop and the other for mobile.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		const { container } = render( <DashboardPageSpeed />, {
			registry,
		} );
		const widgetElement = container.querySelector(
			'#googlesitekit-pagespeed-header'
		);

		await waitFor( () => {
			expect( widgetElement ).toHaveClass(
				'googlesitekit-pagespeed-widget__content-wrapper--loading'
			);
		} );
	} );

	it( 'displays field data by default when available in both mobile and desktop reports', () => {
		expect(
			fixtures.pagespeedMobileNoStackPacks.loadingExperience
		).toHaveProperty( 'metrics' );
		expect(
			fixtures.pagespeedDesktopNoStackPacks.loadingExperience
		).toHaveProperty( 'metrics' );

		const { getByLabelText } = render( <DashboardPageSpeed />, {
			registry,
		} );

		expect(
			getByLabelText( /In the Field/i ).closest( 'button' )
		).toHaveClass( activeClass );
	} );

	it( 'displays lab data by default when field data is not present in both mobile and desktop reports', () => {
		setupRegistryNoFieldDataDesktop();

		const { getByLabelText } = render( <DashboardPageSpeed />, {
			registry,
		} );

		expect(
			getByLabelText( /In the Lab/i ).closest( 'button' )
		).toHaveClass( activeClass );
		expect(
			getByLabelText( /In the Field/i ).closest( 'button' )
		).not.toHaveClass( activeClass );
	} );

	it( 'displays the mobile data by default', () => {
		const { getByLabelText } = render( <DashboardPageSpeed />, {
			registry,
		} );

		expect( getByLabelText( /mobile/i ) ).toHaveClass( activeClass );
	} );

	it( 'has tabs for toggling the displayed data source', () => {
		const { getByLabelText } = render( <DashboardPageSpeed />, {
			registry,
		} );

		const labDataTabLink =
			getByLabelText( /In the Lab/i ).closest( 'button' );
		expect( labDataTabLink ).not.toHaveClass( activeClass );
		fireEvent.click( labDataTabLink );

		expect( labDataTabLink ).toHaveClass( activeClass );
		expect( getByLabelText( /In the Field/i ) ).not.toHaveClass(
			activeClass
		);
	} );

	it( 'has tabs for toggling the tested device', () => {
		const { getByLabelText } = render( <DashboardPageSpeed />, {
			registry,
		} );

		const desktopToggle = getByLabelText( /desktop/i );
		expect( desktopToggle ).not.toHaveClass( activeClass );

		fireEvent.click( desktopToggle );

		expect( desktopToggle ).toHaveClass( activeClass );
		expect( getByLabelText( /mobile/i ) ).not.toHaveClass( activeClass );
	} );

	it( 'displays refreshing states when the `Run test again` button is clicked', async () => {
		setupRegistryNoFieldDataDesktop();

		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		// Needs second freezeFetch call, as one is for desktop and the other for mobile.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		const { container, getByRole, queryByRole } = render(
			<DashboardPageSpeed />,
			{
				registry,
			}
		);

		const runTestAgainBtn = getByRole( 'button', {
			name: /Run test again/i,
		} );

		await act( async () => {
			fireEvent.click( runTestAgainBtn );

			await waitFor( () => {
				// Verifies the ProgressBar element is present in the tree.
				expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
				// Verifies the Section element has `__refreshing` class that grayed out the section.
				expect( container.querySelector( 'section' ) ).toHaveClass(
					'googlesitekit-pagespeed-widget__refreshing'
				);
				// Verifies the `Run test again` button is disabled.
				expect( runTestAgainBtn ).toBeDisabled();
				// Verifies the Spinner element is present in the tree.
				expect( container.querySelector( '.spinner' ) ).toHaveClass(
					'spinner'
				);
			} );
		} );
	} );

	it( 'displays a "Field data unavailable" message when field data is not available', () => {
		setupRegistryNoFieldDataDesktop();

		const { getByLabelText, queryByText } = render(
			<DashboardPageSpeed />,
			{
				registry,
			}
		);

		const { getReport } = registry.select( MODULES_PAGESPEED_INSIGHTS );
		expect(
			getReport( url, STRATEGY_MOBILE ).loadingExperience
		).toHaveProperty( 'metrics' );
		expect(
			getReport( url, STRATEGY_DESKTOP ).loadingExperience
		).not.toHaveProperty( 'metrics' );

		// Lab data is shown by default as both reports do not have field data.
		expect(
			getByLabelText( /In the Lab/i ).closest( 'button' )
		).toHaveClass( activeClass );
		// Switch to Field data source.
		fireEvent.click(
			getByLabelText( /In the Field/i ).closest( 'button' )
		);

		expect( getByLabelText( /mobile/i ) ).toHaveClass( activeClass );
		// Mobile has field data, so ensure the no data message is not present.
		expect(
			queryByText( /Field data unavailable/i )
		).not.toBeInTheDocument();

		// Switch to desktop and expect to see the no data message.
		fireEvent.click( getByLabelText( /desktop/i ).closest( 'button' ) );

		expect( queryByText( /Field data unavailable/i ) ).toBeInTheDocument();
	} );

	it( 'should disable the `How to improve` button when the test is running', async () => {
		setupRegistryNoFieldDataDesktop();

		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		// Needs second freezeFetch call, as one is for desktop and the other for mobile.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		const { getByRole } = render( <DashboardPageSpeed />, {
			registry,
		} );

		const runTestAgainBtn = getByRole( 'button', {
			name: /Run test again/i,
		} );
		const howToImproveBtn = getByRole( 'button', {
			name: /How to improve/i,
		} );

		await act( async () => {
			fireEvent.click( runTestAgainBtn );

			await waitFor( () => {
				// Verifies the `How to improve` button is disabled when the test is running.
				expect( howToImproveBtn ).toBeDisabled();
			} );
		} );
	} );

	it( 'should disable the data source tabs when the test is running', async () => {
		setupRegistryNoFieldDataDesktop();

		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		// Needs second freezeFetch call, as one is for desktop and the other for mobile.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		const { getByRole } = render( <DashboardPageSpeed />, {
			registry,
		} );

		const runTestAgainBtn = getByRole( 'button', {
			name: /Run test again/i,
		} );
		// Data source tabs.
		const inTheLabTab = getByRole( 'tab', {
			name: /In the Lab/i,
		} );
		const inTheFieldTab = getByRole( 'tab', {
			name: /In the Field/i,
		} );
		const howToImproveTab = getByRole( 'tab', {
			name: /How to improve/i,
		} );

		await act( async () => {
			fireEvent.click( runTestAgainBtn );

			await waitFor( () => {
				// Verifies the `In the Lab` tab is disabled.
				expect( inTheLabTab ).toBeDisabled();
				// Verifies the `In the Field` tab is disabled.
				expect( inTheFieldTab ).toBeDisabled();
				// Verifies the `How to improve` tab is disabled.
				expect( howToImproveTab ).toBeDisabled();
			} );
		} );
	} );

	it( 'should disable the device size tabs when the test is running', async () => {
		setupRegistryNoFieldDataDesktop();

		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		// Needs second freezeFetch call, as one is for desktop and the other for mobile.
		freezeFetch(
			new RegExp(
				'^/google-site-kit/v1/modules/pagespeed-insights/data/pagespeed'
			)
		);
		const { getByRole } = render( <DashboardPageSpeed />, {
			registry,
		} );

		const runTestAgainBtn = getByRole( 'button', {
			name: /Run test again/i,
		} );
		// Device size tabs.
		const mobileTab = getByRole( 'tab', {
			name: /Mobile/i,
		} );
		const desktopTab = getByRole( 'tab', {
			name: /Desktop/i,
		} );

		await act( async () => {
			fireEvent.click( runTestAgainBtn );

			await waitFor( () => {
				// Verifies the device `Mobile` tab is disabled.
				expect( mobileTab ).toBeDisabled();
				// Verifies the device `Desktop` tab is disabled.
				expect( desktopTab ).toBeDisabled();
			} );
		} );
	} );
} );
