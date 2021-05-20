/**
 * Analytics Setup stories.
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
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * Internal dependencies
 */
import ModuleSetup from '../assets/js/components/setup/ModuleSetup';
import * as fixtures from '../assets/js/modules/analytics/datastore/__fixtures__';
import { STORE_NAME } from '../assets/js/modules/analytics/datastore/constants';
import {
	WithTestRegistry,
	createTestRegistry,
	provideModules,
	provideModuleRegistrations,
} from '../tests/js/utils';
import { enabledFeatures } from '../assets/js/features';

function Setup( props ) {
	enabledFeatures.clear();
	enabledFeatures.add( 'ga4setup' );

	return (
		<WithTestRegistry { ...props }>
			<h1>!!!live reload!!!</h1>
			<ModuleSetup moduleSlug="analytics" />
		</WithTestRegistry>
	);
}

const withRegistry = ( Story ) => {
	global._googlesitekitLegacyData.setup.moduleToSetup = 'analytics';
	const registry = createTestRegistry();
	provideModules( registry, [ {
		slug: 'analytics',
		active: true,
		connected: true,
	} ] );
	provideModuleRegistrations( registry );

	return (
		<Story registry={ registry } />
	);
};

storiesOf( 'Analytics Module/Setup - UA and GA4', module )
	.add( 'Start', ( args, { registry } ) => {
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

		// return <p>w000t</p>;

		return <Setup registry={ registry } />;
	}, {
		decorators: [
			withRegistry,
		],
	} )
;
