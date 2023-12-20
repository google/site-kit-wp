/**
 * ViewOnlyMenu Component Stories.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import fetchMock from 'fetch-mock';

/**
 * Internal dependencies
 */
import {
	createTestRegistry,
	WithTestRegistry,
	provideModules,
	provideModuleRegistrations,
	provideSiteConnection,
	provideUserCapabilities,
} from '../../../../tests/js/utils';
import WithRegistrySetup from '../../../../tests/js/WithRegistrySetup';
import {
	PERMISSION_AUTHENTICATE,
	PERMISSION_READ_SHARED_MODULE_DATA,
	CORE_USER,
} from '../../googlesitekit/datastore/user/constants';
import { getMetaCapabilityPropertyName } from '../../googlesitekit/datastore/util/permissions';
import { Cell, Grid, Row } from '../../material-components';
import ViewOnlyMenu from './';

function Template() {
	return (
		<header className="googlesitekit-header">
			<Grid>
				<Row>
					<Cell size={ 12 }>
						<div
							style={ {
								display: 'flex',
								justifyContent: 'flex-end',
							} }
						>
							<ViewOnlyMenu />
						</div>
					</Cell>
				</Row>
			</Grid>
		</header>
	);
}

const commonModuleCapabilities = {
	[ getMetaCapabilityPropertyName(
		PERMISSION_READ_SHARED_MODULE_DATA,
		'search-console'
	) ]: true,
	[ getMetaCapabilityPropertyName(
		PERMISSION_READ_SHARED_MODULE_DATA,
		'pagespeed-insights'
	) ]: true,
	[ getMetaCapabilityPropertyName(
		PERMISSION_READ_SHARED_MODULE_DATA,
		'analytics'
	) ]: true,
};

export const CanAuthenticate = Template.bind( {} );
CanAuthenticate.storyName = 'Can Authenticate';
CanAuthenticate.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideUserCapabilities( registry, {
				[ PERMISSION_AUTHENTICATE ]: true,
				...commonModuleCapabilities,
			} );
		};
		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export const CannotAuthenticate = Template.bind( {} );
CannotAuthenticate.storyName = 'Cannot Authenticate';
CannotAuthenticate.decorators = [
	( Story ) => {
		const setupRegistry = ( registry ) => {
			provideUserCapabilities( registry, {
				[ PERMISSION_AUTHENTICATE ]: false,
				...commonModuleCapabilities,
			} );
		};
		return (
			<WithRegistrySetup func={ setupRegistry }>
				<Story />
			</WithRegistrySetup>
		);
	},
];

export default {
	title: 'Components/ViewOnlyMenu',
	component: ViewOnlyMenu,
	decorators: [
		( Story ) => {
			const registry = createTestRegistry();
			provideSiteConnection( registry );
			provideModules( registry, [
				{
					slug: 'search-console',
					owner: {
						id: '1',
						login: 'Admin 1',
					},
				},
				{
					slug: 'pagespeed-insights',
					owner: {
						id: '2',
						login: 'Admin 2',
					},
				},
			] );
			provideModuleRegistrations( registry );
			registry
				.dispatch( CORE_USER )
				.receiveGetTracking( { enabled: false } );

			// Mock the tracking endpoint to allow checking/unchecking the tracking checkbox.
			fetchMock.post(
				RegExp( 'google-site-kit/v1/core/user/data/tracking' ),
				( url, { body } ) => {
					const { data } = JSON.parse( body );

					return { body: data };
				}
			);

			return (
				<WithTestRegistry registry={ registry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
	parameters: { padding: 0 },
};
