/**
 * Reader Revenue Manager SettingsView component stories.
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
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_MODULE_SLUG,
} from '../../datastore/constants';
import { publications } from '../../datastore/__fixtures__';
import SettingsView from './SettingsView';

function Template() {
	return (
		<div className="googlesitekit-layout">
			<div className="googlesitekit-settings-module googlesitekit-settings-module--active googlesitekit-settings-module--reader-revenue-manager">
				<div className="googlesitekit-settings-module__content googlesitekit-settings-module__content--open">
					<Grid>
						<Row>
							<Cell size={ 12 }>
								<SettingsView />
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

export const WithPendingVerificationNotice = Template.bind( {} );
WithPendingVerificationNotice.storyName = 'WithPendingVerificationNotice';
WithPendingVerificationNotice.args = {
	setupRegistry: ( registry ) => {
		const publication = publications[ 1 ];
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publication.publicationId );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationOnboardingState( publication.onboardingState );
	},
};
WithPendingVerificationNotice.scenario = {};

export const WithActionRequiredNotice = Template.bind( {} );
WithActionRequiredNotice.storyName = 'WithActionRequiredNotice';
WithActionRequiredNotice.args = {
	setupRegistry: ( registry ) => {
		const publication = publications[ 2 ];
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			// eslint-disable-next-line sitekit/acronym-case
			.setPublicationID( publication.publicationId );
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationOnboardingState( publication.onboardingState );
	},
};
WithActionRequiredNotice.scenario = {};

export const WithoutModuleAccess = Template.bind( {} );
WithoutModuleAccess.storyName = 'WithoutModuleAccess';
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
			.selectPublication( publications[ 2 ] );
	},
};
WithoutModuleAccess.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Settings/SettingsView',
	component: SettingsView,
	decorators: [
		( Story, { args } ) => {
			const setupRegistry = ( registry ) => {
				provideSiteInfo( registry, {
					postTypes: [
						{ slug: 'post', label: 'Posts' },
						{ slug: 'page', label: 'Pages' },
					],
				} );

				provideModuleRegistrations( registry, [
					{
						slug: 'reader-revenue-manager',
						active: true,
						connected: true,
					},
				] );

				const settings = {
					ownerID: 1,
					publicationID: 'ABCDEFGH',
					publicationOnboardingState: '',
					productID: 'openaccess',
					snippetMode: 'post_types',
					postTypes: [ 'post' ],
				};

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetPublications( publications );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( settings );

				if ( args?.setupRegistry ) {
					args.setupRegistry( registry );
				}
			};

			return (
				<WithTestRegistry callback={ setupRegistry }>
					<Story />
				</WithTestRegistry>
			);
		},
	],
};
