/**
 * Analytics 4 Settings Edit component tests.
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
import { VIEW_CONTEXT_SETTINGS } from '@/js/googlesitekit/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import * as fixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import {
	ACCOUNT_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
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
import SettingsEdit from './SettingsEdit';

const {
	accountSummaries,
	defaultEnhancedMeasurementSettings,
	webDataStreamsBatch,
} = fixtures;

describe( 'SettingsEdit', () => {
	mockLocation();

	let registry;

	const accounts = accountSummaries.accountSummaries;
	const accountID = accounts[ 1 ]._id;
	const properties = accounts[ 1 ].propertySummaries;
	const propertyID = properties[ 0 ]._id;
	const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;

	const analyticsSettingsEndpoint = new RegExp(
		'^/google-site-kit/v1/modules/analytics-4/data/settings'
	);

	const SETTINGS_EDIT_URL =
		'http://example.com/wp-admin/admin.php?page=googlesitekit-settings#/connected-services/analytics-4/edit';
	const SETTINGS_EDIT_URL_WITH_ERROR =
		'http://example.com/wp-admin/admin.php?page=googlesitekit-settings&accountCreationErrorCode=user_cancel#/connected-services/analytics-4/edit';

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [
			{
				slug: MODULE_SLUG_ANALYTICS_4,
				active: true,
				connected: true,
			},
		] );

		registry.dispatch( CORE_SITE ).receiveGetConversionTrackingSettings( {
			enabled: true,
		} );

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
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );

		muteFetch( analyticsSettingsEndpoint );
	} );

	it( 'should render AccountCreate with the error notice when accountCreationErrorCode is present and setupFlowRefresh is enabled', async () => {
		global.location.href = SETTINGS_EDIT_URL_WITH_ERROR;

		const { getByText, waitForRegistry } = render( <SettingsEdit />, {
			registry,
			features: [ 'setupFlowRefresh' ],
			viewContext: VIEW_CONTEXT_SETTINGS,
		} );

		await waitForRegistry();

		expect(
			getByText( 'Create your Analytics account' )
		).toBeInTheDocument();
		expect(
			getByText( 'Analytics account creation failed' )
		).toBeInTheDocument();
		expect( registry.select( MODULES_ANALYTICS_4 ).getAccountID() ).toBe(
			ACCOUNT_CREATE
		);
	} );

	it( 'should render SettingsForm when setupFlowRefresh is disabled even with an error code present', async () => {
		global.location.href = SETTINGS_EDIT_URL_WITH_ERROR;

		const { getByText, queryByText, waitForRegistry } = render(
			<SettingsEdit />,
			{
				registry,
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);

		await waitForRegistry();

		expect( getByText( 'Account' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Create your Analytics account' )
		).not.toBeInTheDocument();
		expect(
			queryByText( 'Analytics account creation failed' )
		).not.toBeInTheDocument();
	} );

	it( 'should render SettingsForm when there is no error code', async () => {
		global.location.href = SETTINGS_EDIT_URL;

		const { getByText, queryByText, waitForRegistry } = render(
			<SettingsEdit />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);

		await waitForRegistry();

		expect( getByText( 'Account' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Create your Analytics account' )
		).not.toBeInTheDocument();
	} );

	it( 'should transition from AccountCreate to SettingsForm when Back is clicked after an account creation error', async () => {
		global.location.href = SETTINGS_EDIT_URL_WITH_ERROR;

		const { getByRole, getByText, queryByText, waitForRegistry } = render(
			<SettingsEdit />,
			{
				registry,
				features: [ 'setupFlowRefresh' ],
				viewContext: VIEW_CONTEXT_SETTINGS,
			}
		);

		await waitForRegistry();

		expect(
			getByText( 'Create your Analytics account' )
		).toBeInTheDocument();

		fireEvent.click( getByRole( 'button', { name: /back/i } ) );

		await waitForRegistry();

		expect( global.location.href ).not.toContain(
			'accountCreationErrorCode=user_cancel'
		);
		expect( global.location.href ).toContain(
			'#/connected-services/analytics-4/edit'
		);
		expect( registry.select( MODULES_ANALYTICS_4 ).getAccountID() ).toBe(
			accountID
		);
		expect( getByText( 'Account' ) ).toBeInTheDocument();
		expect(
			queryByText( 'Create your Analytics account' )
		).not.toBeInTheDocument();
	} );
} );
