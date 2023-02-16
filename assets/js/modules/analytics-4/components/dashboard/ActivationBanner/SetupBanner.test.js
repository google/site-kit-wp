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
} from '../../../../../../../tests/js/utils';
import { MODULES_ANALYTICS } from '../../../../analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../datastore/constants';
import * as fixtures from '../../../../analytics/datastore/__fixtures__';
import * as analytics4Fixtures from '../../../../analytics-4/datastore/__fixtures__';
import {
	render,
	act,
	fireEvent,
} from '../../../../../../../tests/js/test-utils';

import SetupBanner from './SetupBanner';

const { createProperty, properties: propertiesGA4 } = analytics4Fixtures;
const {
	accounts,
	properties: propertiesUA,
	profiles,
} = fixtures.accountsPropertiesProfiles;
const accountID = createProperty._accountID;
const propertyIDua = propertiesUA[ 0 ].id;

const homeURL = 'http://example.com';

const setupInitRegistry = ( registry ) => {
	provideSiteInfo( registry, { homeURL } );
	provideUserInfo( registry );
	provideUserAuthentication( registry );
	const { dispatch } = registry;
	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

	dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( { accountID } );
};

const setupEmptyRegistry = ( registry ) => {
	provideSiteInfo( registry, { homeURL } );
	provideModules( registry );
	provideUserInfo( registry );
	provideUserAuthentication( registry );
	const { dispatch } = registry;

	dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

	dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( { accountID } );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [
		accountID,
	] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties( [], { accountID } );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [] );
};

const setupFullRegistry = ( registry ) => {
	provideSiteInfo( registry, { homeURL } );
	provideModules( registry );
	provideUserInfo( registry );
	provideUserAuthentication( registry );
	provideSiteInfo( registry );

	const { dispatch } = registry;

	dispatch( MODULES_ANALYTICS ).receiveGetSettings( { accountID } );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );

	dispatch( MODULES_ANALYTICS ).receiveGetExistingTag( null );
	dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

	dispatch( MODULES_ANALYTICS ).receiveGetAccounts( accounts );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getAccounts', [] );

	dispatch( MODULES_ANALYTICS ).receiveGetProperties( propertiesUA, {
		accountID,
	} );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProperties', [
		accountID,
	] );

	dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( propertiesGA4, {
		accountID,
	} );
	dispatch( MODULES_ANALYTICS_4 ).finishResolution( 'getProperties', [
		accountID,
	] );

	dispatch( MODULES_ANALYTICS ).receiveGetProfiles( profiles, {
		accountID,
		propertyID: propertyIDua,
	} );
	dispatch( MODULES_ANALYTICS ).finishResolution( 'getProfiles', [
		accountID,
		propertyIDua,
	] );
};

describe( 'SetupBanner', () => {
	let registry;

	const createPropertyEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/create-property'
	);

	beforeAll( () => {
		API.setUsingCache( false );
	} );

	afterEach( () => {
		unsubscribeFromAll( registry );
	} );

	it( 'should render a progress bar', () => {
		const token = 'test-token-value';
		fetchMock.postOnce( homeURL, { body: { token }, status: 200 } );

		const { getByRole } = render( <SetupBanner />, {
			setupRegistry: setupInitRegistry,
		} );

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();
	} );

	it( 'should render a dropdown with availbale props', () => {
		const { getByRole } = render( <SetupBanner />, {
			setupRegistry: setupFullRegistry,
		} );

		expect( getByRole( 'select' ) ).toBeInTheDocument();
	} );

	it( 'should create a property and add it to the store', async () => {
		fetchMock.post( createPropertyEndpoint, {
			body: fixtures.createProperty,
			status: 200,
		} );

		const { getByRole } = render( <SetupBanner />, {
			setupRegistry: setupEmptyRegistry,
		} );

		expect(
			getByRole( 'button', { name: /Create property/i } )
		).toBeInTheDocument();

		// Click submit element to create a new prorperty.
		await act( () => {
			fireEvent.click(
				getByRole( 'button', { name: /Create property/i } )
			);
		} );

		expect( fetchMock ).toHaveFetched( createPropertyEndpoint, {
			body: { data: { accountID } },
		} );
		// Ensure the cache was never used.
		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
	} );
} );
