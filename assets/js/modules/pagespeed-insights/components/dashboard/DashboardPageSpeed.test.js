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
import { mockAllIsIntersecting } from 'react-intersection-observer/test-utils';

/**
 * Internal dependencies
 */
import DashboardPageSpeed from './DashboardPageSpeed';
import { fireEvent, render, waitFor } from '../../../../../../tests/js/test-utils';
import { STORE_NAME, STRATEGY_MOBILE, STRATEGY_DESKTOP } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import * as fixtures from '../../datastore/__fixtures__';
import { freezeFetch } from '../../../../../../tests/js/utils';

const activeClass = 'mdc-tab--active';
const url = fixtures.pagespeedMobile.loadingExperience.id;
const setupRegistry = ( { dispatch } ) => {
	dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedMobileNoStackPacks, { url, strategy: STRATEGY_MOBILE } );
	dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktopNoStackPacks, { url, strategy: STRATEGY_DESKTOP } );
	dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_DESKTOP ] );
	dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_MOBILE ] );
	dispatch( CORE_SITE ).receiveSiteInfo( {
		referenceSiteURL: url,
		currentEntityURL: null,
	} );
};
const setupRegistryNoReports = ( { dispatch } ) => {
	dispatch( CORE_SITE ).receiveSiteInfo( {
		referenceSiteURL: url,
		currentEntityURL: null,
	} );
};
const setupRegistryNoFieldDataDesktop = ( { dispatch } ) => {
	dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedMobileNoStackPacks, { url, strategy: STRATEGY_MOBILE } );
	dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_MOBILE ] );
	dispatch( STORE_NAME ).receiveGetReport( fixtures.pagespeedDesktopNoFieldDataNoStackPacks, { url, strategy: STRATEGY_DESKTOP } );
	dispatch( STORE_NAME ).finishResolution( 'getReport', [ url, STRATEGY_DESKTOP ] );
	dispatch( CORE_SITE ).receiveSiteInfo( {
		referenceSiteURL: url,
		currentEntityURL: null,
	} );
};

describe( 'DashboardPageSpeed', () => {
	beforeAll( () => mockAllIsIntersecting( true ) );
	afterEach( fetchMock.mockClear );

	it( 'renders a progress bar while reports are requested', async () => {
		freezeFetch( /^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/ );
		// needs second freezeFetch call, as one is for desktop and the other for mobile
		freezeFetch( /^\/google-site-kit\/v1\/modules\/pagespeed-insights\/data\/pagespeed/ );
		const { queryByRole } = render( <DashboardPageSpeed />, { setupRegistry: setupRegistryNoReports } );

		await waitFor( () => {
			expect( queryByRole( 'progressbar' ) ).toBeInTheDocument();
		} );
	} );

	it( 'displays field data by default when available in both mobile and desktop reports', () => {
		expect( fixtures.pagespeedMobileNoStackPacks.loadingExperience ).toHaveProperty( 'metrics' );
		expect( fixtures.pagespeedDesktopNoStackPacks.loadingExperience ).toHaveProperty( 'metrics' );

		const { getByLabelText } = render( <DashboardPageSpeed />, { setupRegistry } );

		expect( getByLabelText( /In the Field/i ).closest( 'button' ) ).toHaveClass( activeClass );
	} );

	it( 'displays lab data by default when field data is not present in both mobile and desktop reports', () => {
		const { getByLabelText } = render( <DashboardPageSpeed />, { setupRegistry: setupRegistryNoFieldDataDesktop } );

		expect( getByLabelText( /In the Lab/i ).closest( 'button' ) ).toHaveClass( activeClass );
		expect( getByLabelText( /In the Field/i ).closest( 'button' ) ).not.toHaveClass( activeClass );
	} );

	it( 'displays the mobile data by default', () => {
		const { getByLabelText } = render( <DashboardPageSpeed />, { setupRegistry } );

		expect( getByLabelText( /mobile/i ) ).toHaveClass( activeClass );
	} );

	it( 'has tabs for toggling the displayed data source', () => {
		const { getByLabelText } = render( <DashboardPageSpeed />, { setupRegistry } );

		const labDataTabLink = getByLabelText( /In the Lab/i ).closest( 'button' );
		expect( labDataTabLink ).not.toHaveClass( activeClass );
		fireEvent.click( labDataTabLink );

		expect( labDataTabLink ).toHaveClass( activeClass );
		expect( getByLabelText( /In the Field/i ) ).not.toHaveClass( activeClass );
	} );

	it( 'has tabs for toggling the tested device', () => {
		const { getByLabelText } = render( <DashboardPageSpeed />, { setupRegistry } );

		const desktopToggle = getByLabelText( /desktop/i );
		expect( desktopToggle ).not.toHaveClass( activeClass );

		fireEvent.click( desktopToggle );

		expect( desktopToggle ).toHaveClass( activeClass );
		expect( getByLabelText( /mobile/i ) ).not.toHaveClass( activeClass );
	} );

	it( 'displays a "Field data unavailable" message when field data is not available', () => {
		const { getByLabelText, queryByText, registry } = render( <DashboardPageSpeed />, { setupRegistry: setupRegistryNoFieldDataDesktop } );

		const { getReport } = registry.select( STORE_NAME );
		expect( getReport( url, STRATEGY_MOBILE ).loadingExperience ).toHaveProperty( 'metrics' );
		expect( getReport( url, STRATEGY_DESKTOP ).loadingExperience ).not.toHaveProperty( 'metrics' );

		// Lab data is shown by default as both reports do not have field data.
		expect( getByLabelText( /In the Lab/i ).closest( 'button' ) ).toHaveClass( activeClass );
		// Switch to Field data source.
		fireEvent.click( getByLabelText( /In the Field/i ).closest( 'button' ) );

		expect( getByLabelText( /mobile/i ) ).toHaveClass( activeClass );
		// Mobile has field data, so ensure the no data message is not present.
		expect( queryByText( /Field data unavailable/i ) ).not.toBeInTheDocument();

		// Switch to desktop and expect to see the no data message.
		fireEvent.click( getByLabelText( /desktop/i ).closest( 'button' ) );

		expect( queryByText( /Field data unavailable/i ) ).toBeInTheDocument();
	} );
} );
