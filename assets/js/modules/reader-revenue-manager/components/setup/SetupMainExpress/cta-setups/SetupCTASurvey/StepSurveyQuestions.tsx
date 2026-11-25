/**
 * Reader Revenue Manager survey CTA express setup survey questions step.
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
import { FC, FormEvent } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import ExpressSetupStepActions from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupStepActions';
import {
	SetupStep,
	SetupStepProps,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';

const StepSurveyQuestions: FC< SetupStepProps > = ( {
	onComplete,
	onGoBack,
} ) => {
	const [ isSubmitting, setIsSubmitting ] = useState( false );

	const submitQuestions = useCallback( async () => {
		setIsSubmitting( true );

		// TODO: #13740 -- Submit the questions.
		await new Promise( ( resolve ) => {
			setTimeout( resolve, 2000 );
		} );

		await onComplete();
	}, [ onComplete ] );

	const onSubmit = useCallback(
		async ( event: FormEvent< HTMLFormElement > ) => {
			event.preventDefault();
			await submitQuestions();
		},
		[ submitQuestions ]
	);

	return (
		<div className="googlesitekit-rrm-express-setup-step googlesitekit-rrm-express-setup-step--cta-setup">
			<form
				className="googlesitekit-rrm-express-setup-step__form"
				onSubmit={ onSubmit }
			>
				<div className="googlesitekit-rrm-express-setup-step__form-content">
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ __( 'Survey questions', 'google-site-kit' ) }
					</ExpressSetupStepHeadline>

					<StoreErrorNotices
						moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
						storeName={ MODULES_READER_REVENUE_MANAGER }
						scrollIntoView
						hasButton
					/>

					<P
						className="googlesitekit-rrm-express-setup-step__description"
						size={ SIZE_MEDIUM }
					>
						{ __(
							'Add the questions your readers will be asked.',
							'google-site-kit'
						) }
					</P>

					<div className="googlesitekit-rrm-express-setup-step__form-controls">
						{ /* Placeholder until the form controls are built. */ }
						<P size={ SIZE_MEDIUM }>
							{ __(
								'Survey questions placeholder',
								'google-site-kit'
							) }
						</P>
					</div>
				</div>

				<ExpressSetupStepActions
					isBusy={ isSubmitting }
					label={ __( 'Next', 'google-site-kit' ) }
					onGoBack={ onGoBack }
				/>
			</form>
		</div>
	);
};

// No `isComplete`: this step never counts as complete, so the flow can always
// resolve to it.
export const surveyQuestionsStep: SetupStep = {
	slug: EXPRESS_SETUP_STEPS.SURVEY_QUESTIONS,
	label: __( 'Survey questions', 'google-site-kit' ),
	Component: StepSurveyQuestions,
};

export default StepSurveyQuestions;
