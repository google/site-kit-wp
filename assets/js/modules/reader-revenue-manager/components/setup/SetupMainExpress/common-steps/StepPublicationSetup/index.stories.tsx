/**
 * Reader Revenue Manager StepPublicationSetup component stories.
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { ElementType, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	READER_REVENUE_MANAGER_SETUP_FORM,
	SHOW_PUBLICATION_CREATE,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepPublicationSetup from '.';

type Decorator = {
	( StoryComponent: ElementType, { args, parameters }: Story ): ReactNode;
};

function Template() {
	return <StepPublicationSetup onComplete={ () => {} } />;
}

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.startResolution( 'getPublications', [] );
	},
};
Loading.scenario = {};

export const Error = Template.bind( {} ) as Story;
Error.storyName = 'Error';
Error.args = {
	setupRegistry: ( registry ) => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setErrorForSelector(
			{
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			'getPublications',
			[]
		);

		providePublications( registry, [] );
	},
};
Error.scenario = {};

export const WithPublications = Template.bind( {} ) as Story;
WithPublications.storyName = 'With Publications';
WithPublications.args = {
	setupRegistry: ( registry ) => {
		providePublications( registry, publications );
	},
};
WithPublications.scenario = {};

export const WithPublicationsWithError = Template.bind( {} ) as Story;
WithPublicationsWithError.storyName = 'With Publications with Error';
WithPublicationsWithError.args = {
	setupRegistry: ( registry ) => {
		providePublications( registry, publications );

		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setErrorForAction(
			{
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			'submitChanges',
			[]
		);
	},
};
WithPublicationsWithError.scenario = {};

export const CreatePublication = Template.bind( {} ) as Story;
CreatePublication.storyName = 'Create Publication';
CreatePublication.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [] );
	},
};
CreatePublication.scenario = {};

export const CreatePublicationWithError = Template.bind( {} ) as Story;
CreatePublicationWithError.storyName = 'Create Publication with Error';
CreatePublicationWithError.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [] );

		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setErrorForAction(
			{
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			'createPublication',
			[]
		);
	},
};
CreatePublicationWithError.scenario = {};

export const CreatePublicationWithPublications = Template.bind( {} ) as Story;
CreatePublicationWithPublications.storyName =
	'Create Publication with Publications';
CreatePublicationWithPublications.args = {
	setupRegistry: ( registry ) => {
		providePublications( registry, publications );

		registry
			.dispatch( CORE_FORMS )
			.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
				[ SHOW_PUBLICATION_CREATE ]: true,
			} );
	},
};
CreatePublicationWithPublications.scenario = {};

export const CreatePublicationWithSiteInfo = Template.bind( {} ) as Story;
CreatePublicationWithSiteInfo.storyName = 'Create Publication with Site Info';
CreatePublicationWithSiteInfo.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, { siteLocale: 'en-US' } );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( [] );
	},
};
CreatePublicationWithSiteInfo.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/StepPublicationSetup',
	component: StepPublicationSetup,
	decorators: [
		( ( StoryComponent, { args } ) => {
			function setupRegistry( registry: Registry ) {
				const moduleData = [
					{
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: true,
						connected: false,
					},
				];

				provideModules( registry, moduleData );
				provideModuleRegistrations( registry, moduleData );

				// Seed the settings required to enable the submit button.
				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( {
						postTypes: [ 'post' ],
						snippetMode: 'post_types',
					} );

				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		} ) as Decorator,
	],
};
