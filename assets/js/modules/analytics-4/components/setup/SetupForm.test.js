/**
 * Site Kit by Google, Copyright 2024 Google LLC
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
	muteFetch,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	waitForDefaultTimeouts,
} from '../../../../../../tests/js/utils';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';
import { MODULES_TAGMANAGER } from '../../../tagmanager/datastore/constants';
import {
	EDIT_SCOPE,
	FORM_SETUP,
	MODULES_ANALYTICS_4,
} from '../../datastore/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import ga4ReportingTour from '../../../../feature-tours/ga4-reporting';
import SetupForm from './SetupForm';
import { ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY } from '../../../analytics-4/constants';

const {
	accountSummaries,
	defaultEnhancedMeasurementSettings,
	webDataStreamsBatch,
	webDataStreams,
} = fixtures;
const accounts = accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;
const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;

describe( 'SetupForm', () => {
	let registry;

	beforeEach( () => {
		registry = createTestRegistry();
		provideSiteInfo( registry );
		provideUserAuthentication( registry );
		provideModules( registry, [ { slug: 'analytics-4', active: true } ] );
	} );

	it( 'renders the form correctly', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAccountSummaries( accountSummaries );
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
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...defaultEnhancedMeasurementSettings,
					streamEnabled: false,
				},
				{
					propertyID,
					webDataStreamID,
				}
			);

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.selectAccount( accountID );

		// @TODO: This is temporarily needed here as the AccountSelect component
		// still relies on the `analytics` datastore. This should be removed
		// once the two Analytics modules are entirely decoupled.
		registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

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
	} );

	it( 'submits the form upon pressing the CTA', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAccountSummaries( accountSummaries );
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
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				defaultEnhancedMeasurementSettings,
				{
					propertyID,
					webDataStreamID,
				}
			);

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.selectAccount( accountID );

		// @TODO: This is temporarily needed here as the AccountSelect component
		// still relies on the `analytics` datastore. This should be removed
		// once the two Analytics modules are entirely decoupled.
		registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

		const finishSetup = jest.fn();
		const { getByRole, waitForRegistry } = render(
			<SetupForm finishSetup={ finishSetup } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		act( () => {
			// It doesn't seem possible to show the dropdown menu within the test by clicking on the dropdown in the usual way.
			// Therefore, we simulate the click on the dropdown menu item directly, despite it being hidden.
			fireEvent.click(
				getByRole( 'menuitem', {
					name: /Example Com/i,
					hidden: true,
				} )
			);
		} );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedTours( [ ga4ReportingTour.slug ] );

		const updateAnalyticsSettingsRegexp = new RegExp(
			'/analytics-4/data/settings'
		);

		const dismissItemEndpointRegexp = new RegExp(
			'^/google-site-kit/v1/core/user/data/dismiss-item'
		);

		muteFetch( updateAnalyticsSettingsRegexp );

		fetchMock.post( dismissItemEndpointRegexp, {
			status: 200,
			body: JSON.stringify( [
				ENHANCED_MEASUREMENT_ACTIVATION_BANNER_DISMISSED_ITEM_KEY,
			] ),
		} );

		act( () => {
			fireEvent.click(
				getByRole( 'button', { name: /Complete setup/i } )
			);
		} );

		await waitForRegistry();

		// An additional wait is required in order for all resolvers to finish.
		await act( waitForDefaultTimeouts );

		expect( fetchMock ).toHaveFetchedTimes(
			1,
			updateAnalyticsSettingsRegexp
		);

		expect( finishSetup ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'auto-submits the form', async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {} );
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries(
			accountSummaries.map( ( account ) => ( {
				...account,
				propertySummaries: [],
			} ) )
		);
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
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				defaultEnhancedMeasurementSettings,
				{
					propertyID,
					webDataStreamID,
				}
			);

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.selectAccount( accountID );

		// @TODO: This is temporarily needed here as the AccountSelect component
		// still relies on the `analytics` datastore. This should be removed
		// once the two Analytics modules are entirely decoupled.
		registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

		// Simulate an auto-submit case where the user is returning to the page
		// after granting extra scopes necessary to submit.
		// In this situation, the autoSubmit is set before the user goes to oAuth,
		// store state is snapshotted, and then restored upon returning.
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { autoSubmit: true } );

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedTours( [ ga4ReportingTour.slug ] );

		const createPropertyRegexp = new RegExp(
			'/analytics-4/data/create-property'
		);

		const createWebDataStreamRegexp = new RegExp(
			'/analytics-4/data/create-webdatastream'
		);

		const updateAnalyticsSettingsRegexp = new RegExp(
			'/analytics-4/data/settings'
		);

		const accountSummariesRegexp = new RegExp(
			'/analytics-4/data/account-summaries'
		);

		fetchMock.post( createPropertyRegexp, {
			status: 200,
			body: properties[ 0 ],
		} );

		fetchMock.post( createWebDataStreamRegexp, {
			status: 200,
			body: webDataStreams[ 2 ],
		} );

		fetchMock.get( accountSummariesRegexp, {
			status: 200,
			body: accountSummaries,
		} );

		muteFetch( updateAnalyticsSettingsRegexp );

		const finishSetup = jest.fn();
		const { getByRole, waitForRegistry } = render(
			<SetupForm finishSetup={ finishSetup } />,
			{
				registry,
			}
		);
		await waitForRegistry();

		// An additional wait is required in order for all resolvers to finish.
		await act( async () => {
			await waitForDefaultTimeouts();
		} );

		// Ensure the form rendered successfully.
		expect(
			getByRole( 'button', { name: /Complete setup/i } )
		).toBeInTheDocument();

		await waitForRegistry();

		// An additional wait is required in order for all resolvers to finish.
		await act( async () => {
			await waitForDefaultTimeouts();
		} );

		expect( fetchMock ).toHaveFetchedTimes( 1, createPropertyRegexp );
		expect( fetchMock ).toHaveFetchedTimes( 1, createWebDataStreamRegexp );
		expect( fetchMock ).toHaveFetchedTimes(
			1,
			updateAnalyticsSettingsRegexp
		);

		expect( finishSetup ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'auto-submits the form only once in the case of an error', async () => {
		registry.dispatch( MODULES_TAGMANAGER ).setSettings( {} );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries(
			accountSummaries.map( ( account ) => ( {
				...account,
				propertySummaries: [],
			} ) )
		);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreamsBatch( webDataStreamsBatch, {
				propertyIDs: [ propertyID ],
			} );

		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.selectAccount( accountID );

		// @TODO: This is temporarily needed here as the AccountSelect component
		// still relies on the `analytics` datastore. This should be removed
		// once the two Analytics modules are entirely decoupled.
		registry.dispatch( MODULES_ANALYTICS ).setAccountID( accountID );

		// Simulate an auto-submit case where the user is returning to the page
		// after granting extra scopes necessary to submit.
		// In this situation, the autoSubmit is set before the user goes to oAuth,
		// store state is snapshotted, and then restored upon returning.
		registry
			.dispatch( CORE_FORMS )
			.setValues( FORM_SETUP, { autoSubmit: true } );

		provideUserAuthentication( registry, {
			grantedScopes: [ EDIT_SCOPE ],
		} );

		registry
			.dispatch( CORE_USER )
			.receiveGetDismissedTours( [ ga4ReportingTour.slug ] );

		const createPropertyRegexp = new RegExp(
			'/analytics-4/data/create-property'
		);

		fetchMock.post( createPropertyRegexp, {
			status: 403,
			body: {
				code: 403,
				error: 'Insufficient permissions',
			},
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
		expect(
			getByRole( 'button', { name: /Complete setup/i } )
		).toBeInTheDocument();

		// While not strictly needed, add waits to match the successful auto-submit test case to help avoid a false positive result.
		await waitForRegistry();
		await act( async () => {
			await waitForDefaultTimeouts();
		} );

		// Create property should have only been called once.
		expect( fetchMock ).toHaveFetchedTimes( 1, createPropertyRegexp );
		// Setup was not successful, so the finish function should not be called.
		expect( finishSetup ).not.toHaveBeenCalled();
		// Expect a console error due to the API error (otherwise this test will fail).
		expect( console ).toHaveErrored();
	} );
} );
