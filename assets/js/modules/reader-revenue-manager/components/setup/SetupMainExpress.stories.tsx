/**
 * Reader Revenue Manager SetupMainExpress component stories.
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

/**
 * Internal dependencies
 */
import { Story } from '@/js/types/Story';
import SetupMainExpress from './SetupMainExpress';

type SetupMainExpressStoryProps = Record< string, never >;
type SetupMainExpressQueryStory = Story< SetupMainExpressStoryProps > & {
	parameters?: {
		query?: Record< string, string >;
	};
};

function Template() {
	return <SetupMainExpress />;
}

export const PublicationSetupOnly = Template.bind(
	{}
) as SetupMainExpressQueryStory;
PublicationSetupOnly.storyName = 'Publication setup only';
PublicationSetupOnly.parameters = {
	query: {
		step: 'connect-publication',
	},
};
PublicationSetupOnly.scenario = {};

export const SetupCompleteOnly = Template.bind(
	{}
) as SetupMainExpressQueryStory;
SetupCompleteOnly.storyName = 'Setup complete only';
SetupCompleteOnly.parameters = {
	query: {
		step: 'setup-complete',
	},
};
SetupCompleteOnly.scenario = {};

export const NewsletterCTASetup = Template.bind(
	{}
) as SetupMainExpressQueryStory;
NewsletterCTASetup.storyName = 'Newsletter CTA setup';
NewsletterCTASetup.parameters = {
	query: {
		cta: 'newsletter-signup',
		step: 'setup-cta',
	},
};
NewsletterCTASetup.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress',
	component: SetupMainExpress,
	decorators: [ withQuery ],
	parameters: { padding: 0 },
};
