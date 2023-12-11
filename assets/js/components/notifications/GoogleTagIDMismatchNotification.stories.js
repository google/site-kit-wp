/**
 * GoogleTagIDMismatchNotification Component stories.
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
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import { MODULES_ANALYTICS } from '../../modules/analytics/datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';
import * as fixtures from '../../modules/analytics-4/datastore/__fixtures__';
import GoogleTagIDMismatchNotification from './GoogleTagIDMismatchNotification';

function Template( { ...args } ) {
	return <GoogleTagIDMismatchNotification { ...args } />;
}

export const AlternativeGA4Config = Template.bind( {} );
AlternativeGA4Config.storyName = 'AlternativeGA4Config';
AlternativeGA4Config.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const gtmAccountID = '6065484567';
			const gtmContainerID = '98369876';
			const containerDestinationsMock =
				fixtures.containerDestinations[ gtmAccountID ][
					gtmContainerID
				];

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setGoogleTagAccountID( gtmAccountID );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setGoogleTagContainerID( gtmContainerID );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetGoogleTagContainerDestinations(
					containerDestinationsMock,
					{
						gtmAccountID,
						gtmContainerID,
					}
				);
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
AlternativeGA4Config.scenario = {
	label: 'Global/GoogleTagIDMismatchNotification/AlternativeGA4Config',
};

export const NoAlternativeGA4Config = Template.bind( {} );
NoAlternativeGA4Config.storyName = 'NoAlternativeGA4Config';
NoAlternativeGA4Config.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const gtmAccountID = '6065484567';
			const gtmContainerID = '98369876';

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setGoogleTagAccountID( gtmAccountID );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setGoogleTagContainerID( gtmContainerID );
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetGoogleTagContainerDestinations( [], {
					gtmAccountID,
					gtmContainerID,
				} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
NoAlternativeGA4Config.scenario = {
	label: 'Global/GoogleTagIDMismatchNotification/NoAlternativeGA4Config',
};

export default {
	title: 'Components/GoogleTagIDMismatchNotification',
	component: GoogleTagIDMismatchNotification,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry.dispatch( MODULES_ANALYTICS ).setSettings( {} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setHasMismatchedGoogleTagID( true );

				const currentMeasurementID = 'G-2B7M8YQ1K6';

				const currentAnalyticsSettingsMock = {
					ownerID: 0,
					propertyID: '1000',
					webDataStreamID: '2000',
					measurementID: currentMeasurementID,
					useSnippet: true,
					googleTagID: 'GT-123',
					googleTagLastSyncedAtMs: 0,
				};
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setSettings( currentAnalyticsSettingsMock );
				const property = fixtures.properties[ 0 ];
				const propertyID = property._id;
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperty( property, { propertyID } );

				const containerMock =
					fixtures.container[ currentMeasurementID ];
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetGoogleTagContainer( containerMock, {
						measurementID: currentMeasurementID,
					} );

				const newAnalyticsPropertyID = '1122334455';
				const accountSummaries = [
					{
						_id: '123456',
						propertySummaries: [ { _id: newAnalyticsPropertyID } ],
					},
				];

				const propertyIDs = accountSummaries
					.map( ( { propertySummaries } ) =>
						propertySummaries.map( ( { _id } ) => _id )
					)
					.reduce( ( acc, propIDs ) => [ ...acc, ...propIDs ], [] );

				const datastreams = {
					[ newAnalyticsPropertyID ]: [
						{
							_id: '110',
							webStreamData: {
								defaultUri: 'http://example-1.test',
								measurementId: currentMeasurementID, // eslint-disable-line sitekit/acronym-case
							},
						},
					],
				};
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreamsBatch( datastreams, {
						propertyIDs,
					} );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.finishResolution( 'getWebDataStreamsBatch', [
						propertyIDs,
					] );
				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetProperty( fixtures.properties[ 1 ], {
						propertyID: newAnalyticsPropertyID,
					} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
