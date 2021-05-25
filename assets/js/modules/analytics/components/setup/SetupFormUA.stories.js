/**
 * SetupFormUA component stories.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { STORE_NAME } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { provideModules, provideModuleRegistrations } from '../../../../../../tests/js/utils';
import { enabledFeatures } from '../../../../features';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';

export const Ready = () => <ModuleSetup moduleSlug="analytics" />;
Ready.storyName = 'SetupFormUA';
Ready.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
			/* eslint-disable sitekit/acronym-case */
			const accountID = properties[ 0 ].accountId;
			const propertyID = profiles[ 0 ].webPropertyId;

			registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
			registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			registry.dispatch( STORE_NAME ).finishResolution( 'getAccounts', [] );

			// eslint-disable-next-line sitekit/acronym-case
			registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID } );
			registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, { accountID, propertyID } );

			registry.dispatch( STORE_NAME ).receiveGetSettings( { accountID } );
			registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( [], { accountID } );
		};

		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Modules/Analytics/Setup/SetupFormUA',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				enabledFeatures.clear();
				enabledFeatures.add( 'ga4setup' );

				provideModules( registry, [
					{
						slug: 'analytics',
						active: true,
						connected: true,
					},
					{
						slug: 'analytics-4',
						active: true,
						connected: true,
					},
				] );

				provideModuleRegistrations( registry );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
