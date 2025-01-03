/**
 * Search Console SettingsForm component stories.
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
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_SEARCH_CONSOLE } from '../../datastore/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';

const defaultSettings = {
	propertyID: '',
};

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--search-console">
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

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const WithoutModuleAccess = Template.bind( {} );
WithoutModuleAccess.storyName = 'Without Module Access';
WithoutModuleAccess.args = {
	hasModuleAccess: false,
};
WithoutModuleAccess.scenario = {};

export default {
	title: 'Modules/SearchConsole/Components/Settings/SettingsForm',
	component: SettingsForm,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetSettings( {} );

				provideUserAuthentication( registry );
				provideModules( registry, [
					{
						slug: 'search-console',
						active: true,
						connected: true,
					},
				] );
				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetSettings( {
						...defaultSettings,
						propertyID: 'sc-domain:example.com',
					} );
				registry
					.dispatch( MODULES_SEARCH_CONSOLE )
					.receiveGetMatchedProperties( [
						{
							permissionLevel: 'siteFullUser',
							siteURL: 'https://www.example.com/',
						},
						{
							permissionLevel: 'siteFullUser',
							siteURL: 'http://example.com/',
						},
						{
							permissionLevel: 'siteFullUser',
							siteURL: 'sc-domain:example.com',
						},
					] );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
