/**
 * Reader Revenue Manager survey CTA express setup flow.
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
import type { FC } from 'react';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import {
	existingCTAStep,
	publicationPoliciesStep,
	publicationSetupStep,
	setupCompleteStep,
	termsOfServiceStep,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import ExpressSetupLayout from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupLayout';
import ExpressSetupSteps from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupSteps';
import {
	useExpressSetupScopes,
	useSetupFlow,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks';
import PublisherCenterLink from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/PublisherCenterLink';
import { SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import ViewOnSiteCTA from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ViewOnSiteCTA';
import { EXPRESS_SETUP_CTAS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import { surveyCTAStep } from './StepSurveyCTA';
import { surveyQuestionsStep } from './StepSurveyQuestions';

const STEPS: SetupStep[] = [
	publicationSetupStep,
	termsOfServiceStep,
	publicationPoliciesStep,
	surveyQuestionsStep,
	surveyCTAStep,
	setupCompleteStep,
];

const SetupCTASurvey: FC = () => {
	useExpressSetupScopes();

	const { currentStep, advance } = useSetupFlow(
		STEPS,
		EXPRESS_SETUP_CTAS.SURVEY
	);

	// Copy this flow overrides on the shared steps, keyed by step slug.
	const stepProps: Record< string, object > = {
		[ publicationSetupStep.slug ]: {
			connectDescription: __(
				'To set up a survey using Reader Revenue Manager, connect your publication or create a new one.',
				'google-site-kit'
			),
			createDescription: __(
				'To set up a survey using Reader Revenue Manager, you will need to create a publication.',
				'google-site-kit'
			),
		},
		[ publicationPoliciesStep.slug ]: {
			description: __(
				'To set up a survey using Reader Revenue Manager, you will need to add URLs to your publication’s policies.',
				'google-site-kit'
			),
		},
		[ existingCTAStep.slug ]: {
			title: __(
				'We found an existing survey for this publication',
				'google-site-kit'
			),
			description: createInterpolateElement(
				__(
					'Your publication is now connected to Site Kit. However, Site Kit can’t create a survey for a publication that already has one in Reader Revenue Manager. To view or edit your publications, go to <a>Publisher Center</a>',
					'google-site-kit'
				),
				{
					a: (
						<PublisherCenterLink eventName="click_view_publications_link" />
					),
				}
			),
			targetingDescription: createInterpolateElement(
				__(
					'To change who sees your survey, set targeting rules in <a>Publisher Center</a>',
					'google-site-kit'
				),
				{
					a: (
						<PublisherCenterLink eventName="click_set_targeting_rules_link" />
					),
				}
			),
		},
		[ setupCompleteStep.slug ]: {
			title: __( 'Your survey is published!', 'google-site-kit' ),
			secondaryCTA: <ViewOnSiteCTA />,
			children: (
				<P size={ SIZE_MEDIUM }>
					{ __( 'Survey details placeholder', 'google-site-kit' ) }
				</P>
			),
		},
	};

	const StepComponent = currentStep?.Component;

	// Steps outside the sequence, like the existing CTA step, have no place in
	// the stepper. The sidebar shows while the step resolves.
	const isStepInSequence =
		! currentStep ||
		STEPS.some( ( { slug } ) => slug === currentStep.slug );

	return (
		<ExpressSetupLayout
			sidebar={
				isStepInSequence ? (
					<ExpressSetupSteps
						steps={ STEPS }
						activeSlug={ currentStep?.slug }
					/>
				) : undefined
			}
		>
			{ StepComponent ? (
				<StepComponent
					{ ...stepProps[ currentStep.slug ] }
					onComplete={ advance }
				/>
			) : null }
		</ExpressSetupLayout>
	);
};

export default SetupCTASurvey;
