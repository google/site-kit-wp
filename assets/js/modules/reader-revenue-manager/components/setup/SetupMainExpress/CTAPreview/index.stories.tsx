/**
 * Reader Revenue Manager CTAPreview component stories.
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
import type { ComponentProps } from 'react';

/**
 * Internal dependencies
 */
import NewsletterPreview from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTANewsletterSignup/Preview';
import SurveyPreview from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/Preview';
import { Story } from '@/js/types/Story';
import CTAPreview from './index';

type Props = ComponentProps< typeof CTAPreview >;

function Template( args: Props ) {
	return <CTAPreview { ...args } />;
}

export const Default = Template.bind( {} ) as Story< Props >;
Default.storyName = 'Default';
Default.scenario = {};

function selectInlineTab() {
	document
		.querySelector< HTMLButtonElement >(
			'#googlesitekit-rrm-cta-preview-tab-inline'
		)
		?.click();
	return Promise.resolve();
}

export const PopupNewsletter = Template.bind( {} ) as Story< Props >;
PopupNewsletter.storyName = 'Popup Newsletter';
PopupNewsletter.args = {
	children: (
		<NewsletterPreview
			publicationName="Example Publication"
			ctaTitle="Your form header"
			ctaBody="Your newsletter sign-up form text"
			consentText="I agree to receive newsletter updates."
			consentEnabled
		/>
	),
};
PopupNewsletter.scenario = {};

export const InlineNewsletter = Template.bind( {} ) as Story< Props >;
InlineNewsletter.storyName = 'Inline Newsletter';
InlineNewsletter.args = PopupNewsletter.args;
InlineNewsletter.play = selectInlineTab;
InlineNewsletter.scenario = {
	clickSelector: '#googlesitekit-rrm-cta-preview-tab-inline',
};

export const PopupSurvey = Template.bind( {} ) as Story< Props >;
PopupSurvey.storyName = 'Popup Survey';
PopupSurvey.args = {
	children: (
		<SurveyPreview
			publicationName="Example Publication"
			question="How often do you visit our site?"
			questionAnswers={ [
				'Daily',
				'Weekly',
				'Monthly',
				'This is my first visit',
			] }
			questionCount={ 3 }
			surveyText="Help us learn more about you by answering a few questions"
		/>
	),
};
PopupSurvey.scenario = {};

export const InlineSurvey = Template.bind( {} ) as Story< Props >;
InlineSurvey.storyName = 'Inline Survey';
InlineSurvey.args = PopupSurvey.args;
InlineSurvey.play = selectInlineTab;
InlineSurvey.scenario = {
	clickSelector: '#googlesitekit-rrm-cta-preview-tab-inline',
};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/CTAPreview',
	component: CTAPreview,
};
