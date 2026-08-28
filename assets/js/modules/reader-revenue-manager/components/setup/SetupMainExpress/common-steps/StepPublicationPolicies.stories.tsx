/**
 * Reader Revenue Manager express setup publication policies step stories.
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
import type { ElementType, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { Registry } from '@/js/googlesitekit-data';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_POLICIES_FORM,
	READER_REVENUE_MANAGER_SETUP_FORM,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { providePublication } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { Story } from '@/js/types/Story';
import { provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepPublicationPolicies from './StepPublicationPolicies';

type Decorator = {
	( StoryComponent: ElementType, { args, parameters }: Story ): ReactNode;
};

function Template() {
	return <StepPublicationPolicies onComplete={ () => {} } />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.args = {};
Default.scenario = {};

export const WithError = Template.bind( {} ) as Story;
WithError.storyName = 'With Error';
WithError.args = {
	setupRegistry: ( registry ) => {
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
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.startResolution( 'getPublication', [] );
	},
};
Loading.scenario = {};

export const WithExistingValues = Template.bind( {} ) as Story;
WithExistingValues.storyName = 'With Existing Values';
WithExistingValues.args = {
	setupRegistry( registry ) {
		providePublication( registry, publications[ 3 ] );
	},
};
WithExistingValues.scenario = {};

export const WithInvalidValues = Template.bind( {} ) as Story;
WithInvalidValues.storyName = 'With Invalid Values';
WithInvalidValues.args = {
	setupRegistry: ( registry ) => {
		registry
			.dispatch( CORE_FORMS )
			.setValues( READER_REVENUE_MANAGER_SETUP_FORM, {
				[ PUBLICATION_POLICIES_FORM.TERMS_OF_SERVICE_URL ]: 'Invalid',
				[ PUBLICATION_POLICIES_FORM.PRIVACY_POLICY_URL ]: 'Invalid',
			} );
	},
};
WithInvalidValues.scenario = {};

export const WithPrivacyPolicyPage = Template.bind( {} ) as Story;
WithPrivacyPolicyPage.storyName = 'With Privacy Policy Page';
WithPrivacyPolicyPage.args = {
	setupRegistry: ( registry ) => {
		provideSiteInfo( registry, {
			wpPrivacyURL: 'https://example.com/wp-privacy-policy',
		} );
	},
};
WithPrivacyPolicyPage.parameters = {
	query: {
		cta: undefined,
	},
};
WithPrivacyPolicyPage.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/CommonSteps/StepPublicationPolicies',
	component: StepPublicationPolicies,
	decorators: [
		( ( RenderStory, { args } ) => {
			return (
				<WithRegistrySetup
					func={ ( registry: Registry ) => {
						args?.setupRegistry?.( registry );
					} }
				>
					<RenderStory />
				</WithRegistrySetup>
			);
		} ) as Decorator,
	],
};
