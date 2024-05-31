/**
 * Analytics SettingsView component stories.
 *
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
import SettingsView from './SettingsView';
import { Cell, Grid, Row } from '../../../../material-components';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';

const { accountSummaries, webDataStreamsBatch, googleTagSettings } = fixtures;
const accounts = accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;
const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;
const measurementID =
	// eslint-disable-next-line sitekit/acronym-case
	webDataStreamsBatch[ propertyID ][ 0 ].webStreamData.measurementId;

function Template( {} ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--analytics">
				<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<SettingsView />
							</Cell>
						</Row>
					</Grid>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( null );
Default.storyName = 'SettingsView';

export default {
	title: 'Modules/Analytics4/Settings/SettingsView',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID,
					propertyID,
					webDataStreamID,
					measurementID,
					useSnippet: true,
					...googleTagSettings,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.setEnhancedMeasurementStreamEnabled(
						propertyID,
						webDataStreamID,
						true
					);
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};

export const IceEnabled = Template.bind( null );
IceEnabled.title = 'Modules/Analytics4/Settings/SettingsView/IceEnabled';
IceEnabled.storyName = 'SettingsView ICE Enabled';
IceEnabled.scenario = {
	label: 'Modules/Analytics4/Settings/SettingsView/ICE/Enabled',
};
IceEnabled.parameters = {
	features: [ 'conversionInfra' ],
};
IceEnabled.decorators = [
	( Story, { parameters } ) => {
		const setupRegistry = ( registry ) => {
			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				accountID,
				propertyID,
				webDataStreamID,
				measurementID,
				useSnippet: true,
				...googleTagSettings,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID,
					true
				);

			registry.dispatch( CORE_SITE ).setConversionTrackingEnabled( true );
		};

		return (
			<WithRegistrySetup
				func={ setupRegistry }
				features={ parameters.features || [] }
			>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const IceDisabled = Template.bind( null );
IceDisabled.title = 'Modules/Analytics4/Settings/SettingsView/IceDisabled';
IceDisabled.storyName = 'SettingsView ICE Disabled';
IceDisabled.scenario = {
	label: 'Modules/Analytics4/Settings/SettingsView/ICE/Disabled',
};
IceDisabled.parameters = {
	features: [ 'conversionInfra' ],
};
IceDisabled.decorators = [
	( Story, { parameters } ) => {
		const setupRegistry = ( registry ) => {
			provideModules( registry, [
				{
					slug: 'analytics-4',
					active: true,
					connected: true,
				},
			] );

			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
				accountID,
				propertyID,
				webDataStreamID,
				measurementID,
				useSnippet: true,
				...googleTagSettings,
			} );

			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.setEnhancedMeasurementStreamEnabled(
					propertyID,
					webDataStreamID,
					true
				);

			registry
				.dispatch( CORE_SITE )
				.setConversionTrackingEnabled( false );
		};

		return (
			<WithRegistrySetup
				func={ setupRegistry }
				features={ parameters.features || [] }
			>
				<Story />
			</WithRegistrySetup>
		);
	},
];
