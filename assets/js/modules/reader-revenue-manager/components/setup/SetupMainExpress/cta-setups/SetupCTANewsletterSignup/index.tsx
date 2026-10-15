/**
 * Reader Revenue Manager newsletter signup CTA express setup flow.
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
import { useMount } from 'react-use';

/**
 * WordPress dependencies
 */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	publicationPoliciesStep,
	publicationSetupStep,
	setupCompleteStep,
	termsOfServiceStep,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/common-steps';
import ExpressSetupLayout from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupLayout';
import ExpressSetupSteps from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupSteps';
import {
	useExpressSetupScopes,
	useExpressSetupStepEventLabel,
	useExpressSetupTrackEvent,
	useSetupFlow,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/hooks';
import ObservedStep from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ObservedStep';
import { SetupStep } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import { EXPRESS_SETUP_STEPS } from '@/js/modules/reader-revenue-manager/datastore/constants';
import StepSetupCompleteNewsletterSignup from './StepSetupCompleteNewsletterSignup';
import { signupFormStep } from './StepSignupForm';
import ViewOnSiteCTA from './ViewOnSiteCTA';

const STEPS: SetupStep[] = [
	publicationSetupStep,
	termsOfServiceStep,
	publicationPoliciesStep,
	signupFormStep,
	setupCompleteStep,
];

const SetupCTANewsletterSignup: FC = () => {
	useExpressSetupScopes();

	const { currentStep, advance } = useSetupFlow( STEPS );

	const trackEvent = useExpressSetupTrackEvent();
	const stepEventLabel = useExpressSetupStepEventLabel( currentStep?.slug );

	// Each step's start is tracked once, when it is first in view.
	const [ stepInView, setStepInView ] = useState< string >();
	const trackedStartStepRef = useRef< string >();

	useMount( () => {
		trackEvent( 'start_setup' );
	} );

	// Waits for the label as well as the step being in view, as the publication
	// setup step only knows its label once its publications have loaded.
	useEffect( () => {
		const slug = currentStep?.slug;

		if (
			! slug ||
			! stepEventLabel ||
			stepInView !== slug ||
			trackedStartStepRef.current === slug
		) {
			return;
		}

		trackedStartStepRef.current = slug;

		trackEvent( 'start_step', stepEventLabel );

		if ( slug === EXPRESS_SETUP_STEPS.SETUP_COMPLETE ) {
			trackEvent( 'complete_setup' );
		}
	}, [ currentStep?.slug, stepEventLabel, stepInView, trackEvent ] );

	const onStepInView = useCallback( () => {
		setStepInView( currentStep?.slug );
	}, [ currentStep?.slug ] );

	// Returns the tracking promise for the setup complete step, which leaves
	// the page once it settles. Other steps advance without waiting for it.
	const onStepComplete = useCallback( () => {
		const tracking = trackEvent( 'complete_step', stepEventLabel );

		advance();

		return tracking;
	}, [ advance, stepEventLabel, trackEvent ] );

	// Copy this flow overrides on the shared steps, keyed by step slug.
	const stepProps: Record< string, object > = {
		[ publicationSetupStep.slug ]: {
			connectDescription: __(
				'To set up a newsletter sign-up form using Reader Revenue Manager, connect your publication or create a new one.',
				'google-site-kit'
			),
			createDescription: __(
				'To set up a newsletter sign-up form using Reader Revenue Manager, you will need to create a publication.',
				'google-site-kit'
			),
		},
		[ publicationPoliciesStep.slug ]: {
			description: __(
				'To set up a newsletter using Reader Revenue Manager, you will need to add links to your publication’s policies.',
				'google-site-kit'
			),
		},
		[ setupCompleteStep.slug ]: {
			title: __(
				'Your newsletter signup form is ready!',
				'google-site-kit'
			),
			secondaryCTA: <ViewOnSiteCTA />,
			children: <StepSetupCompleteNewsletterSignup />,
		},
	};

	const StepComponent = currentStep?.Component;

	return (
		<ExpressSetupLayout
			sidebar={
				<ExpressSetupSteps
					steps={ STEPS }
					activeSlug={ currentStep?.slug }
				/>
			}
		>
			{ StepComponent ? (
				// Keyed by step, so each step is observed from when it renders.
				<ObservedStep
					key={ currentStep.slug }
					onInView={ onStepInView }
				>
					<StepComponent
						{ ...stepProps[ currentStep.slug ] }
						onComplete={ onStepComplete }
					/>
				</ObservedStep>
			) : null }
		</ExpressSetupLayout>
	);
};

export default SetupCTANewsletterSignup;
