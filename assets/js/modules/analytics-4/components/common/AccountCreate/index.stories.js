/**
 * AccountCreate Component Stories.
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
import AccountCreate from '.';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
} from '../../../../../../../tests/js/utils';
import {
	ACCOUNT_CREATE,
	EDIT_SCOPE,
	MODULES_ANALYTICS_4,
} from '../../../datastore/constants';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../../../analytics-4/datastore/__fixtures__';
import { Cell, Grid, Row } from '../../../../../material-components';

const { accountSummaries } = fixtures;

function Template( args ) {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--analytics">
				<div className="googlesitekit-setup-module">
					<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
						<Grid>
							<Row>
								<Cell size={ 12 }>
									<AccountCreate { ...args } />
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
Default.storyName = 'AccountCreate';

export default {
	title: 'Modules/Analytics4/Components/AccountCreate',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
						owner: { login: 'analytics_4-owner-username' },
					},
				] );
				provideSiteInfo( registry );
				provideModuleRegistrations( registry );
				provideUserAuthentication( registry, {
					grantedScopes: [ EDIT_SCOPE ],
				} );

				registry
					.dispatch( MODULES_ANALYTICS_4 )
					.receiveGetAccountSummaries( accountSummaries );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {
					accountID: ACCOUNT_CREATE,
					useSnippet: true,
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
