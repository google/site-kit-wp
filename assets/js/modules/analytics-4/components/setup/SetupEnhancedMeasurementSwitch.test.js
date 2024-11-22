/**
 * SetupEnhancedMeasurementSwitch tests.
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
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import * as fixtures from '../../datastore/__fixtures__';
import SetupEnhancedMeasurementSwitch from './SetupEnhancedMeasurementSwitch';

describe( 'SetupEnhancedMeasurementSwitch', () => {
	let registry;

	const { webDataStreams, accountSummaries } = fixtures;
	const accounts = accountSummaries.accountSummaries;
	const properties = accounts[ 1 ].propertySummaries;
	const accountID = accounts[ 1 ]._id;
	const propertyID = properties[ 0 ]._id;
	const webDataStreamID = webDataStreams[ 0 ]._id;

	const enhancedMeasurementSettingsMock = {
		fileDownloadsEnabled: null,
		name: `properties/${ propertyID }/dataStreams/${ webDataStreamID }/enhancedMeasurementSettings`,
		outboundClicksEnabled: null,
		pageChangesEnabled: null,
		scrollsEnabled: null,
		searchQueryParameter: 'q,s,search,query,keyword',
		siteSearchEnabled: null,
		streamEnabled: true,
		uriQueryParameter: null,
		videoEngagementEnabled: null,
	};

	beforeEach( () => {
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

		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				enhancedMeasurementSettingsMock,
				{ propertyID, webDataStreamID }
			);
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.finishResolution( 'isEnhancedMeasurementStreamAlreadyEnabled', [
				propertyID,
				webDataStreamID,
			] );
	} );

	it( 'should not render the switch when accountID is not selected yet', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...enhancedMeasurementSettingsMock,
					streamEnabled: false,
				},
				{ propertyID, webDataStreamID }
			);

		registry.dispatch( MODULES_ANALYTICS_4 ).setAccountID( null );

		const { container, queryByLabelText } = render(
			<SetupEnhancedMeasurementSwitch />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		expect(
			queryByLabelText( 'Enable enhanced measurement' )
		).not.toBeInTheDocument();
	} );

	it( 'should not render the switch when enhanced measurement is already enabled', () => {
		const { container, queryByLabelText, getByText } = render(
			<SetupEnhancedMeasurementSwitch />,
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

	it( 'should render with the switch defaulting to the on position when enhanced measurement is not already enabled', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...enhancedMeasurementSettingsMock,
					streamEnabled: false,
				},
				{ propertyID, webDataStreamID }
			);

		const { container, getByLabelText, queryByText } = render(
			<SetupEnhancedMeasurementSwitch />,
			{
				registry,
			}
		);

		expect( container ).toMatchSnapshot();

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).toBeChecked();

		expect(
			queryByText(
				'Enhanced measurement is enabled for this web data stream'
			)
		).not.toBeInTheDocument();
	} );

	it( 'should toggle the switch on click', () => {
		registry
			.dispatch( MODULES_ANALYTICS_4 )
			.receiveGetEnhancedMeasurementSettings(
				{
					...enhancedMeasurementSettingsMock,
					streamEnabled: false,
				},
				{ propertyID, webDataStreamID }
			);

		const { getByLabelText } = render( <SetupEnhancedMeasurementSwitch />, {
			registry,
		} );

		const switchControl = getByLabelText( 'Enable enhanced measurement' );

		expect( switchControl ).toBeChecked();

		switchControl.click();

		expect( switchControl ).not.toBeChecked();
	} );

	describe.each( [
		[
			'accountID is changed',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					accountID: '1001',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...enhancedMeasurementSettingsMock,
							streamEnabled: false,
						},
						{ propertyID, webDataStreamID }
					);
			},
		],
		[
			'propertyID is changed',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					propertyID: '2001',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( webDataStreams, {
						propertyID: '2001',
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreams', [ '2001' ] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...enhancedMeasurementSettingsMock,
							streamEnabled: false,
						},
						{ propertyID: '2001', webDataStreamID }
					);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution(
						'isEnhancedMeasurementStreamAlreadyEnabled',
						[ '2001', webDataStreamID ]
					);
			},
		],
		[
			'webDataStreamID is changed',
			() => {
				registry.dispatch( MODULES_ANALYTICS_4 ).setSettings( {
					webDataStreamID: '3001',
				} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreams', [ '3001' ] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...enhancedMeasurementSettingsMock,
							streamEnabled: false,
						},
						{ propertyID, webDataStreamID: '3001' }
					);

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution(
						'isEnhancedMeasurementStreamAlreadyEnabled',
						[ propertyID, '3001' ]
					);
			},
		],
	] )( 'when the %s', ( _, changeSetting ) => {
		beforeEach( () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetEnhancedMeasurementSettings(
					{
						...enhancedMeasurementSettingsMock,
						streamEnabled: false,
					},
					{ propertyID, webDataStreamID }
				);
		} );

		it( 'should not toggle the switch from on to off', () => {
			const { getByLabelText } = render(
				<SetupEnhancedMeasurementSwitch />,
				{
					registry,
				}
			);

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			expect( switchControl ).toBeChecked();

			act( changeSetting );

			expect( switchControl ).toBeChecked();
		} );

		it( 'should toggle the switch to on from the already enabled state', () => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetEnhancedMeasurementSettings(
					{
						...enhancedMeasurementSettingsMock,
					},
					{ propertyID, webDataStreamID }
				);

			const { getByLabelText, getByText } = render(
				<SetupEnhancedMeasurementSwitch />,
				{
					registry,
				}
			);

			expect(
				getByText(
					'Enhanced measurement is enabled for this web data stream'
				)
			).toBeInTheDocument();

			act( changeSetting );

			const switchControl = getByLabelText(
				'Enable enhanced measurement'
			);

			expect( switchControl ).toBeChecked();
		} );
	} );
} );
