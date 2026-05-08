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
import { Cell, Grid, Row } from '@/js/material-components';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '@/js/modules/analytics-4/datastore/__fixtures__';

const { accountSummaries, webDataStreamsBatch, googleTagSettings } = fixtures;
const accounts = accountSummaries.accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;
const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;
const measurementID =
	// eslint-disable-next-line sitekit/acronym-case
	webDataStreamsBatch[ propertyID ][ 0 ].webStreamData.measurementId;

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--analytics-4">
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
Default.storyName = 'Default';
Default.scenario = {};
Default.parameters = {
	features: [ 'googleTagGateway' ],
};

export const IceEnabled = Template.bind( null );
IceEnabled.storyName = 'SettingsView ICE Enabled';
IceEnabled.args = {
	enhancedConversionTracking: true,
};
IceEnabled.parameters = {
	features: [ 'googleTagGateway' ],
};

export const IceResolving = Template.bind( null );
IceResolving.storyName = 'SettingsView ICE Resolving';
IceResolving.args = {
	enhancedConversionTracking: 'resolving',
};
IceResolving.parameters = {
	features: [ 'googleTagGateway' ],
};

export const GTGEnabled = Template.bind( null );
GTGEnabled.storyName = 'SettingsView Google tag gateway Enabled';
GTGEnabled.args = {
	enhancedConversionTracking: false,
	googleTagGateway: true,
};
GTGEnabled.parameters = {
	features: [ 'googleTagGateway' ],
};

export const WithEnhancedConversionsNotice = Template.bind( null );
WithEnhancedConversionsNotice.storyName = 'With enhanced conversions notice';
WithEnhancedConversionsNotice.parameters = {
	features: [ 'gtagUserData' ],
};

export default {
	title: 'Modules/Analytics4/Settings/SettingsView',
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ANALYTICS_4,
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
					.receiveGetEnhancedMeasurementSettings(
						fixtures.defaultEnhancedMeasurementSettings,
						{ propertyID, webDataStreamID }
					);

				if ( args.enhancedConversionTracking !== 'resolving' ) {
					registry
						.dispatch( CORE_SITE )
						.setConversionTrackingEnabled(
							args.enhancedConversionTracking || false
						);
				}

				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: args.googleTagGateway || false,
						isGTGHealthy: args.googleTagGateway || false,
						isScriptAccessEnabled: args.googleTagGateway || false,
					} );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
