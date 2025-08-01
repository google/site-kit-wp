/**
 * Ads SettingsForm component stories.
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
 * External dependencies
 */
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import SettingsForm from './SettingsForm';
import { Cell, Grid, Row } from '../../../../material-components';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_ADS } from '../../datastore/constants';
import { MODULE_SLUG_ADS } from '../../constants';
import { provideModules } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--ads">
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
Default.scenario = {};
Default.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_ADS ).receiveGetSettings( {
			conversionID: 'AW-123456789',
		} );
	},
};

export const Empty = Template.bind( null );
Empty.storyName = 'Empty';
Empty.scenario = {};

export const GoogleTagGatewayEnabled = Template.bind( null );
GoogleTagGatewayEnabled.storyName = 'GoogleTagGatewayEnabled';
GoogleTagGatewayEnabled.scenario = {};
GoogleTagGatewayEnabled.args = {
	features: [ 'googleTagGateway' ],
	setupRegistry: ( registry ) => {
		const gtgServerRequirementsEndpoint = new RegExp(
			'^/google-site-kit/v1/core/site/data/gtg-server-requirement-status'
		);

		const gtgSettings = {
			isEnabled: true,
			isGTGHealthy: true,
			isScriptAccessEnabled: true,
		};

		fetchMock.getOnce( gtgServerRequirementsEndpoint, {
			body: gtgSettings,
		} );

		registry
			.dispatch( CORE_SITE )
			.receiveGetGoogleTagGatewaySettings( gtgSettings );
	},
};

export const GoogleTagGatewayDisabledWithWarning = Template.bind( null );
GoogleTagGatewayDisabledWithWarning.storyName =
	'GoogleTagGatewayDisabledWithWarning';
GoogleTagGatewayDisabledWithWarning.scenario = {};
GoogleTagGatewayDisabledWithWarning.args = {
	features: [ 'googleTagGateway' ],
	setupRegistry: ( registry ) => {
		const gtgServerRequirementsEndpoint = new RegExp(
			'^/google-site-kit/v1/core/site/data/gtg-server-requirement-status'
		);

		const gtgSettings = {
			isEnabled: true,
			isGTGHealthy: false,
			isScriptAccessEnabled: false,
		};

		fetchMock.getOnce( gtgServerRequirementsEndpoint, {
			body: gtgSettings,
		} );

		registry
			.dispatch( CORE_SITE )
			.receiveGetGoogleTagGatewaySettings( gtgSettings );
	},
};

export default {
	title: 'Modules/Ads/Settings/SettingsForm',
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

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story { ...args } />
				</WithRegistrySetup>
			);
		},
	],
};
