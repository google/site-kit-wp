/**
 * Ads SettingsView component stories.
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
import { MODULES_ADS } from '../../datastore/constants';
import { MODULE_SLUG_ADS } from '../../constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template() {
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
Default.storyName = 'Default';
Default.scenario = {};
Default.parameters = {
	features: [ 'googleTagGateway' ],
};

export const IceEnabled = Template.bind( null );
IceEnabled.storyName = 'With ICE enabled';
IceEnabled.args = {
	enhancedConversionTracking: true,
};
IceEnabled.parameters = {
	features: [ 'googleTagGateway' ],
};

export const GTGEnabled = Template.bind( null );
GTGEnabled.storyName = 'With Google tag gateway enabled';
GTGEnabled.args = {
	googleTagGateway: true,
};
GTGEnabled.parameters = {
	features: [ 'googleTagGateway' ],
};

export default {
	title: 'Modules/Ads/Settings/SettingsView',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: MODULE_SLUG_ADS,
						active: true,
						connected: true,
					},
				] );

				registry.dispatch( MODULES_ADS ).receiveGetSettings( {
					conversionID: 'AW-123456789',
				} );

				registry
					.dispatch( CORE_SITE )
					.setConversionTrackingEnabled(
						args.enhancedConversionTracking || false
					);

				registry
					.dispatch( CORE_SITE )
					.receiveGetGoogleTagGatewaySettings( {
						isEnabled: args.googleTagGateway || false,
						isGTGHealthy: args.googleTagGateway || false,
						isScriptAccessEnabled: args.googleTagGateway || false,
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

export const PaxConnected = Template.bind( null );
PaxConnected.storyName = 'With PAX onboarding';
PaxConnected.scenario = {};
PaxConnected.parameters = {
	features: [ 'adsPax', 'googleTagGateway' ],
};
PaxConnected.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			// Unset the value set in the previous scenario.
			registry.dispatch( MODULES_ADS ).setConversionID( null );

			registry.dispatch( MODULES_ADS ).receiveGetSettings( {
				paxConversionID: 'AW-54321',
				extCustomerID: 'C-872756827HGFSD',
			} );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];
