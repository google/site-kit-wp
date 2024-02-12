/**
 * Analytics Settings Edit component tests.
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
import {
	render,
	createTestRegistry,
	act,
} from '../../../../../../tests/js/test-utils';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { MODULES_ANALYTICS } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import SettingsEdit from './SettingsEdit';
import * as fixtures from '../../datastore/__fixtures__';
import {
	provideModules,
	provideSiteInfo,
	waitForDefaultTimeouts,
	provideUserInfo,
	provideModuleRegistrations,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import * as ga4Fixtures from '../../../analytics-4/datastore/__fixtures__';

describe( 'SettingsEdit', () => {
	const { accountSummaries, webDataStreamsBatch } = ga4Fixtures;
	const accounts = accountSummaries;
	const properties = accounts[ 1 ].propertySummaries;
	const accountID = accounts[ 1 ]._id;
	const propertyID = properties[ 0 ]._id;

	let registry;

	beforeEach( () => {
		fetchMock.get( new RegExp( 'analytics/data/settings' ), {
			body: {
				ownerID: 1,
			},
		} );

		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideUserInfo( registry );
		provideModules( registry, [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );
	} );

	it( 'should not make any GTM API request and renders the settings screen without errors if GTM is not available', async () => {
		registry.dispatch( CORE_MODULES ).receiveGetModules( [
			{
				slug: 'analytics',
				active: true,
				connected: true,
			},
		] );

		fetchMock.get( new RegExp( 'analytics/data/settings' ), {
			body: {
				ownerID: 1,
			},
		} );
		fetchMock.get( new RegExp( 'analytics-4/data/settings' ), {
			body: {},
		} );

		fetchMock.get( new RegExp( 'example\\.com' ), {
			body: [],
			status: 200,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAccountSummaries( accountSummaries );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getAccounts', [] );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetProperties( [], { accountID } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( properties[ 0 ], {
				propertyID,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( webDataStreamsBatch, {
				propertyIDs: [ propertyID ],
			} );

		const { container, waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		// Verify GTM is not available.
		expect(
			registry.select( CORE_MODULES ).isModuleAvailable( 'tagmanager' )
		).toBe( false );

		// Verify no requests were made to GTM module.
		expect( fetchMock ).not.toHaveFetched(
			new RegExp( 'tagmanager/data' )
		);

		// Verify that the Account select dropdown is rendered in the settings screen.
		expect(
			container.querySelector(
				'.googlesitekit-analytics__select-account'
			)
		).toBeInTheDocument();
	} );

	it( 'does not set the account ID or property ID of an existing tag when present', async () => {
		provideModuleRegistrations( registry );
		fetchMock.get( new RegExp( 'tagmanager/data/settings' ), { body: {} } );
		fetchMock.get(
			new RegExp(
				'^/google-site-kit/v1/modules/analytics-4/data/account-summaries'
			),
			{
				body: [],
				status: 200,
			}
		);

		fetchMock.get( new RegExp( 'example\\.com' ), {
			body: [],
			status: 200,
		} );

		const { profiles } = fixtures.accountsPropertiesProfiles;
		const existingTag = {
			/* eslint-disable sitekit/acronym-case */
			accountID: profiles[ 0 ].accountId,
			propertyID: profiles[ 0 ].webPropertyId,
			/* eslint-enable */
		};

		registry.dispatch( CORE_MODULES ).receiveGetModules( [] );

		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );

		registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );

		registry
			.dispatch( MODULES_ANALYTICS )
			.receiveGetExistingTag( existingTag.propertyID );

		const { waitForRegistry } = render( <SettingsEdit />, {
			registry,
		} );

		await waitForRegistry();

		// Wait for additional resolvers to run.
		await act( waitForDefaultTimeouts );

		expect(
			registry.select( MODULES_ANALYTICS ).getAccountID()
		).toBeUndefined();
		expect(
			registry.select( MODULES_ANALYTICS ).getPropertyID()
		).toBeUndefined();
		expect( registry.select( MODULES_ANALYTICS ).hasErrors() ).toBeFalsy();
	} );
} );
