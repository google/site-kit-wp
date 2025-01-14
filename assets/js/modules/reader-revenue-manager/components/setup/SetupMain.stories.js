/**
 * Reader Revenue Manager SetupMain component stories.
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
	provideModules,
} from '../../../../../../tests/js/utils';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	READER_REVENUE_MANAGER_MODULE_SLUG,
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '../../datastore/constants';
import ModuleSetup from '../../../../components/setup/ModuleSetup';
import WithRegistrySetup from '../../../../../../tests/js/WithRegistrySetup';
import { publications } from '../../datastore/__fixtures__';
import { Provider as ViewContextProvider } from '../../../../components/Root/ViewContextContext';
import { VIEW_CONTEXT_MAIN_DASHBOARD } from '../../../../googlesitekit/constants';

function Template() {
	return (
		<ViewContextProvider value={ VIEW_CONTEXT_MAIN_DASHBOARD }>
			<ModuleSetup moduleSlug={ READER_REVENUE_MANAGER_MODULE_SLUG } />
		</ViewContextProvider>
	);
}

export const NoPublications = Template.bind( {} );
NoPublications.storyName = 'No publications';
NoPublications.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [] );
	},
};
NoPublications.scenario = {};

export const PublicationCreated = Template.bind( {} );
PublicationCreated.storyName = 'Publication created';
PublicationCreated.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [ publications[ 0 ] ] );

		registry
			.dispatch( CORE_FORMS )
			.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
				[ SHOW_PUBLICATION_CREATE ]: true,
			} );
	},
};
PublicationCreated.scenario = {};

export const OnePublication = Template.bind( {} );
OnePublication.storyName = 'One publication';
OnePublication.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [ publications[ 0 ] ] );
	},
};
OnePublication.scenario = {};

export const MultiplePublications = Template.bind( {} );
MultiplePublications.storyName = 'Multiple publications';
MultiplePublications.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
	},
};
MultiplePublications.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMain',
	decorators: [
		( Story, { args } ) => {
			function setupRegistry( registry ) {
				provideModules( registry, [
					{
						slug: READER_REVENUE_MANAGER_MODULE_SLUG,
						active: true,
						connected: false,
					},
				] );
				provideModuleRegistrations( registry );

				// Populate default settings.
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						snippetMode: 'post_types',
						postTypes: [ 'post' ],
						productID: 'openaccess',
						productIDs: [],
						paymentOption: '',
					} );

				// Call story-specific setup.
				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<Story />
				</WithRegistrySetup>
			);
		},
	],
	parameters: { padding: 0 },
};
