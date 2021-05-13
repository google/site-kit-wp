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
import SetupForm from './SetupForm';
import { STORE_NAME } from '../../datastore/constants';
import { createTestRegistry, WithTestRegistry, provideModules } from '../../../../../../tests/js/utils';
import * as fixtures from '../../datastore/__fixtures__';

export const SetupFormUA = () => (
	<div className="googlesitekit-setup">
		<div className="mdc-layout-grid">
			<div className="mdc-layout-grid__inner">
				<div className="
					mdc-layout-grid__cell
					mdc-layout-grid__cell--span-12
				">
					<section className="googlesitekit-setup__wrapper">
						<div className="mdc-layout-grid">
							<div className="mdc-layout-grid__inner">
								<div className="
									mdc-layout-grid__cell
									mdc-layout-grid__cell--span-12
								">
									<SetupForm />
								</div>
							</div>
						</div>
					</section>
				</div>
			</div>
		</div>
	</div>
);
SetupFormUA.storyName = 'SetupFormUA';
SetupFormUA.decorators = [
	( Story ) => {
		const registry = createTestRegistry();

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
		registry.dispatch( STORE_NAME ).receiveGetExistingTag( null );
		return (
			<WithTestRegistry registry={ registry } features={ [ 'ga4setup' ] }>
				<Story />
			</WithTestRegistry>
		);
	},
];

export default {
	title: 'Modules/Analytics/Setup/SetupFormUA',
	decorators: [
		( Story ) => {
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

			return (
				<Story />
			);
		},
	],
};
