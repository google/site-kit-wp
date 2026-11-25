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
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { ProgressBar } from 'googlesitekit-components';
import { Select, useSelect } from 'googlesitekit-data';
import StoreErrorNotices from '@/js/components/StoreErrorNotices';
import { SIZE_MEDIUM } from '@/js/components/Typography/constants';
import P from '@/js/components/Typography/P';
import useFormValue from '@/js/hooks/useFormValue';
import { ExpressSetupStepHeadline } from '@/js/modules/reader-revenue-manager/components/common';
import {
	MAX_SELECTED_QUESTIONS,
	SURVEY_FORM,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/constants';
import SelectedQuestionsPane from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/SelectedQuestionsPane';
import { SelectedSurveyQuestion } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/SelectedQuestionsPane/types';
import { getQuestionText } from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/cta-setups/SetupCTASurvey/utils';
import ExpressSetupStepActions from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/ExpressSetupStepActions';
import {
	SetupStep,
	SetupStepProps,
} from '@/js/modules/reader-revenue-manager/components/setup/SetupMainExpress/types';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import {
	EXPRESS_SETUP_CTA_FORMS,
	EXPRESS_SETUP_STEPS,
	MODULES_READER_REVENUE_MANAGER,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { type IdentifiedSurveyQuestion } from '@/js/modules/reader-revenue-manager/datastore/cta-types';
import { type SurveyQuestion as CatalogQuestion } from '@/js/modules/reader-revenue-manager/datastore/types';
import CustomQuestions from './CustomQuestions';
import PredefinedQuestions from './PredefinedQuestions';
import { QuestionGroupProps } from './types';

const StepSurveyQuestions: FC< SetupStepProps > = ( {
	onComplete,
	onGoBack,
} ) => {
	const [ selectedQuestionsValue, setSelectedQuestions ] = useFormValue<
		IdentifiedSurveyQuestion[]
	>( EXPRESS_SETUP_CTA_FORMS.SURVEY, SURVEY_FORM.SELECTED_QUESTIONS );
	const selectedQuestions = selectedQuestionsValue || [];

	const [ expandedIDs, setExpandedIDs ] = useState< string[] >( [] );
	// The question expanded last. It is highlighted in the selected questions
	// pane while it is selected.
	const [ lastExpandedID, setLastExpandedID ] = useState< string >();

	const catalog = useSelect(
		( select: Select ): CatalogQuestion[] | undefined =>
			select( MODULES_READER_REVENUE_MANAGER ).getSurveyQuestionCatalog(),
		[]
	);

	const catalogError = useSelect( ( select: Select ): object | undefined => {
		const params = select(
			MODULES_READER_REVENUE_MANAGER
		).getPublicationParams();

		if ( ! params ) {
			return undefined;
		}

		return select( MODULES_READER_REVENUE_MANAGER ).getErrorForSelector(
			'getPublicationSurveyQuestionCatalog',
			[ params.organizationID, params.publicationID ]
		);
	}, [] );

	if ( catalog === undefined && ! catalogError ) {
		return <ProgressBar />;
	}

	const hasCatalog = catalog !== undefined;
	const canGoForward = hasCatalog && selectedQuestions.length > 0;

	function onSubmit( event: FormEvent< HTMLFormElement > ) {
		event.preventDefault();

		// The custom question side sheet renders its form in a portal, so its
		// submit event bubbles up to this form through the React tree.
		if ( event.target !== event.currentTarget ) {
			return;
		}

		// Other buttons in this form submit it too, such as the error notice's
		// Retry button, which has no `type`. Complete the step only when "Next"
		// is enabled.
		if ( ! canGoForward ) {
			return;
		}

		onComplete();
	}

	function addQuestion( entry: IdentifiedSurveyQuestion ) {
		setSelectedQuestions( [ ...selectedQuestions, entry ] );
	}

	function removeQuestion( id: string ) {
		setSelectedQuestions(
			selectedQuestions.filter( ( entry ) => entry.id !== id )
		);
	}

	function updateQuestion( entry: IdentifiedSurveyQuestion ) {
		setSelectedQuestions(
			selectedQuestions.map( ( selectedEntry ) =>
				selectedEntry.id === entry.id ? entry : selectedEntry
			)
		);
	}

	function reorderQuestions( questions: SelectedSurveyQuestion[] ) {
		setSelectedQuestions(
			questions
				.map( ( { id } ) =>
					selectedQuestions.find( ( entry ) => entry.id === id )
				)
				.filter(
					( entry ): entry is IdentifiedSurveyQuestion =>
						entry !== undefined
				)
		);
	}

	function expandQuestion( id: string, isExpanded: boolean ) {
		if ( isExpanded ) {
			setExpandedIDs( [ ...expandedIDs, id ] );
			setLastExpandedID( id );
			return;
		}

		setExpandedIDs(
			expandedIDs.filter( ( expandedID ) => expandedID !== id )
		);

		if ( lastExpandedID === id ) {
			setLastExpandedID( undefined );
		}
	}

	const isAtLimit = selectedQuestions.length >= MAX_SELECTED_QUESTIONS;
	const isLastExpandedSelected = selectedQuestions.some(
		( { id } ) => id === lastExpandedID
	);

	const groupProps: QuestionGroupProps = {
		expandedIDs,
		isAtLimit,
		limitMessage: __(
			'You’ve reached the maximum of 3 questions per survey. To add a question, remove a question first.',
			'google-site-kit'
		),
		onAdd: addQuestion,
		onExpand: expandQuestion,
		onRemove: removeQuestion,
		onUpdate: updateQuestion,
		selectedQuestions,
	};

	return (
		<div className="googlesitekit-rrm-express-setup-step googlesitekit-rrm-express-setup-step--cta-setup googlesitekit-rrm-survey-questions-step">
			<form
				className="googlesitekit-rrm-express-setup-step__form"
				onSubmit={ onSubmit }
			>
				<div className="googlesitekit-rrm-express-setup-step__form-content">
					<ExpressSetupStepHeadline className="googlesitekit-rrm-express-setup-step__headline">
						{ __(
							'Select up to 3 questions for your survey',
							'google-site-kit'
						) }
					</ExpressSetupStepHeadline>

					<StoreErrorNotices
						moduleSlug={ MODULE_SLUG_READER_REVENUE_MANAGER }
						storeName={ MODULES_READER_REVENUE_MANAGER }
						scrollIntoView
						hasButton
					/>

					{ hasCatalog && (
						<P
							className="googlesitekit-rrm-express-setup-step__description"
							size={ SIZE_MEDIUM }
						>
							{ __(
								'Create custom questions or select from the list below',
								'google-site-kit'
							) }
						</P>
					) }

					{ hasCatalog && (
						<div className="googlesitekit-rrm-survey-questions-step__columns">
							<div className="googlesitekit-rrm-survey-questions-step__questions">
								<CustomQuestions { ...groupProps } />
								<PredefinedQuestions
									{ ...groupProps }
									catalog={ catalog }
								/>
							</div>

							<SelectedQuestionsPane
								highlightedQuestionID={
									isLastExpandedSelected
										? lastExpandedID
										: undefined
								}
								onRemove={ removeQuestion }
								onReorder={ reorderQuestions }
								questions={ selectedQuestions.map(
									( entry ) => ( {
										id: entry.id,
										question: getQuestionText(
											entry,
											catalog
										),
									} )
								) }
							/>
						</div>
					) }
				</div>

				<ExpressSetupStepActions
					canGoForward={ canGoForward }
					isBusy={ false }
					label={ __( 'Next', 'google-site-kit' ) }
					onGoBack={ onGoBack }
					isSticky
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
