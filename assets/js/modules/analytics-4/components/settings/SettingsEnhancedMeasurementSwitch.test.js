/**
 * SettingsEnhancedMeasurementSwitch tests.
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
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import * as fixtures from '@/js/modules/analytics-4/datastore/__fixtures__';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '@/js/modules/analytics-4/datastore/constants';
import { createTestRegistry, fireEvent, render } from '@tests/js/test-utils';
import SettingsEnhancedMeasurementSwitch from './SettingsEnhancedMeasurementSwitch';

// On the settings screen, enhanced measurement is a row. While off it has a
// star icon and an Enable button. Once on it shows a green check and no
// button.
describe( 'SettingsEnhancedMeasurementSwitch', () => {
	const { webDataStreams, accountSummaries } = fixtures;
	const accounts = accountSummaries.accountSummaries;
	const properties = accounts[ 1 ].propertySummaries;
	const accountID = accounts[ 1 ]._id;
	const propertyID = properties[ 0 ]._id;
	const webDataStreamID = webDataStreams[ 0 ]._id;

	let enhancedMeasurementSettingsMock;
	let registry;

	function setupRegistry() {
		enhancedMeasurementSettingsMock = {
			fileDownloadsEnabled: null,
			name: `properties/${ propertyID }/dataStreams/${ webDataStreamID }/enhancedMeasurementSettings`,
			outboundClicksEnabled: null,
			pageChangesEnabled: null,
			scrollsEnabled: null,
			searchQueryParameter: 'q,s,search,query,keyword',
			siteSearchEnabled: null,
			streamEnabled: false,
			uriQueryParameter: null,
			videoEngagementEnabled: null,
		};

		registry = createTestRegistry();

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			accountID,
			propertyID,
			webDataStreamID,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetAccountSummaries( {
			accountSummaries: accounts,
			nextPageToken: null,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getAccountSummaries', [] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetWebDataStreams( webDataStreams, {
				propertyID,
			} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getWebDataStreams', [ propertyID ] );
	}

	beforeEach( () => {
		setupRegistry();

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				enhancedMeasurementSettingsMock,
				{ propertyID, webDataStreamID }
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getEnhancedMeasurementSettings', [
				propertyID,
				webDataStreamID,
			] );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'isEnhancedMeasurementStreamAlreadyEnabled', [
				propertyID,
				webDataStreamID,
			] );
	} );

	it( 'shows the Enable button when enhanced measurement is off for the web data stream', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setEnhancedMeasurementStreamEnabled( {
				propertyID,
				webDataStreamID,
				enabled: false,
			} );

		const { container, getByRole } = render(
			<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
			{ registry }
		);

		expect(
			getByRole( 'button', { name: /enable/i } )
		).toBeInTheDocument();
		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row__icon--check'
			)
		).not.toBeInTheDocument();
	} );

	it( 'shows the green check and hides the Enable button when enhanced measurement is enabled for the web data stream', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setEnhancedMeasurementStreamEnabled( {
				propertyID,
				webDataStreamID,
				enabled: true,
			} );

		const { container, queryByRole } = render(
			<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
			{ registry }
		);

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row__icon--check'
			)
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: /enable/i } )
		).not.toBeInTheDocument();
	} );

	it( 'shows the green check and hides the Enable button when enhanced measurement is already enabled for the web data stream', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...enhancedMeasurementSettingsMock,
					streamEnabled: true,
				},
				{ propertyID, webDataStreamID }
			);

		const { container, queryByRole } = render(
			<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
			{ registry }
		);

		expect(
			container.querySelector(
				'.googlesitekit-settings-measurement-row__icon--check'
			)
		).toBeInTheDocument();
		expect(
			queryByRole( 'button', { name: /enable/i } )
		).not.toBeInTheDocument();
	} );

	describe.each( [
		[ 'propertyID', PROPERTY_CREATE ],
		[ 'webDataStreamID', WEBDATASTREAM_CREATE ],
	] )( 'when %s is %s', ( settingName, settingCreate ) => {
		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setSettings( { [ settingName ]: settingCreate } );
		} );

		it( 'shows the green check, defaulting enhanced measurement to enabled', () => {
			const { container, queryByRole } = render(
				<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
				{ registry }
			);

			expect(
				container.querySelector(
					'.googlesitekit-settings-measurement-row__icon--check'
				)
			).toBeInTheDocument();
			expect(
				queryByRole( 'button', { name: /enable/i } )
			).not.toBeInTheDocument();
		} );

		it( 'shows the Enable button when enhanced measurement is already off', () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( ENHANCED_MEASUREMENT_FORM, {
					[ ENHANCED_MEASUREMENT_ENABLED ]: false,
				} );

			const { getByRole } = render(
				<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
				{ registry }
			);

			expect(
				getByRole( 'button', { name: /enable/i } )
			).toBeInTheDocument();
		} );
	} );

	it.each( [
		[
			'enhanced measurement settings are loading',
			() => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.invalidateResolution( 'getEnhancedMeasurementSettings', [
						propertyID,
						webDataStreamID,
					] );
			},
		],
		[
			'property summaries are loading',
			() => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.invalidateResolution( 'getAccountSummaries', [] );
			},
		],
		[
			'web data streams are loading',
			() => {
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.invalidateResolution( 'getWebDataStreams', [
						propertyID,
					] );
			},
		],
	] )( 'renders a progress bar while %s', async ( _, setLoadingState ) => {
		setLoadingState();

		const { getByRole, waitForRegistry } = render(
			<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
			{ registry }
		);

		expect( getByRole( 'progressbar' ) ).toBeInTheDocument();

		await waitForRegistry();
	} );

	it( 'disables the Enable button when the user has no module access', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setEnhancedMeasurementStreamEnabled( {
				propertyID,
				webDataStreamID,
				enabled: false,
			} );

		const { getByRole } = render(
			<SettingsEnhancedMeasurementSwitch hasModuleAccess={ false } />,
			{ registry }
		);

		expect( getByRole( 'button', { name: /enable/i } ) ).toBeDisabled();
	} );

	it( 'enables enhanced measurement when the Enable button is clicked', async () => {
		const { getByRole, waitForRegistry } = render(
			<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
			{ registry }
		);

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.isEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID
				)
		).toBe( false );

		fireEvent.click( getByRole( 'button', { name: /enable/i } ) );

		await waitForRegistry();

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.isEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID
				)
		).toBe( true );
	} );

	describe( 'synchronization of enhanced measurement settings retrieval with loading states', () => {
		const enhancedMeasurementSettingsEndpoint = new RegExp(
			'^/google-site-kit/v1/modules/analytics-4/data/enhanced-measurement-settings'
		);

		beforeEach( () => {
			setupRegistry();

			fetchMock.getOnce( enhancedMeasurementSettingsEndpoint, {
				status: 200,
				body: enhancedMeasurementSettingsMock,
			} );
		} );

		it( 'should not attempt to retrieve enhanced measurement settings when property summaries are loading', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getAccountSummaries', [] );

			const { waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should not attempt to retrieve enhanced measurement settings when web data streams are loading', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getWebDataStreams', [ propertyID ] );

			const { waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should retrieve enhanced measurement settings when neither properties or web data streams are loading', async () => {
			const { waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasModuleAccess />,
				{
					registry,
				}
			);

			await waitForRegistry();

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( fetchMock ).toHaveFetched(
				enhancedMeasurementSettingsEndpoint
			);
		} );
	} );
} );
