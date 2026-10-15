/**
 * Reader Revenue Manager SetupCTANewsletterSignup component stories.
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
import fetchMock from 'fetch-mock';
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
import { CTA_TYPES } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { Publication } from '@/js/modules/reader-revenue-manager/datastore/publications';
import { providePublications } from '@/js/modules/reader-revenue-manager/utils/test-utils';
import { Story } from '@/js/types/Story';
import {
	freezeFetch,
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
	provideUserAuthentication,
	provideUserInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import SetupCTANewsletterSignup from './index';
import { signupFormStep } from './StepSignupForm';

const ORGANIZATION_ID = 'ABCD1234';
const PUBLICATION_ID = 'ABCD_123-4';

const PRE_EXISTING_CTA = {
	name: `organizations/${ ORGANIZATION_ID }/publications/${ PUBLICATION_ID }/ctas/1`,
	type: CTA_TYPES.NEWSLETTER_SIGNUP,
};

const NEWSLETTER_CTA = {
	name: `organizations/${ ORGANIZATION_ID }/publications/${ PUBLICATION_ID }/ctas/5`,
	type: CTA_TYPES.NEWSLETTER_SIGNUP,
};

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

const PUBLICATION_ENDPOINT = new RegExp(
	'^/google-site-kit/v1/modules/reader-revenue-manager/data/publication'
);

const BASE_QUERY = {
	cta: EXPRESS_SETUP_CTAS.NEWSLETTER_SIGNUP,
};

function setupBaseRegistry(
	registry: WPDataRegistry,
	connectedPublication?: Publication
) {
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
	providePublications(
		registry,
		connectedPublication
			? [ ...publications, connectedPublication ]
			: publications
	);

	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		organizationID: connectedPublication ? ORGANIZATION_ID : '',
		publicationID: connectedPublication ? PUBLICATION_ID : '',
		snippetMode: 'sitewide',
		postTypes: [],
	} );

	registry
		.dispatch( MODULES_READER_REVENUE_MANAGER )
		.receiveGetCTAs( { ctas: [ NEWSLETTER_CTA ], params: {} } );
}

function Template() {
	return <SetupCTANewsletterSignup />;
}

export const ConnectPublication = Template.bind( {} ) as Story;
ConnectPublication.storyName = '1. Connect Publication';
ConnectPublication.parameters = {
	query: {
		...BASE_QUERY,
		step: publicationSetupStep.slug,
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
	connectedPublication: PUBLICATION_WITHOUT_TERMS,
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
	connectedPublication: PUBLICATION_WITHOUT_POLICIES,
};
PublicationPolicies.scenario = {};

export const SetupCTA = Template.bind( {} ) as Story;
SetupCTA.storyName = '4. Set Up Sign-up Form';
SetupCTA.parameters = {
	query: {
		...BASE_QUERY,
		step: signupFormStep.slug,
	},
};
SetupCTA.args = {
	connectedPublication: COMPLETE_PUBLICATION,
};
SetupCTA.scenario = {};

export const SetupComplete = Template.bind( {} ) as Story;
SetupComplete.storyName = '5. Setup Complete';
SetupComplete.parameters = {
	query: {
		...BASE_QUERY,
		step: setupCompleteStep.slug,
	},
};
SetupComplete.args = {
	connectedPublication: COMPLETE_PUBLICATION,
};
SetupComplete.scenario = {};

export const SetupCompleteWithPreExistingCTAs = Template.bind( {} ) as Story;
SetupCompleteWithPreExistingCTAs.storyName =
	'6. Setup Complete - With Pre-existing CTAs';
SetupCompleteWithPreExistingCTAs.parameters = {
	query: {
		...BASE_QUERY,
		step: setupCompleteStep.slug,
	},
};
SetupCompleteWithPreExistingCTAs.args = {
	connectedPublication: COMPLETE_PUBLICATION,
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetCTAs( {
			ctas: [ PRE_EXISTING_CTA, NEWSLETTER_CTA ],
			params: {},
		} );
	},
};
SetupCompleteWithPreExistingCTAs.scenario = {};

export const Loading = Template.bind( {} ) as Story;
Loading.storyName = 'Loading';
Loading.parameters = {
	query: BASE_QUERY,
};
Loading.args = {
	pauseAnimation: true,
	setupRegistry: ( registry: WPDataRegistry ) => {
		// Not in the publications list, so the flow waits for it to load.
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationID( PUBLICATION_ID );

		freezeFetch( PUBLICATION_ENDPOINT );
	},
};
Loading.scenario = {};

export const InitialStepError = Template.bind( {} ) as Story;
InitialStepError.storyName = 'Initial Step Error';
InitialStepError.parameters = {
	query: BASE_QUERY,
};
InitialStepError.args = {
	setupRegistry: ( registry: WPDataRegistry ) => {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.setPublicationID( PUBLICATION_ID );

		fetchMock.get( PUBLICATION_ENDPOINT, {
			body: {
				code: 'internal_server_error',
				message: 'Internal server error',
				data: { status: 500 },
			},
			status: 500,
		} );
	},
};
InitialStepError.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTANewsletterSignup',
	component: SetupCTANewsletterSignup,
	decorators: [
		withQuery,
		(
			StoryComponent: ElementType,
			{ args }: { args: Story[ 'args' ] }
		) => {
			function setupRegistry( registry: WPDataRegistry ) {
				setupBaseRegistry(
					registry,
					args?.connectedPublication as Publication | undefined
				);
				args?.setupRegistry?.( registry );
			}

			return (
				<WithRegistrySetup func={ setupRegistry }>
					{ args?.pauseAnimation ? (
						<div className="googlesitekit-vrt-animation-paused">
							<StoryComponent />
						</div>
					) : (
						<StoryComponent />
					) }
				</WithRegistrySetup>
			);
		},
	],
	parameters: {
		padding: 0,
	},
};
