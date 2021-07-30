/**
 * Analytics SettingsView component stories.
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
import SettingsView from './SettingsView';
import { STORE_NAME } from '../../datastore/constants';
import { MODULES_ANALYTICS_4 } from '../../../analytics-4/datastore/constants';
import { provideModules, provideModuleRegistrations, provideSiteInfo } from '../../../../../../tests/js/utils';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import * as fixtures from '../../datastore/__fixtures__';
import * as ga4Fixtures from '../../../analytics-4/datastore/__fixtures__';

const features = [ 'ga4setup' ];

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--analytics">
				<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
					<div className="mdc-layout-grid">
						<div className="mdc-layout-inner">
							<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-12">
								<SettingsView />
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export const WithGA4MeasurementID = Template.bind( null );
WithGA4MeasurementID.storyName = 'Settings with GA4 Measurement ID';
WithGA4MeasurementID.parameters = { features };

export default {
	title: 'Modules/Analytics/Settings/SettingsView',
	decorators: [
		( Story ) => {
			const setupRegistry = ( registry ) => {
				const accounts = fixtures.accountsPropertiesProfiles.accounts.slice( 0, 1 );
				const properties = [
					{
						...fixtures.accountsPropertiesProfiles.properties[ 0 ],
						websiteUrl: 'http://example.com', // eslint-disable-line sitekit/acronym-case
					},
					{
						...fixtures.accountsPropertiesProfiles.properties[ 1 ],
					},
				];

				const accountID = accounts[ 0 ].id;

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
				provideSiteInfo( registry );
				provideModuleRegistrations( registry );

				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetSettings( {} );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetExistingTag( null );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetProperties( ga4Fixtures.properties, { accountID } );
				registry.dispatch( MODULES_ANALYTICS_4 ).receiveGetWebDataStreams( ga4Fixtures.webDataStreams, { propertyID: ga4Fixtures.properties[ 0 ]._id } );

				registry.dispatch( STORE_NAME ).receiveGetSettings( {
					useSnippet: true,
					canUseSnippet: true,
				} );
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
				registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
				registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID } );
				registry.dispatch( STORE_NAME ).receiveGetProfiles( fixtures.accountsPropertiesProfiles.profiles, { accountID, propertyID: properties[ 0 ].id } );
				registry.dispatch( STORE_NAME ).receiveGetProfiles( fixtures.accountsPropertiesProfiles.profiles, { accountID, propertyID: properties[ 1 ].id } );

				registry.dispatch( STORE_NAME ).selectAccount( accountID );
			};

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
};
