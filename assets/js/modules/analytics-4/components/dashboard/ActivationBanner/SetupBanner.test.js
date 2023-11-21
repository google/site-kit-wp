/**
 * SetupBanner component tests.
 *
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
import API from 'googlesitekit-api';
import {
	provideModules,
	provideUserInfo,
	unsubscribeFromAll,
	provideUserAuthentication,
	provideSiteInfo,
	createTestRegistry,
	createWaitForRegistry,
	untilResolved,
} from '../../../../../../../tests/js/utils';
import {
	MODULES_ANALYTICS,
	EDIT_SCOPE,
	FORM_SETUP,
} from '../../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import * as fixtures from '../../../../analytics/datastore/__fixtures__';
import * as analytics4Fixtures from '../../../../analytics-4/datastore/__fixtures__';
import {
	render,
	act,
	fireEvent,
} from '../../../../../../../tests/js/test-utils';

import SetupBanner from './SetupBanner';
import { CORE_FORMS } from '../../../../../googlesitekit/datastore/forms/constants';
import { withConnected } from '../../../../../googlesitekit/modules/datastore/__fixtures__';

const { createProperty } = analytics4Fixtures;
const { accounts } = fixtures.accountsPropertiesProfiles;
const accountID = createProperty._accountID;

const createPropertyEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/create-property'
);
const createWebDatastreamEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/create-webdatastream'
);
const ga4SettingsEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/settings'
);
const coreModulesListEndpoint = new RegExp(
	'^/google-site-kit/v1/core/modules/data/list'
);
const propertyEndpoint = new RegExp(
	'^/google-site-kit/v1/modules/analytics-4/data/property'
);

describe( 'SetupBanner', () => {
	let registry;

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		// The activation banner is only shown when GA is connected
		// and GA4 is not.
		provideModules( registry, [
			{ slug: 'analytics', active: true, connected: true },
		] );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should render a progress bar', async () => {
		// Freeze all fetch requests.
		fetchMock.any( new Promise( () => {} ) );

		const { getByRole, waitForRegistry } = render( <SetupBanner />, {
			registry,
		} );
		await waitForRegistry();

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render a create property CTA when no existing properties are available', async () => {
		const { dispatch } = registry;
		dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
		dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
		dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
			accountID,
		} );
		dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
		dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

		const { getByText, waitForRegistry } = render( <SetupBanner />, {
			registry,
		} );
		await waitForRegistry();

		expect( getByText( /create property/i ) ).toBeInTheDocument();
	} );

	it( 'should create a single property when the user has the necessary scope granted', async () => {
		fetchMock.post( createPropertyEndpoint, {
			body: createProperty,
			status: 200,
		} );
		fetchMock.post( createWebDatastreamEndpoint, {
			body: analytics4Fixtures.createWebDataStream,
			status: 200,
		} );
		fetchMock.post( ga4SettingsEndpoint, () =>
			registry.select( MODULES_ANALYTICS_4 ).getSettings()
		);
		// submitChanges reloads modules from server when ga4 is connected.
		fetchMock.getOnce( coreModulesListEndpoint, {
			body: withConnected( 'analytics', 'analytics-4' ),
			status: 200,
		} );
		fetchMock.get( propertyEndpoint, {
			body: createProperty,
			status: 200,
		} );
		const onSubmitSuccess = jest.fn();

		const { dispatch } = registry;
		dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
		dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
		dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
			accountID,
		} );
		dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
		dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		const { getByText, queryByText, waitForRegistry } = render(
			<SetupBanner onSubmitSuccess={ onSubmitSuccess } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( getByText( /create property/i ) ).toBeInTheDocument();
		expect(
			queryByText( /You will need to give Site Kit permission/i )
		).not.toBeInTheDocument();

		// Click submit element to create a new property.
		await act( async () => {
			const waitForRegistryAfterCreation =
				createWaitForRegistry( registry );
			fireEvent.click( getByText( /create property/i ) );
			await waitForRegistryAfterCreation();
		} );

		expect( fetchMock ).toHaveFetchedTimes( 1, createPropertyEndpoint );
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			createWebDatastreamEndpoint
		);
		expect( fetchMock ).toHaveFetchedTimes( 1, ga4SettingsEndpoint );
		expect( onSubmitSuccess ).toHaveBeenCalledTimes( 1 );
		expect( fetchMock ).toHaveFetchedTimes( 1, propertyEndpoint );
	} );

	it( 'should create a single property when the form is auto submitted after the scope was granted', async () => {
		fetchMock.post( createPropertyEndpoint, {
			body: createProperty,
			status: 200,
		} );
		fetchMock.post( createWebDatastreamEndpoint, {
			body: analytics4Fixtures.createWebDataStream,
			status: 200,
		} );
		fetchMock.post( ga4SettingsEndpoint, () =>
			registry.select( MODULES_ANALYTICS_4 ).getSettings()
		);
		// submitChanges reloads modules from server when ga4 is connected.
		fetchMock.getOnce( coreModulesListEndpoint, {
			body: withConnected( 'analytics', 'analytics-4' ),
			status: 200,
		} );
		fetchMock.get( propertyEndpoint, {
			body: createProperty,
			status: 200,
		} );
		const onSubmitSuccess = jest.fn();

		const { dispatch } = registry;
		dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
		dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
		dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], {
			accountID,
		} );
		dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
		dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
		// Simulate an auto-submit scenario after scope is granted.
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );
		dispatch( CORE_FORMS ).setValues( FORM_SETUP, { autoSubmit: true } );

		const { waitForRegistry } = render(
			<SetupBanner onSubmitSuccess={ onSubmitSuccess } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		expect( fetchMock ).toHaveFetchedTimes( 1, createPropertyEndpoint );
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			createWebDatastreamEndpoint
		);
		expect( fetchMock ).toHaveFetchedTimes( 1, ga4SettingsEndpoint );
		expect( onSubmitSuccess ).toHaveBeenCalledTimes( 1 );

		const propertyID = registry
			.select( MODULES_ANALYTICS_4 )
			.getPropertyID();
		// getPropertyCreateTime resolver should invoke getProperty on settings change.
		await untilResolved( registry, MODULES_ANALYTICS_4 ).getProperty(
			propertyID
		);
		expect( fetchMock ).toHaveFetchedTimes( 1, propertyEndpoint );
	} );
} );
