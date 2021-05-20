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
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import { STORE_NAME } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { createTestRegistry, provideModules, provideModuleRegistrations, WithTestRegistry } from '../../../../../../tests/js/utils';
import * as fixtures from '../../datastore/__fixtures__';
import * as ga4Fixtures from '../../../analytics-4/datastore/__fixtures__';
import { enabledFeatures } from '../../../../features';

export const Ready = () => <ModuleSetup moduleSlug="analytics" />;
Ready.storyName = 'SetupFormUA';
Ready.decorators = [
	( Story ) => {
		enabledFeatures.clear();
		enabledFeatures.add( 'ga4setup' );

		const registry = createTestRegistry();
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

		const testAccountID = ga4Fixtures.properties[ 0 ]._accountID;
		const accountID = testAccountID;
		registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( ga4Fixtures.properties, { accountID } );

		const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;
		registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
		registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
		// eslint-disable-next-line sitekit/acronym-case
		registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
		registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
			// eslint-disable-next-line sitekit/acronym-case
			accountID: properties[ 0 ].accountId,
			// eslint-disable-next-line sitekit/acronym-case
			propertyID: profiles[ 0 ].webPropertyId,
		} );

		return (
			<WithTestRegistry registry={ registry }>
				<Story />
			</WithTestRegistry>
		);
	},
];

export default {
	title: 'Modules/Analytics/Setup/SetupFormUA',
};
