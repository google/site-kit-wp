/**
 * ModuleOverviewWidget - StatusMigration component stories.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import StatusMigration from './StatusMigration';
import {
	provideModules,
	provideSiteInfo,
} from '../../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../../tests/js/WithRegistrySetup';
import { MODULES_ADSENSE } from '../../../datastore/constants';
import * as fixtures from '../../../datastore/__fixtures__';

function Template() {
	return <StatusMigration />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';

export default {
	title: 'Modules/AdSense/Components/StatusMigration',
	component: StatusMigration,
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				provideModules( registry, [
					{
						active: true,
						connected: true,
						slug: 'adsense',
					},
				] );
				provideSiteInfo( registry );

				const accountID = fixtures.clients[ 0 ]._accountID;
				registry.dispatch( MODULES_ADSENSE ).setSettings( {
					accountID,
				} );
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetSites( fixtures.sites, { accountID } );
				registry
					.dispatch( MODULES_ADSENSE )
					.receiveGetClients( fixtures.clients, { accountID } );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
