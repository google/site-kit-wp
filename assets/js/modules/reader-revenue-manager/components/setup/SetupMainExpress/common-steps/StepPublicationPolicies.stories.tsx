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
import { MODULES_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import { createTestRegistry } from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepPublicationPolicies from './StepPublicationPolicies';

type Registry = ReturnType< typeof createTestRegistry >;

const PUBLICATION_ID_KEY = 'publicationId';
const PUBLICATION_TOS_URL_KEY = 'publicationTosUrl';
const PUBLICATION_PRIVACY_POLICY_URL_KEY = 'publicationPrivacyPolicyUrl';

type Decorator = {
	(
		Story: ElementType,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@storybook/react` is not typed yet.
		{ args }: { args: any }
	): ReactNode;
};

function setupRegistry( registry: Registry, withExistingValues = false ) {
	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetSettings( {
		organizationID: 'organization-1',
		publicationID: 'publication-1',
	} );

	registry.dispatch( MODULES_READER_REVENUE_MANAGER ).receiveGetPublication(
		{
			[ PUBLICATION_ID_KEY ]: 'publication-1',
			[ PUBLICATION_TOS_URL_KEY ]: withExistingValues
				? 'https://example.com/terms'
				: '',
			[ PUBLICATION_PRIVACY_POLICY_URL_KEY ]: withExistingValues
				? 'https://example.com/privacy'
				: '',
		},
		{
			organizationID: 'organization-1',
			publicationID: 'publication-1',
		}
	);

	global._googlesitekitBaseData.wpPrivacyURL =
		'https://example.com/wp-privacy-policy';
}

function Template() {
	return <StepPublicationPolicies onSetStep={ () => {} } />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.args = {
	withExistingValues: false,
};
Default.scenario = {};

export const ExistingValues = Template.bind( {} ) as Story;
ExistingValues.storyName = 'Existing values';
ExistingValues.args = {
	withExistingValues: true,
};
ExistingValues.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/CommonSteps/StepPublicationPolicies',
	component: StepPublicationPolicies,
	decorators: [
		( ( RenderStory, { args } ) => {
			return (
				<WithRegistrySetup
					func={ ( registry: Registry ) => {
						setupRegistry(
							registry,
							Boolean( args.withExistingValues )
						);
					} }
				>
					<RenderStory />
				</WithRegistrySetup>
			);
		} ) as Decorator,
	],
};
