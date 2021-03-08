/**
 * SettingsApp component tests.
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
 * Internal dependencies
 */
import SettingsApp from './SettingsApp';
import { render, fireEvent, createTestRegistry, provideModules, waitFor } from '../../../../tests/js/test-utils';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import * as fixtures from '../../modules/analytics/datastore/__fixtures__';

describe( 'SettingsApp', () => {
	let registry;

	const features = [ 'storeErrorNotifications' ];
	const validResponse = {
		accountID: 'pub-12345678',
		clientID: 'ca-pub-12345678',
		useSnippet: true,
	};

	beforeEach( () => {
		global.location.hash = '';

		registry = createTestRegistry();
		registry.dispatch( CORE_USER ).receiveGetAuthentication( { needsReauthentication: false } );
		registry.dispatch( CORE_USER ).receiveConnectURL( 'test-url' );

		provideModules( registry, [
			{
				slug: 'analytics',
				name: 'Analytics',
				active: true,
				connected: true,
				setupComplete: true,
				SettingsEditComponent: () => <div data-testid="edit-component">edit</div>,
			},
			{
				slug: 'optimize',
				name: 'Optimize',
				active: true,
				connected: true,
				setupComplete: true,
				SettingsEditComponent: () => <div data-testid="edit-component">edit</div>,
			},
			{
				slug: 'tagmanager',
				name: 'Tag Manager',
				active: true,
				connected: true,
				setupComplete: true,
				SettingsEditComponent: () => <div data-testid="edit-component">edit</div>,
			},
			{
				slug: 'adsense',
				name: 'AdSense',
				active: true,
				connected: true,
				setupComplete: true,
				SettingsEditComponent: () => <div data-testid="edit-component">edit</div>,
			},
			{
				slug: 'pagespeed-insights',
				name: 'PageSpeed Insights',
				active: true,
				connected: true,
				setupComplete: true,
				SettingsEditComponent: () => <div data-testid="edit-component">edit</div>,
			},
		] );

		global._googlesitekitLegacyData.modules.analytics = {
			...global._googlesitekitLegacyData.modules.analytics,
			active: true,
			setupComplete: true,
		};
	} );

	it( 'should change location hash & DOM correctly when module accordion clicked and opened', async () => {
		fetchMock.getOnce(
			/^\/google-site-kit\/v1\/modules\/analytics\/data\/settings/,
			{ body: validResponse, status: 200 }
		);

		const { getByRole, findByRole } = render( <SettingsApp />, { features, registry } );

		fireEvent.click( getByRole( 'tab', { name: /analytics/i } ) );
		expect( global.location.hash ).toEqual( '#settings/analytics/view' );

		const analyticsPanel = await findByRole( 'tabpanel', { hidden: false } );
		expect( analyticsPanel ).toHaveAttribute( 'id', 'googlesitekit-settings-module__content--analytics' );
	} );

	it( 'should change location hash & DOM correctly when module accordion clicked and closed', async () => {
		const { getByRole, findByRole, queryByRole } = render( <SettingsApp />, { features, registry } );

		fireEvent.click( getByRole( 'tab', { name: /analytics/i } ) );

		const analyticsPanel = await findByRole( 'tabpanel' );
		expect( analyticsPanel ).toBeInTheDocument();

		expect( global.location.hash ).toEqual( '#settings/analytics/view' );

		fireEvent.click( getByRole( 'tab', { name: /analytics/i } ) );
		// A closed state should not be reflected in the hash as it is implied as default.
		expect( global.location.hash ).toEqual( '#settings' );

		await waitFor( () => {
			expect( queryByRole( 'tabpanel' ) ).toBeNull();
		} );
	} );

	it( 'should change location hash & DOM correctly when module is being edited', async () => {
		fetchMock.getOnce(
			/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
			{ body: fixtures.accountsPropertiesProfiles, status: 200 }
		);

		const { getByRole, findByRole, queryByTestID } = render( <SettingsApp />, { features, registry } );

		fireEvent.click( getByRole( 'tab', { name: /analytics/i } ) );

		const analyticsPanel = await findByRole( 'tabpanel' );
		expect( analyticsPanel ).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /edit/i } ) );

		expect( global.location.hash ).toEqual( '#settings/analytics/edit' );

		await waitFor( () => {
			expect( queryByTestID( 'edit-component' ) ).toBeInTheDocument();
		} );
	} );

	it( 'should change location hash & DOM correctly when module is no longer being edited', async () => {
		fetchMock.getOnce(
			/^\/google-site-kit\/v1\/modules\/analytics\/data\/accounts-properties-profiles/,
			{ body: fixtures.accountsPropertiesProfiles, status: 200 }
		);

		const { getByRole, findByRole } = render( <SettingsApp />, { features, registry } );

		fireEvent.click( getByRole( 'tab', { name: /analytics/i } ) );

		const analyticsPanel = await findByRole( 'tabpanel' );
		expect( analyticsPanel ).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /edit/i } ) );
		expect( global.location.hash ).toEqual( '#settings/analytics/edit' );

		fireEvent.click( getByRole( 'button', { name: /cancel/i } ) );
		expect( global.location.hash ).toEqual( '#settings/analytics/view' );

		const finalAnalyticsPanel = await findByRole( 'tabpanel' );
		expect( finalAnalyticsPanel ).toBeInTheDocument();
	} );

	it( 'should change location hash & DOM correctly when tab is clicked and changed', async () => {
		const { findByText, getAllByRole } = render( <SettingsApp />, { features, registry } );

		fireEvent.click( getAllByRole( 'tab' )[ 1 ] );
		expect( global.location.hash ).toEqual( '#connect' );

		const allConnected = await findByText( /congrats, you’ve connected all services/i );
		expect( allConnected ).toBeInTheDocument();

		fireEvent.click( getAllByRole( 'tab' )[ 2 ] );
		expect( global.location.hash ).toEqual( '#admin' );

		const pluginStatus = await findByText( /plugin status/i );
		expect( pluginStatus ).toBeInTheDocument();
	} );
} );
