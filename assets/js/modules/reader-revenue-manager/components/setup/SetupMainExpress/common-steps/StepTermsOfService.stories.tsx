/**
 * Reader Revenue Manager express setup terms of service step stories.
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
import {
	publications,
	termsOfService,
} from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepTermsOfService from './StepTermsOfService';

/* eslint-disable sitekit/acronym-case -- Publication API fixtures use normalized API field names. */

type Decorator = {
	( StoryComponent: ElementType, { args }: Story ): ReactNode;
};

const tosURL = 'https://example.com/terms';

const TEST_PUBLICATION: Publication = {
	...publications[ 2 ],
	rrmProduct: {
		...publications[ 2 ].rrmProduct,
		productTosUrl: tosURL,
	},
};

function Template() {
	return <StepTermsOfService onComplete={ () => {} } />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.args = {};
Default.scenario = {};

export const WithError = Template.bind( {} ) as Story;
WithError.storyName = 'With Error';
WithError.args = {
	setupRegistry: ( registry ) => {
		providePublication( registry, TEST_PUBLICATION );

		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).setErrorForAction(
			{
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			'updatePublication',
			[]
		);
	},
};
WithError.scenario = {};

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.args = {
	setupRegistry: ( registry ) => {
		providePublication( registry, TEST_PUBLICATION );

		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.startResolution( 'getTermsOfService', [ { tosURL } ] );
	},
};
Loading.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/CommonSteps/StepTermsOfService',
	component: StepTermsOfService,
	decorators: [
		( ( RenderStory, { args } ) => {
			return (
				<WithRegistrySetup
					func={ ( registry: Registry ) => {
						providePublication( registry, TEST_PUBLICATION );
						provideSiteInfo( registry );

						registry
							.dispatch( MODULES_READER_REVENUE_MANAGER )
							.receiveGetTermsOfService( termsOfService, {
								tosURL,
							} );

						registry
							.dispatch( MODULES_READER_REVENUE_MANAGER )
							.finishResolution( 'getTermsOfService', [
								{ tosURL },
							] );

						args?.setupRegistry?.( registry );
					} }
				>
					<RenderStory />
				</WithRegistrySetup>
			);
		} ) as Decorator,
	],
};
