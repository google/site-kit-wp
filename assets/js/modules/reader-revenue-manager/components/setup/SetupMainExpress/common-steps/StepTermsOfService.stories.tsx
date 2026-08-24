/**
 * Reader Revenue Manager StepTermsOfService component stories.
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
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { createTestRegistry, provideSiteInfo } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepTermsOfService from './StepTermsOfService';

/* eslint-disable sitekit/acronym-case -- Publication API fixtures use normalized API field names. */

type Registry = ReturnType< typeof createTestRegistry >;

type Decorator = {
	(
		Story: ElementType,
		{ parameters }: { parameters: { isLoading?: boolean } }
	): ReactNode;
};

const organizationID = 'organization-1';
const publicationID = 'publication-1';
const tosURL = 'https://example.com/terms';
const termsOfService = `
	<p><strong>If You are accepting this Agreement on behalf of an entity or organization, then the following apply:</strong> (a) do not sign unless you are authorized by that entity or organization to do so; and (b) you represent and warrant that: (n) You have full legal authority to bind that entity or organization to this Agreement; (l) You have read and understand this Agreement; and (ll) You and your entity or organization agree to this Agreement. If You don't have the legal authority to bind your company or entity, please do not accept this Agreement.</p>
	<p><strong>1. Definitions.</strong></p>
	<ul>
		<li><strong>"Affiliates"</strong> means any entity that directly or indirectly controls, is controlled by, or is under common control with, a party.</li>
		<li><strong>"Brand Elements"</strong> means trade names, trademarks, logos, domain names and other distinctive brand elements.</li>
		<li><strong>"End User"</strong> means an individual that subscribes to Your content through Reader Revenue Manager.</li>
	</ul>
`;

function setupRegistry( registry: Registry, isLoading = false ) {
	provideSiteInfo( registry );

	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		organizationID,
		publicationID,
	} );
	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetPublication(
		{
			publicationId: publicationID,
			organizationId: organizationID,
			onboardingState: 'ONBOARDING_ACTION_REQUIRED',
			rrmProduct: {
				productTosUrl: tosURL,
			},
		},
		{ organizationID, publicationID }
	);

	if ( ! isLoading ) {
		registry
			.dispatch( MODULES_READER_REVENUE_MANAGER )
			.receiveGetTermsOfService( termsOfService, { tosURL } );
	}
}

function Template() {
	return <StepTermsOfService />;
}

export const Default = Template.bind( {} );
Default.storyName = 'Default';
Default.scenario = {};

export const Loading = Template.bind( {} );
Loading.storyName = 'Loading';
Loading.parameters = {
	isLoading: true,
};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/StepTermsOfService',
	component: StepTermsOfService,
	decorators: [
		( ( Story, { parameters } ) => {
			return (
				<WithRegistrySetup
					func={ ( registry: Registry ) =>
						setupRegistry( registry, parameters.isLoading )
					}
				>
					<Story />
				</WithRegistrySetup>
			);
		} ) as Decorator,
	],
};
