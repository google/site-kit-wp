/**
 * Analytics module utility functions.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import * as fixtures from '../../assets/js/modules/analytics/datastore/__fixtures__';
import { STORE_NAME } from '../../assets/js/modules/analytics/datastore/constants';
import { STORE_NAME as CORE_SITE, AMP_MODE_SECONDARY } from '../../assets/js/googlesitekit/datastore/site/constants';
import { STORE_NAME as CORE_MODULES } from '../../assets/js/googlesitekit/modules/datastore/constants';
import { createBuildAndReceivers } from '../../assets/js/modules/tagmanager/datastore/__factories__/utils';

/**
 * Generates a story for a case when a GTM with Analytics property ID is already connected.
 *
 * @since n.e.x.t
 *
 * @param {Object}      args                Story arguments.
 * @param {WPComponent} args.Component      Story component.
 * @param {boolean}     args.permission     Whether the current user has tag permissions.
 * @param {boolean}     args.useExistingTag Whether to use an existing tag or not.
 * @return {Function} Story callback function.
 */
export function generateGtmPropertyStory( { Component, permission, useExistingTag = false } ) {
	return () => {
		const setupRegistry = ( registry ) => {
			const data = {
				accountID: '152925174',
				webPropertyID: 'UA-152925174-1',
				ampPropertyID: 'UA-152925174-1',
			};

			const { accounts, properties, profiles } = fixtures.accountsPropertiesProfiles;

			registry.dispatch( CORE_MODULES ).receiveGetModules( [
				{
					slug: 'tagmanager',
					name: 'Tag Manager',
					description: 'Tag Manager creates an easy to manage way to create tags on your site without updating code.',
					homepage: 'https://tagmanager.google.com/',
					internal: false,
					active: true,
					connected: true,
					dependencies: [ 'analytics' ],
					dependants: [],
					order: 10,
				},
			] );

			registry.dispatch( CORE_SITE ).receiveSiteInfo( {
				homeURL: 'https://example.com/',
				ampMode: AMP_MODE_SECONDARY,
			} );

			registry.dispatch( STORE_NAME ).receiveGetSettings( {} );
			registry.dispatch( STORE_NAME ).receiveGetAccounts( accounts );
			registry.dispatch( STORE_NAME ).receiveGetProperties( properties, { accountID: properties[ 0 ].accountId } );
			registry.dispatch( STORE_NAME ).receiveGetProfiles( profiles, {
				accountID: properties[ 0 ].accountId,
				propertyID: profiles[ 0 ].webPropertyId,
			} );

			if ( useExistingTag ) {
				registry.dispatch( STORE_NAME ).receiveGetExistingTag( data.webPropertyID );
			}

			registry.dispatch( STORE_NAME ).receiveGetTagPermission( {
				accountID: data.accountID,
				permission,
			}, { propertyID: data.webPropertyID } );

			const { buildAndReceiveWebAndAMP } = createBuildAndReceivers( registry );
			buildAndReceiveWebAndAMP( data );
		};

		return <Component callback={ setupRegistry } />;
	};
}
