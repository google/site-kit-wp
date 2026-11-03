/**
 * SelectedQuestionsPane stories.
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
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Story } from '@/js/types/Story';
import { SelectedSurveyQuestion } from './types';
import SelectedQuestionsPane, { SelectedQuestionsPaneProps } from '.';

const threeQuestions: SelectedSurveyQuestion[] = [
	{
		id: 'purchase-categories',
		question:
			'Are you planning on buying products from the following categories in the next 6 months? Select your top one.',
	},
	{
		id: 'recommend',
		question: 'How likely are you to recommend us to a friend?',
	},
	{
		id: 'find-us',
		question: 'How did you find us?',
	},
];

type TemplateProps = Pick<
	SelectedQuestionsPaneProps,
	'questions' | 'highlightedQuestionID'
>;

function Template( { questions, highlightedQuestionID }: TemplateProps ) {
	const [ currentQuestions, setCurrentQuestions ] = useState( questions );

	return (
		<div style={ { background: 'white', padding: 16 } }>
			<SelectedQuestionsPane
				highlightedQuestionID={ highlightedQuestionID }
				onRemove={ ( questionID ) =>
					setCurrentQuestions( ( previousQuestions ) =>
						previousQuestions.filter(
							( { id } ) => id !== questionID
						)
					)
				}
				onReorder={ setCurrentQuestions }
				questions={ currentQuestions }
			/>
		</div>
	);
}

export const NoQuestions = Template.bind( {} ) as Story< TemplateProps >;
NoQuestions.storyName = 'No Questions';
NoQuestions.args = {
	questions: [],
};
NoQuestions.scenario = {};

export const OneQuestion = Template.bind( {} ) as Story< TemplateProps >;
OneQuestion.storyName = 'One Question';
OneQuestion.args = {
	questions: threeQuestions.slice( 0, 1 ),
};
OneQuestion.scenario = {};

export const ThreeQuestions = Template.bind( {} ) as Story< TemplateProps >;
ThreeQuestions.storyName = 'Three Questions';
ThreeQuestions.args = {
	questions: threeQuestions,
};
ThreeQuestions.scenario = {};

export const ThreeQuestionsHighlighted = Template.bind(
	{}
) as Story< TemplateProps >;
ThreeQuestionsHighlighted.storyName = 'Three Questions, Highlighted';
ThreeQuestionsHighlighted.args = {
	questions: threeQuestions,
	highlightedQuestionID: 'recommend',
};
ThreeQuestionsHighlighted.scenario = {};

export default {
	title: 'Modules/ReaderRevenueManager/Setup/SetupMainExpress/SetupCTASurvey/SelectedQuestionsPane',
	component: SelectedQuestionsPane,
};
