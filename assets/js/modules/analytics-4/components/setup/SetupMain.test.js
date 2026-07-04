/**
 * Analytics Main setup component tests.
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
 * Internal dependencies
 */
import { VIEW_CONTEXT_MODULE_SETUP } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as fixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import {
	ACCOUNT_CREATE,
	EDIT_SCOPE,
	GTM_SCOPE,
	MODULES_ANALYTICS_4,
	PROVISIONING_SCOPE,
} from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_TAGMANAGER } from '@/js/modules/tagmanager/datastore/constants';
import { mockLocation } from '@tests/js/mock-browser-utils';
import { fireEvent, render } from '@tests/js/test-utils';
import {
	createTestRegistry,
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
} from '@tests/js/utils';
import SetupMain from './SetupMain';

const {
	accountSummaries,
	defaultEnhancedMeasurementSettings,
	webDataStreamsBatch,
} = fixtures;
const accounts = accountSummaries.accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;
const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;

const REGEX_REST_GA4_SETTINGS = new RegExp( '/analytics-4/data/settings' );

describe( 'SetupMain', () => {
	mockLocation();

	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE, PROVISIONING_SCOPE, GTM_SCOPE ],
		} );
		provideModules( registry, [
			{ slug: MODULE_SLUG_ANALYTICS_4, active: true },
		] );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: true,
		} );
	} );

	it( 'should transition from AccountCreate to SetupForm when the Back button is clicked after an account creation error', async () => {
		// Simulate returning to the Analytics setup screen with an account
		// creation error after declining the Terms of Service.
		global.location.href =
			'http://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&slug=analytics-4&reAuth=true&accountCreationErrorCode=user_cancel';

		// Seed the saved settings with an existing account so `rollbackSettings()`
		// restores them when the user clicks Back.
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID,
			propertyID,
			webDataStreamID,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAccountSummaries( accountSummaries );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getAccountSummaries', [] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetProperty( properties[ 0 ], { propertyID } );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( webDataStreamsBatch, {
				propertyIDs: [ propertyID ],
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...defaultEnhancedMeasurementSettings,
					streamEnabled: false,
				},
				{ propertyID, webDataStreamID }
			);

		// Simulate the user having chosen to create a new account, which leaves
		// the current (unsaved) settings pointing at `ACCOUNT_CREATE`.
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setSettings( { accountID: ACCOUNT_CREATE } );

		muteFetch( REGEX_REST_GA4_SETTINGS );

		const {
			getByRole,
			queryByRole,
			getByText,
			queryByText,
			waitForRegistry,
		} = render( <SetupMain />, {
			registry,
			features: [ 'setupFlowRefresh' ],
			viewContext: VIEW_CONTEXT_MODULE_SETUP,
		} );

		await waitForRegistry();

		// The AccountCreate screen is shown initially because of the error.
		expect(
			getByText( 'Create your Analytics account' )
		).toBeInTheDocument();
		expect( getByRole( 'button', { name: /back/i } ) ).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /back/i } ) );

		await waitForRegistry();

		// The error query arg is cleared and the saved account is restored.
		expect( global.location.href ).not.toContain(
			'accountCreationErrorCode=user_cancel'
		);
		expect( registry.select( MODULES_ANALYTICS_4 ).getAccountID() ).toBe(
			accountID
		);

		// The view transitions to SetupForm, surfacing the account dropdown.
		expect(
			queryByRole( 'button', { name: /back/i } )
		).not.toBeInTheDocument();
		expect(
			queryByText( 'Create your Analytics account' )
		).not.toBeInTheDocument();
		expect(
			getByText(
				'Please select the account information below. You can change this later in your settings.'
			)
		).toBeInTheDocument();
	} );
} );
