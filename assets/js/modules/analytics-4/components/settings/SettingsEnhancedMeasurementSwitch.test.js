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
import {
	act,
	createTestRegistry,
	render,
} from '../../../../../../tests/js/test-utils';
import * as fixtures from '../../datastore/__fixtures__';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';
import {
	ENHANCED_MEASUREMENT_ENABLED,
	ENHANCED_MEASUREMENT_FORM,
	MODULES_ANALYTICS_4,
	PROPERTY_CREATE,
	WEBDATASTREAM_CREATE,
} from '../../datastore/constants';
import SettingsEnhancedMeasurementSwitch from './SettingsEnhancedMeasurementSwitch';

describe( 'SettingsEnhancedMeasurementSwitch', () => {
	const { webDataStreams, accountSummaries } = fixtures;
	const accounts = accountSummaries;
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

		registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
			accountID,
		} );

		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
			propertyID,
			webDataStreamID,
		} );

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetAccountSummaries( accounts );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'getAccounts', [] );
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

	it( 'should render with the switch defaulting to the on position when enhanced measurement is enabled for the web data stream', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setEnhancedMeasurementStreamEnabled(
				propertyID,
				webDataStreamID,
				true
			);

		const { container, getByLabelText } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).toBeChecked();
	} );

	it( 'should render with the switch defaulting to the off position when enhanced measurement is disabled for the web data stream', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setEnhancedMeasurementStreamEnabled(
				propertyID,
				webDataStreamID,
				false
			);

		const { container, getByLabelText } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).not.toBeChecked();
	} );

	it( 'should not render the switch when enhanced measurement is already enabled for the web data stream', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...enhancedMeasurementSettingsMock,
					streamEnabled: true,
				},
				{ propertyID, webDataStreamID }
			);

		const { container, queryByLabelText, getByText } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect(
			queryByLabelText( 'Enable enhanced measurement' )
		).not.toBeInTheDocument();

		expect(
			getByText(
				'Enhanced measurement is enabled for this web data stream'
			)
		).toBeInTheDocument();
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

		it( 'should render correctly, with the switch defaulting to the on position', () => {
			const { container, getByLabelText } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			expect( container ).toMatchSnapshot();

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			expect( switchControl ).toBeChecked();
		} );

		it( 'should not default the switch to the on position when `isEnhancedMeasurementEnabled` is already `false`', () => {
			registry
				.dispatch( CORE_FORMS )
				.setValues( ENHANCED_MEASUREMENT_FORM, {
					[ ENHANCED_MEASUREMENT_ENABLED ]: false,
				} );

			const { getByLabelText } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			expect( switchControl ).not.toBeChecked();
		} );
	} );

	it.each( [
		[
			'enhanced measurement settings is loading',
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
					.invalidateResolution( 'getAccounts', [] );
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
	] )(
		'should render correctly, with the switch in the loading state when %s',
		async ( _, setLoadingState ) => {
			setLoadingState();

			const { container, getByRole, waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			expect( container ).toMatchSnapshot();

			expect( getByRole( 'progressbar' ) ).toBeInTheDocument();

			await act( waitForRegistry );
		}
	);

	it( 'should render correctly, with the switch disabled when hasAnalytics4Access is false', async () => {
		await registry
			.dispatch( MODULES_ANALYTICS_4 )
			.setEnhancedMeasurementStreamEnabled(
				propertyID,
				webDataStreamID,
				false
			);

		const { container, getByLabelText } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access={ false } />,
			{ registry }
		);

		expect( container ).toMatchSnapshot();

		expect(
			getByLabelText( 'Enable enhanced measurement' )
		).toBeDisabled();
	} );

	it( 'should toggle the switch on click', async () => {
		const { getByLabelText, waitForRegistry } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
			{
				registry,
			}
		);

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).not.toBeChecked();

		switchControl.click();

		await act( waitForRegistry );

		expect( switchControl ).toBeChecked();
	} );

	it( 'should toggle the streamEnabled setting on click', async () => {
		const { getByLabelText, waitForRegistry } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
			{
				registry,
			}
		);

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.isEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID
				)
		).toBe( false );

		switchControl.click();

		await act( waitForRegistry );

		expect(
			registry
				.select( MODULES_ANALYTICS_4 )
				.isEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID
				)
		).toBe( true );
	} );

	describe.each( [
		[ 'propertyID', PROPERTY_CREATE ],
		[ 'webDataStreamID', WEBDATASTREAM_CREATE ],
	] )( 'when the %s is changed to %s', ( settingName, settingCreate ) => {
		beforeEach( async () => {
			await registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID,
					true
				);
		} );

		it( 'should revert the switch from off to on', async () => {
			const { getByLabelText, waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			switchControl.click();

			await act( waitForRegistry );

			expect( switchControl ).not.toBeChecked();

			act( () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					[ settingName ]: settingCreate,
				} );
			} );

			expect( switchControl ).toBeChecked();
		} );

		it( 'should not toggle the switch from on to off', () => {
			const { getByLabelText } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			expect( switchControl ).toBeChecked();

			act( () => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					[ settingName ]: settingCreate,
				} );
			} );

			expect( switchControl ).toBeChecked();
		} );
	} );

	it( "should set the switch according to the web data stream's streamEnabled value when changing propertyID", async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			propertyID: PROPERTY_CREATE,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...enhancedMeasurementSettingsMock,
					streamEnabled: true,
				},
				{ propertyID, webDataStreamID }
			);

		const { getByLabelText, getByText, waitForRegistry } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
			{
				registry,
			}
		);

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		switchControl.click();

		await act( waitForRegistry );

		expect( switchControl ).not.toBeChecked();

		act( () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				propertyID,
			} );
		} );

		await act( waitForRegistry );

		expect( switchControl ).not.toBeInTheDocument();

		expect(
			getByText(
				'Enhanced measurement is enabled for this web data stream'
			)
		).toBeInTheDocument();
	} );

	it( "should set the switch according to the web data stream's streamEnabled value when changing webDataStreamID", async () => {
		registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
			webDataStreamID: WEBDATASTREAM_CREATE,
		} );
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...enhancedMeasurementSettingsMock,
					streamEnabled: true,
				},
				{ propertyID, webDataStreamID }
			);

		const { getByLabelText, getByText, waitForRegistry } = render(
			<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
			{
				registry,
			}
		);

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		switchControl.click();

		await act( waitForRegistry );

		expect( switchControl ).not.toBeChecked();

		act( () => {
			registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
				webDataStreamID,
			} );
		} );

		await act( waitForRegistry );

		expect( switchControl ).not.toBeInTheDocument();

		expect(
			getByText(
				'Enhanced measurement is enabled for this web data stream'
			)
		).toBeInTheDocument();
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
				.invalidateResolution( 'getAccounts', [] );

			const { waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			await act( waitForRegistry );

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should not attempt to retrieve enhanced measurement settings when web data streams are loading', async () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.invalidateResolution( 'getWebDataStreams', [ propertyID ] );

			const { waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			await act( waitForRegistry );

			expect( fetchMock ).toHaveFetchedTimes( 0 );
		} );

		it( 'should retrieve enhanced measurement settings when neither properties or web data streams are loading', async () => {
			const { waitForRegistry } = render(
				<SettingsEnhancedMeasurementSwitch hasAnalytics4Access />,
				{
					registry,
				}
			);

			await act( waitForRegistry );

			expect( fetchMock ).toHaveFetchedTimes( 1 );
			expect( fetchMock ).toHaveFetched(
				enhancedMeasurementSettingsEndpoint
			);
		} );
	} );
} );
