/**
 * Tag Manager SettingsGoogleTagGatewayStatus component stories.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import SettingsGoogleTagGatewayStatus from './SettingsGoogleTagGatewayStatus';
import { Grid } from '@/js/material-components';

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active">
				<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
					<Grid>
						<SettingsGoogleTagGatewayStatus />
					</Grid>
				</div>
			</div>
		</div>
	);
}

export const GTGDisabled = Template.bind( null );
GTGDisabled.storyName = 'With Google tag gateway disabled';

export const GTGEnabled = Template.bind( null );
GTGEnabled.storyName = 'With Google tag gateway enabled';
GTGEnabled.parameters = {
	features: [ 'googleTagGateway' ],
};
GTGEnabled.decorators = [
	( Story ) => {
		function setupRegistry( registry ) {
			registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
				isEnabled: true,
				isGTGHealthy: true,
				isScriptAccessEnabled: true,
			} );
		}

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/TagManager/Settings/SettingsGoogleTagGatewayStatus',
	component: SettingsGoogleTagGatewayStatus,
};
