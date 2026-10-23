/**
 * Reader Revenue Manager SetupCTASurvey component stories.
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
import { ElementType } from 'react';

/**
 * WordPress dependencies
 */
import { WPDataRegistry } from '@wordpress/data/build-types/registry';

/**
 * Internal dependencies
 */
import {
	publicationPoliciesStep,
	publicationSetupStep,
	setupCompleteStep,
	termsOfServiceStep,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import { EXPRESS_SETUP_SCOPES } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import { publications } from '@/js/modules/reader-revenue-manager/datastore/__fixtures__';
import {
	EXPRESS_SETUP_CTAS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SetupCTASurvey from './index';
import { surveyCTAStep } from './StepSurveyCTA';
import { surveyQuestionsStep } from './StepSurveyQuestions';

const ORGANIZATION_ID = 'ABCD1234';
const PUBLICATION_ID = 'ABCD_123-4';

/* eslint-disable sitekit/acronym-case -- `Id` and `Url` are the identifiers used by the API. */
const PUBLICATION_WITHOUT_TERMS = {
	...publications[ 2 ],
	organizationId: ORGANIZATION_ID,
	publicationId: PUBLICATION_ID,
} as Publication;

const PUBLICATION_WITHOUT_POLICIES = {
	...publications[ 0 ],
	organizationId: ORGANIZATION_ID,
	publicationId: PUBLICATION_ID,
} as Publication;

const COMPLETE_PUBLICATION = {
	...PUBLICATION_WITHOUT_POLICIES,
	publicationTosUrl: 'https://example.com/terms',
	publicationPrivacyPolicyUrl: 'https://example.com/privacy',
} as Publication;
/* eslint-enable sitekit/acronym-case */

const BASE_QUERY = {
	cta: EXPRESS_SETUP_CTAS.SURVEY,
};

function setupBaseRegistry( registry: WPDataRegistry ) {
	provideModules( registry, [
		{
			slug: MODULE_SLUG_READER_REVENUE_MANAGER,
			active: true,
			connected: true,
		},
	] );
	provideModuleRegistrations( registry );
	provideSiteInfo( registry );
	provideUserInfo( registry );
	provideUserAuthentication( registry, {
		grantedScopes: EXPRESS_SETUP_SCOPES,
	} );
	providePublications( registry, publications );

	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		organizationID: ORGANIZATION_ID,
		publicationID: PUBLICATION_ID,
		snippetMode: 'sitewide',
		postTypes: [],
	} );
}

function connectPublication(
	registry: WPDataRegistry,
	publication: Publication
) {
	providePublications( registry, [ ...publications, publication ] );
}

function Template() {
	return <SetupCTASurvey />;
}

export const ConnectPublication = Template.bind( {} ) as Story;
ConnectPublication.storyName = '1. Connect Publication';
ConnectPublication.parameters = {
	query: {
		...BASE_QUERY,
		step: publicationSetupStep.slug,
	},
};
ConnectPublication.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationID( '' );
	},
};
ConnectPublication.scenario = {};

export const TermsOfService = Template.bind( {} ) as Story;
TermsOfService.storyName = '2. Terms of Service';
TermsOfService.parameters = {
	query: {
		...BASE_QUERY,
		step: termsOfServiceStep.slug,
	},
};
TermsOfService.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		connectPublication( registry, PUBLICATION_WITHOUT_TERMS ),
};
TermsOfService.scenario = {};

export const PublicationPolicies = Template.bind( {} ) as Story;
PublicationPolicies.storyName = '3. Publication Policies';
PublicationPolicies.parameters = {
	query: {
		...BASE_QUERY,
		step: publicationPoliciesStep.slug,
	},
};
PublicationPolicies.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		connectPublication( registry, PUBLICATION_WITHOUT_POLICIES ),
};
PublicationPolicies.scenario = {};

export const SurveyQuestions = Template.bind( {} ) as Story;
SurveyQuestions.storyName = '4. Survey Questions';
SurveyQuestions.parameters = {
	query: {
		...BASE_QUERY,
		step: surveyQuestionsStep.slug,
	},
};
SurveyQuestions.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		connectPublication( registry, COMPLETE_PUBLICATION ),
};
SurveyQuestions.scenario = {};

export const SurveyCTA = Template.bind( {} ) as Story;
SurveyCTA.storyName = '5. Survey CTA';
SurveyCTA.parameters = {
	query: {
		...BASE_QUERY,
		step: surveyCTAStep.slug,
	},
};
SurveyCTA.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		connectPublication( registry, COMPLETE_PUBLICATION ),
};
SurveyCTA.scenario = {};

export const SetupComplete = Template.bind( {} ) as Story;
SetupComplete.storyName = '6. Setup Complete';
SetupComplete.parameters = {
	query: {
		...BASE_QUERY,
		step: setupCompleteStep.slug,
	},
};
SetupComplete.args = {
	setupRegistry: ( registry: WPDataRegistry ) =>
		connectPublication( registry, COMPLETE_PUBLICATION ),
};
SetupComplete.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTASurvey',
	component: SetupCTASurvey,
	decorators: [
		withQuery,
		(
			StoryComponent: ElementType,
			{ args }: { args: Story[ 'args' ] }
		) => {
			function setupRegistry( registry: WPDataRegistry ) {
				setupBaseRegistry( registry );
				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					<StoryComponent />
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		padding: 0,
	},
};
