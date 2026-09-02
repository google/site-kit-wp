/**
 * Reader Revenue Manager newsletter signup form step stories.
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
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTA_FORMS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { Story } from '@/js/types/Story';
import {
	provideModuleRegistrations,
	provideModules,
	provideSiteInfo,
} from '@tests/js/utils';
import WithRegistrySetup from '@tests/js/WithRegistrySetup';
import StepSignupForm from './index';

type StoryArgs = {
	formValues?: Record< string, string | boolean >;
	setupRegistry?: ( registry: Registry ) => void;
};

type StepSignupFormStory = Story & {
	args?: StoryArgs;
};

type Decorator = {
	( StoryComponent: ElementType, { args }: { args?: StoryArgs } ): ReactNode;
};

const validSettings = {
	publicationID: 'ABCDEFGH',
	organizationID: 'ABCD1234',
	publicationOnboardingState: 'ONBOARDING_ACTION_REQUIRED',
	publicationOnboardingStateChanged: false,
	contentPolicyState: '',
	policyInfoLink: '',
	snippetMode: 'post_types',
	postTypes: [ 'post' ],
	productID: 'valid-id',
	productIDs: [ 'valid' ],
	paymentOption: 'valid-option',
};

const defaultFormValues = {
	[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: 'Newsletter signup',
};

const populatedFormValues = {
	[ NEWSLETTER_SIGNUP_FORM.DISPLAY_NAME ]: 'Newsletter signup',
	[ NEWSLETTER_SIGNUP_FORM.CTA_TITLE ]: 'Your form header',
	[ NEWSLETTER_SIGNUP_FORM.CTA_BODY ]: 'Your newsletter sign-up form text',
	[ NEWSLETTER_SIGNUP_FORM.NAME_REQUIRED ]: true,
	[ NEWSLETTER_SIGNUP_FORM.CONSENT_ENABLED ]: true,
	[ NEWSLETTER_SIGNUP_FORM.CONSENT_TEXT ]: 'Your consent text will show here',
};

function Template() {
	return <StepSignupForm />;
}

export const Default = Template.bind( {} ) as StepSignupFormStory;
Default.storyName = 'Default';
Default.args = {
	formValues: defaultFormValues,
};
Default.scenario = {};

export const PopulatedWithPreview = Template.bind( {} ) as StepSignupFormStory;
PopulatedWithPreview.storyName = 'Populated With Preview';
PopulatedWithPreview.args = {
	formValues: populatedFormValues,
};

export const Error = Template.bind( {} ) as StepSignupFormStory;
Error.storyName = 'Error';
Error.args = {
	formValues: defaultFormValues,
	setupRegistry: ( registry ) => {
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

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTANewsletterSignup/StepSignupForm',
	component: StepSignupForm,
	parameters: {
		layout: 'fullscreen',
	},
	decorators: [
		( ( StoryComponent, { args } ) => {
			function setupRegistry( registry: Registry ) {
				const moduleData = [
					{
						slug: MODULE_SLUG_READER_REVENUE_MANAGER,
						active: true,
						connected: true,
					},
				];

				provideSiteInfo( registry );
				provideModules( registry, moduleData );
				provideModuleRegistrations( registry, moduleData );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.receiveGetSettings( validSettings );

				registry
					.dispatch( MODULES_READER_REVENUE_MANAGER )
					.finishResolution( 'getSettings', [] );

				registry
					.dispatch( CORE_FORMS )
					.setValues( EXPRESS_SETUP_CTA_FORMS.NEWSLETTER_SIGNUP, {
						...defaultFormValues,
						...args?.formValues,
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
