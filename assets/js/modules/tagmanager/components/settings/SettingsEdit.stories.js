/**
 * Tag Manager SettingsEdit component stories.
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
import SettingsEdit from './SettingsEdit';
import { Cell, Grid, Row } from '../../../../material-components';
import { ACCOUNT_CREATE, MODULES_TAGMANAGER } from '../../datastore/constants';
import {
	provideModuleRegistrations,
	provideModules,
	provideUserAuthentication,
} from '../../../../../../tests/js/utils';
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
									<SettingsEdit { ...args } />
								</Cell>
							</Row>
						</Grid>
					</div>
				</div>
			</div>
		</div>
	);
}

export const CreateAnAccount = Template.bind( {} );
CreateAnAccount.storyName = 'Create An Account';

export default {
	title: 'Modules/TagManager/Settings/SettingsEdit',
	component: SettingsEdit,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( null );

				provideUserAuthentication( registry );
				registry.dispatch( MODULES_TAGMANAGER ).setOwnerID( 1 );

				provideModules( registry, [
					{
						slug: 'tagmanager',
						storyName: MODULES_TAGMANAGER,
						active: true,
						connected: true,
					},
				] );
				provideModuleRegistrations( registry );

				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAccountID( ACCOUNT_CREATE );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
