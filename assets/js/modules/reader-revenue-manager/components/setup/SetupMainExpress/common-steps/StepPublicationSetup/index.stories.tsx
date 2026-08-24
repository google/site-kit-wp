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
import { withQuery } from '@storybook/addon-queryparams';
import { ElementType, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	providePublications,
	provideSiteInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepPublicationSetup from '.';

type Decorator = {
	( StoryComponent: ElementType, { args, parameters }: Story ): ReactNode;
};

function Template() {
	return <StepPublicationSetup />;
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
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setErrorForSelector( {}, 'getPublications', [] );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.finishResolution( 'getPublications', [] );
	},
};
Error.scenario = {};

export const WithPublications = Template.bind( {} ) as Story;
WithPublications.storyName = 'With Publications';
WithPublications.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
	},
};
WithPublications.parameters = {
	query: {
		cta: undefined,
	},
};
WithPublications.scenario = {};

export const WithPublicationsWithError = Template.bind( {} ) as Story;
WithPublicationsWithError.storyName = 'With Publications with Error';
WithPublicationsWithError.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setErrorForAction( {}, 'submitChanges', [] );
	},
};
WithPublicationsWithError.parameters = {
	query: {
		cta: undefined,
	},
};
WithPublicationsWithError.scenario = {};

export const WithPublicationsForNewsletterCTA = Template.bind( {} ) as Story;
WithPublicationsForNewsletterCTA.storyName =
	'With Publications for Newsletter CTA';
WithPublicationsForNewsletterCTA.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetPublications( publications );
	},
};
WithPublicationsForNewsletterCTA.parameters = {
	query: {
		cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
	},
};
WithPublicationsForNewsletterCTA.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/StepPublicationSetup',
	component: StepPublicationSetup,
	decorators: [
		withQuery,
		( ( StoryComponent, { args } ) => {
			function setupRegistry( registry: WPDataRegistry ) {
				const moduleData = [
					{
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: true,
						connected: false,
					},
				];

				provideSiteInfo( registry );
				provideModules( registry, moduleData );
				provideModuleRegistrations( registry, moduleData );
				providePublications( registry, publications );

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
