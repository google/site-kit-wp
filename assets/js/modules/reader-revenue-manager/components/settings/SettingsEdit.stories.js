/**
 * Reader Revenue Manager SettingsEdit component stories.
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
import {
	provideModuleRegistrations,
	provideSiteInfo,
	WithTestRegistry,
} from '../../../../../../tests/js/utils';
import { Grid, Row, Cell } from '../../../../material-components';
import SettingsEdit from './SettingsEdit';
import { publications } from '../../datastore/__fixtures__';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { CORE_USER } from '../../../../googlesitekit/datastore/user/constants';

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--reader-revenue-manager">
				<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<div className="googlesitekit-setup-module">
									<SettingsEdit />
								</div>
							</Cell>
						</Row>
					</Grid>
				</div>
			</div>
		</div>
	);
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};
Default.args = {
	setupRegistry: ( registry ) => {
		publications[ 0 ].products.push( {
			name: 'product-b',
		} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-b' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductIDs( [ 'product-a', 'product-b', 'product-c' ] );
	},
};

export const PendingVerification = Template.bind( {} );
PendingVerification.storyName = 'PendingVerification';
PendingVerification.scenario = {};
PendingVerification.args = {
	setupRegistry: ( registry ) => {
		publications[ 1 ].products.push( {
			name: 'product-a',
		} );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.selectPublication( publications[ 1 ] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-a' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductIDs( [ 'product-a', 'product-b', 'product-c' ] );
	},
};

export const ActionRequired = Template.bind( {} );
ActionRequired.storyName = 'ActionRequired';
ActionRequired.scenario = {};
ActionRequired.args = {
	setupRegistry: ( registry ) => {
		publications[ 2 ].products.push( {
			name: 'product-a',
		} );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.selectPublication( publications[ 2 ] );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-a' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductIDs( [ 'product-a', 'product-b', 'product-c' ] );
	},
};

export const WithoutModuleAccess = Template.bind( {} );
WithoutModuleAccess.storyName = 'WithoutModuleAccess';
WithoutModuleAccess.scenario = {};
WithoutModuleAccess.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setOwnerID( 2 );

		registry
			.dispatch( CORE_MODULES )
			.receiveCheckModuleAccess(
				{ access: false },
				{ slug: READER_REVENUE_MANAGER_MODULE_SLUG }
			);

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-a' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductIDs( [ 'product-a', 'product-b', 'product-c' ] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.selectPublication( publications[ 2 ] );
	},
};

export const PublicationUnavailable = Template.bind( {} );
PublicationUnavailable.storyName = 'PublicationUnavailable';
PublicationUnavailable.scenario = {};
PublicationUnavailable.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-1' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [ publications[ 0 ], publications[ 1 ] ] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publications[ 2 ].publicationId );
	},
};

export const WithProductIDWarningNotice = Template.bind( {} );
WithProductIDWarningNotice.storyName = 'WithProductIDWarningNotice';
WithProductIDWarningNotice.scenario = {};
WithProductIDWarningNotice.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'openaccess' );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPaymentOption( 'subscriptions' );
	},
};

export const MissingProductID = Template.bind( {} );
MissingProductID.storyName = 'MissingProductID';
MissingProductID.scenario = {};
MissingProductID.args = {
	setupRegistry: ( registry ) => {
		publications[ 0 ].products.push( {
			name: 'product-c',
		} );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductID( 'product-c' );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setProductIDs( [ 'product-a', 'product-b' ] );
	},
};

export default {
	title: 'Modules/ReaderRevenueManager/Settings/SettingsEdit',
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry, {
					postTypes: [
						{ slug: 'post', label: 'Posts' },
						{ slug: 'page', label: 'Pages' },
						{ slug: 'products', label: 'Products' },
					],
				} );

				const extraData = [
					{
						slug: READER_REVENUE_MANAGER_MODULE_SLUG,
						active: true,
						connected: true,
					},
				];

				provideModuleRegistrations( registry, extraData );

				const settings = {
					ownerID: 1,
					// eslint-disable-next-line sitekit/acronym-case
					publicationID: publications[ 0 ].publicationId,
					publicationOnboardingState:
						publications[ 0 ].onboardingState,
					postTypes: [ 'post' ],
					productID: 'product-1',
					productIDs: [ 'product-1', 'product-2' ],
					snippetMode: 'post_types',
				};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				registry.dispatch( CORE_USER ).receiveGetDismissedItems( [] );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithTestRegistry
					callback={ setupRegistry }
					features={ [ 'rrmModuleV2' ] }
				>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
