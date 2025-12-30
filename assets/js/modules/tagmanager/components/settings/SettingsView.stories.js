/**
 * Tag Manager SettingsView component stories.
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
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_TAGMANAGER } from '@/js/modules/tagmanager/datastore/constants';
import { MODULE_SLUG_TAGMANAGER } from '@/js/modules/tagmanager/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';

const defaultSettings = {
	accountID: '',
	containerID: '',
	internalContainerID: '',
	ampContainerID: '',
	internalAMPContainerID: '',
	useSnippet: true,
	ownerID: 0,
};

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--tagmanager">
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

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export const ExistingTag = Template.bind( {} );
ExistingTag.storyName = 'Existing Tag';
ExistingTag.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_TAGMANAGER )
			.receiveGetExistingTag( 'GTM-G000GL3' );
	},
};

export const GTGEnabled = Template.bind( {} );
GTGEnabled.storyName = 'Google tag gateway enabled';
GTGEnabled.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( CORE_SITE ).receiveGetGoogleTagGatewaySettings( {
			isEnabled: true,
			isGTGHealthy: true,
			isScriptAccessEnabled: true,
		} );
	},
};
GTGEnabled.parameters = {
	features: [ 'googleTagGateway' ],
};

export default {
	title: 'Modules/TagManager/Settings/SettingsView',
	component: SettingsView,
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				registry.dispatch( MODULES_TAGMANAGER ).receiveGetSettings( {
					...defaultSettings,
					accountID: '123456789',
					containerID: 'GTM-S1T3K1T',
					internalContainerID: '54321',
					useSnippet: true,
				} );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( null );
				provideUserAuthentication( registry );
				provideModules( registry, [
					{
						slug: MODULE_SLUG_TAGMANAGER,
						active: true,
						connected: true,
					},
				] );
				provideModuleRegistrations( registry );

				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
