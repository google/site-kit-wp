/**
 * WebContainerSelect component stories.
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
import * as fixtures from '../../datastore/__fixtures__';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import WebContainerSelect from './WebContainerSelect';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';

function Template( args ) {
	return (
		<div className="googlesitekit-setup">
			<section className="googlesitekit-setup__wrapper">
				<div className="googlesitekit-setup-module">
					<div className="googlesitekit-setup-module__inputs">
						<WebContainerSelect { ...args } hasModuleAccess />
					</div>
				</div>
			</section>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.args = {};

export default {
	title: 'Modules/TagManager/Components/WebContainerSelect',
	component: WebContainerSelect,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				// eslint-disable-next-line sitekit/acronym-case
				const accountID = fixtures.accounts[ 0 ].accountId;
				registry
					.dispatch( MODULES_TAGMANAGER )
					.setAccountID( accountID );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetAccounts( fixtures.accounts );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetContainers( fixtures.getContainers.all, {
						accountID,
					} );
				registry
					.dispatch( MODULES_TAGMANAGER )
					.receiveGetExistingTag( null );
				registry.dispatch( CORE_SITE ).receiveSiteInfo( {} );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
