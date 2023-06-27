/**
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { act, fireEvent, render } from '../../../../../../tests/js/test-utils';
import {
	createTestRegistry,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	waitForDefaultTimeouts,
} from '../../../../../../tests/js/utils';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
	GA4_DASHBOARD_VIEW_NOTIFICATION_ID,
	MODULES_ANALYTICS,
	SETUP_FLOW_MODE_GA4,
	SETUP_FLOW_MODE_GA4_LEGACY,
	SETUP_FLOW_MODE_GA4_TRANSITIONAL,
	SETUP_FLOW_MODE_UA,
} from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import * as analytics4Fixtures from '../../../analytics-4/datastore/__fixtures__';
import ga4Reporting from '../../../../feature-tours/ga4-reporting';
import { enabledFeatures } from '../../../../features';
import SetupForm from './SetupForm';

const accountID = fixtures.accountsPropertiesProfiles.accounts[ 0 ].id;

describe( 'SetupForm', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [
			{ slug: 'analytics', active: true, connected: true },
		] );
	} );

	it( 'renders the form with a progress bar when GTM containers are not resolved', () => {
		provideModules( registry, [
			{ slug: 'analytics', active: true, connected: true },
			{ slug: 'tagmanager', active: true, connected: true },
		] );
		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );

		const { container, getByRole } = render( <SetupForm />, { registry } );

		expect( container ).toMatchSnapshot();

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'renders the form correctly when setup flow mode is UA', async () => {
		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetProperties( [], { accountID } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperties( [], { accountID } );
		registry.dispatch( MODULES_ANALYTICS ).selectAccount( accountID );

		// Verify that the setup flow mode is UA.
		expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe(
			SETUP_FLOW_MODE_UA
		);

		const { container, getByText, waitForRegistry } = render(
			<SetupForm />,
			{ registry }
		);

		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( 'Account' ) ).toBeInTheDocument();
		expect( getByText( 'Property' ) ).toBeInTheDocument();
		expect( getByText( 'View' ) ).toBeInTheDocument();
		expect( getByText( 'View Name' ) ).toBeInTheDocument();
		expect(
			getByText( 'A Google Analytics 4 property will also be created.' )
		).toBeInTheDocument();
	} );

	it( 'renders the form correctly when setup flow mode is GA4', async () => {
		enabledFeatures.add( 'ga4Reporting' );

		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetProperties( [], { accountID } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperties( [], { accountID } );
		registry.dispatch( MODULES_ANALYTICS ).selectAccount( accountID );

		// Verify that the setup flow mode is GA4.
		expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe(
			SETUP_FLOW_MODE_GA4
		);

		const { container, getByText, waitForRegistry } = render(
			<SetupForm />,
			{
				registry,
				features: [ 'ga4Reporting' ],
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( 'Account' ) ).toBeInTheDocument();
		expect( getByText( 'Property' ) ).toBeInTheDocument();
		expect( getByText( 'Web Data Stream' ) ).toBeInTheDocument();
	} );

	it( 'renders the form correctly when setup flow mode is GA4 Legacy', async () => {
		const propertyID = analytics4Fixtures.properties[ 0 ]._id;

		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetProperties( [], { accountID } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperties( analytics4Fixtures.properties, {
				accountID,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreams( analytics4Fixtures.webDataStreams, {
				propertyID,
			} );
		registry.dispatch( MODULES_ANALYTICS ).selectAccount( accountID );
		registry.dispatch( MODULES_ANALYTICS_4 ).selectProperty( propertyID );

		// Verify that the setup flow mode is GA4 Legacy.
		expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe(
			SETUP_FLOW_MODE_GA4_LEGACY
		);

		const { container, getByText, waitForRegistry } = render(
			<SetupForm />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( 'Account' ) ).toBeInTheDocument();
		expect( getByText( 'Property' ) ).toBeInTheDocument();
		expect( getByText( 'Web Data Stream' ) ).toBeInTheDocument();
		expect(
			getByText(
				'An associated Universal Analytics property will also be created.'
			)
		).toBeInTheDocument();
	} );

	it( 'renders the form correctly when setup flow mode is GA4 Transitional', async () => {
		const propertyID =
			fixtures.accountsPropertiesProfiles.properties[ 0 ].id;

		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetProperties(
				fixtures.accountsPropertiesProfiles.properties,
				{ accountID }
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperties( analytics4Fixtures.properties, {
				accountID,
			} );
		registry.dispatch( MODULES_ANALYTICS ).receiveGetProfiles( [], {
			accountID,
			propertyID,
		} );
		registry.dispatch( MODULES_ANALYTICS ).selectAccount( accountID );
		registry.dispatch( MODULES_ANALYTICS ).selectProperty( propertyID );

		// Verify that the setup flow mode is GA4 Transitional.
		expect( registry.select( MODULES_ANALYTICS ).getSetupFlowMode() ).toBe(
			SETUP_FLOW_MODE_GA4_TRANSITIONAL
		);

		const { container, findAllByText, getByText, waitForRegistry } = render(
			<SetupForm />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( container ).toMatchSnapshot();

		expect( getByText( 'Account' ) ).toBeInTheDocument();

		const propertyElements = await findAllByText( 'Property' );
		expect( propertyElements.length ).toBe( 2 );

		expect( getByText( 'View' ) ).toBeInTheDocument();
		expect( getByText( 'View Name' ) ).toBeInTheDocument();
		expect( getByText( 'Web Data Stream' ) ).toBeInTheDocument();
		expect(
			getByText(
				'You need to connect the Google Analytics 4 property that’s associated with this Universal Analytics property.'
			)
		).toBeInTheDocument();
	} );

	it( 'submits the form upon pressing the CTA', async () => {
		enabledFeatures.add( 'ga4Reporting' );
		const propertyID = analytics4Fixtures.properties[ 0 ]._id;

		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetAccounts( fixtures.accountsPropertiesProfiles.accounts );
		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetProperties( [], { accountID } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperties( analytics4Fixtures.properties, {
				accountID,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreams( analytics4Fixtures.webDataStreams, {
				propertyID,
			} );
		registry.dispatch( MODULES_ANALYTICS ).selectAccount( accountID );

		const finishSetup = jest.fn();
		const { getByRole, getByText, waitForRegistry } = render(
			<SetupForm finishSetup={ finishSetup } />,
			{
				registry,
				features: [ 'ga4Reporting' ],
			}
		);
		await waitForRegistry();

		// Click the label to expose the elements in the menu.
		// fireEvent.click( getByText( 'Property' ) );

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click( getByText( /Test GA4 Property/i ) );
		} );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedTours( [ ga4Reporting.slug ] );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedItems( [ GA4_DASHBOARD_VIEW_NOTIFICATION_ID ] );

		const updateAnalyticsSettingsRegexp = new RegExp(
			'/analytics/data/settings'
		);

		const updateAnalytics4SettingsRegexp = new RegExp(
			'/analytics-4/data/settings'
		);

		const getModulesRegexp = new RegExp( '/core/modules/data/list' );

		fetchMock.post( updateAnalyticsSettingsRegexp, {
			status: 200,
			body: {},
		} );

		fetchMock.post( updateAnalytics4SettingsRegexp, {
			status: 200,
			body: {},
		} );

		fetchMock.get( getModulesRegexp, {
			status: 200,
			body: [],
		} );

		// eslint-disable-next-line require-await
		await act( async () => {
			fireEvent.click(
				getByRole( 'button', { name: /Configure Analytics/i } )
			);
		} );

		expect( fetchMock ).toHaveFetchedTimes(
			1,
			updateAnalyticsSettingsRegexp
		);
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			updateAnalytics4SettingsRegexp
		);
		expect( fetchMock ).toHaveFetchedTimes( 1, getModulesRegexp );

		await waitForDefaultTimeouts();

		expect( finishSetup ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'auto-submits the form once', async () => {
		const createPropertyRegexp = new RegExp(
			'/analytics/data/create-property'
		);
		fetchMock.post( createPropertyRegexp, {
			status: 403,
			body: {
				code: 403,
				error: 'Insufficient permissions',
			},
		} );
		const dispatchUA = registry.dispatch( MODULES_ANALYTICS );
		const dispatchGA4 = registry.dispatch( MODULES_ANALYTICS_4 );
		dispatchUA.setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		dispatchUA.receiveGetAccounts(
			fixtures.accountsPropertiesProfiles.accounts
		);
		dispatchUA.receiveGetProperties( [], { accountID } );
		dispatchUA.receiveGetExistingTag( null );

		dispatchGA4.receiveGetExistingTag( null );
		dispatchGA4.receiveGetAccountSummaries(
			analytics4Fixtures.accountSummaries
		);
		dispatchGA4.receiveGetProperties( [], { accountID } );
		dispatchUA.selectAccount( accountID );

		// Simulate an auto-submit case where the user is returning to the page
		// after granting extra scopes necessary to submit.
		// In this situation, the autoSubmit is set before the user goes to oAuth
		// store state is snapshotted, and then restored upon returning.
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { autoSubmit: true } );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const finishSetup = jest.fn();
		const { getByRole, waitForRegistry } = render(
			<SetupForm finishSetup={ finishSetup } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		// Ensure the form rendered successfully.
		getByRole( 'button', { name: /Configure Analytics/i } );

		// Create property should have only been called once.
		expect( fetchMock ).toHaveFetchedTimes( 1, createPropertyRegexp );
		// Setup was not successful, so the finish function should not be called.
		expect( finishSetup ).not.toHaveBeenCalled();
		// Expect a console error due to the API error (otherwise this test will fail).
		expect( console ).toHaveErrored();
	} );
} );
