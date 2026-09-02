/**
 * Reader Revenue Manager Newsletter CTA Preview component stories.
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
import { NEWSLETTER_SIGNUP_FORM } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/constants';
import { EXPRESS_SETUP_CTA_FORMS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import Preview from './index';

type Decorator = {
	( StoryComponent: ElementType, { args }: Story ): ReactNode;
};

function Template() {
	return <Preview />;
}

export const Default = Template.bind( {} ) as Story;
Default.storyName = 'Default';
Default.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTANewsletterSignup/Preview',
	component: Preview,
	decorators: [
		( ( StoryComponent, { args } ) => {
			function setupRegistry( registry: Registry ) {
				registry
					.dispatch( CORE_FORMS )
					.setValues( EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP, {
						[ NEWSLETTER_SIGNUP_FORM.CTA_TITLE ]:
							'Your form header',
						[ NEWSLETTER_SIGNUP_FORM.CTA_BODY ]:
							'Your newsletter sign-up form text',
						[ NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED ]: true,
						[ NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT ]:
							'Your consent text will show here',
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
