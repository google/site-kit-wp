/**
 * Analytics 4 SettingsForm component stories.
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
import SettingsForm from './SettingsForm';
import { Cell, Grid, Row } from '../../../../material-components';
import { MODULES_ANALYTICS_4 } from '../../datastore/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';
import { MODULES_ANALYTICS } from '../../../analytics/datastore/constants';

const {
	accountSummaries,
	webDataStreamsBatch,
	defaultEnhancedMeasurementSettings,
} = fixtures;
const accounts = accountSummaries;
const properties = accounts[ 1 ].propertySummaries;
const accountID = accounts[ 1 ]._id;
const propertyID = properties[ 0 ]._id;
const webDataStreams = webDataStreamsBatch[ propertyID ];
const webDataStreamID = webDataStreamsBatch[ propertyID ][ 0 ]._id;
const measurementID =
	// eslint-disable-next-line sitekit/acronym-case
	webDataStreamsBatch[ propertyID ][ 0 ].webStreamData.measurementId;

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--analytics">
				<div className="googlesitekit-setup-module">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<SettingsForm { ...args } />
								</Cell>
							</Row>
						</Grid>
					</div>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( null );
Default.storyName = 'Default';
Default.scenario = {
	label: 'Modules/Analytics4/Settings/SettingsEdit/Default',
	delay: 250,
};

export const EnhancedMeasurementSwitch = Template.bind( null );
EnhancedMeasurementSwitch.storyName = 'With Enhanced Measurement Switch';
EnhancedMeasurementSwitch.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			registry
				.dispatch( MODULES_ANALYTICS_4 )
				.receiveGetEnhancedMeasurementSettings(
					{},
					{
						propertyID,
						webDataStreamID,
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

export default {
	title: 'Modules/Analytics4/Settings/SettingsEdit',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				global._googlesitekitDashboardSharingData = {
					settings: {},
					roles: [],
				};

				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
						owner: { login: 'analytics_4-owner-username' },
					},
				] );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID,
					propertyID,
					webDataStreamID,
					measurementID,
					useSnippet: true,
					canUseSnippet: true,
					anonymizeIP: true,
					trackingDisabled: [ 'loggedinUsers' ],
				} );
				registry.dispatch( MODULES_ANALYTICS ).receiveGetSettings( {
					accountID,
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetWebDataStreams( webDataStreams, {
						propertyID,
					} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetEnhancedMeasurementSettings(
						{
							...defaultEnhancedMeasurementSettings,
						},
						{
							propertyID,
							webDataStreamID,
						}
					);
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	args: {
		hasModuleAccess: true,
	},
};
