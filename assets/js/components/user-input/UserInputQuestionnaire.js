/**
 * User Input Questionnaire.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { useState, useCallback, Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ProgressBar from '../ProgressBar';
import UserInputQuestionWrapper from './UserInputQuestionWrapper';
import UserInputSelectOptions from './UserInputSelectOptions';
import UserInputKeywords from './UserInputKeywords';
import UserInputPreview from './UserInputPreview';
import {
	USER_INPUT_QUESTION_ROLE,
	USER_INPUT_QUESTION_POST_FREQUENCY,
	USER_INPUT_QUESTION_GOALS,
	USER_INPUT_QUESTION_HELP_NEEDED,
	USER_INPUT_QUESTION_SEARCH_TERMS,
	getUserInputAnwsers,
} from './util/constants';

export default function UserInputQuestionnaire() {
	const [ activeSlug, setActiveSlug ] = useState( USER_INPUT_QUESTION_ROLE );

	const questions = [
		USER_INPUT_QUESTION_ROLE,
		USER_INPUT_QUESTION_POST_FREQUENCY,
		USER_INPUT_QUESTION_GOALS,
		USER_INPUT_QUESTION_HELP_NEEDED,
		USER_INPUT_QUESTION_SEARCH_TERMS,
	];

	const {
		USER_INPUT_ANSWERS_GOALS,
		USER_INPUT_ANSWERS_HELP_NEEDED,
		USER_INPUT_ANSWERS_POST_FREQUENCY,
		USER_INPUT_ANSWERS_ROLE,
	} = getUserInputAnwsers();

	const steps = [ ...questions, 'preview' ];
	const activeSlugIndex = steps.indexOf( activeSlug );

	const next = useCallback( () => {
		setActiveSlug( steps[ activeSlugIndex + 1 ] );
	}, [ activeSlugIndex ] );

	const goTo = useCallback( ( num = 1 ) => {
		if ( steps.length >= num && num > 0 ) {
			setActiveSlug( steps[ num - 1 ] );
			global.scrollTo( 0, 0 );
		}
	}, [ activeSlugIndex ] );

	const back = useCallback( () => {
		setActiveSlug( steps[ activeSlugIndex - 1 ] );
	}, [ activeSlugIndex ] );

	return (
		<Fragment>
			<ProgressBar
				height={ 0 }
				indeterminate={ false }
				progress={ ( activeSlugIndex + 1 ) / questions.length }
			/>

			{ activeSlugIndex <= steps.indexOf( USER_INPUT_QUESTION_ROLE ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_ROLE }
					isActive={ activeSlug === USER_INPUT_QUESTION_ROLE }
					questionNumber={ 1 }
					title={ __( 'Which best describes your team/role in relation to this site?', 'google-site-kit' ) }
					next={ next }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTION_ROLE }
						options={ USER_INPUT_ANSWERS_ROLE }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= steps.indexOf( USER_INPUT_QUESTION_POST_FREQUENCY ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
					isActive={ activeSlug === USER_INPUT_QUESTION_POST_FREQUENCY }
					questionNumber={ 2 }
					title={ __( 'How often do you create new posts for this site?', 'google-site-kit' ) }
					next={ next }
					back={ back }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTION_POST_FREQUENCY }
						options={ USER_INPUT_ANSWERS_POST_FREQUENCY }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= steps.indexOf( USER_INPUT_QUESTION_GOALS ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_GOALS }
					isActive={ activeSlug === USER_INPUT_QUESTION_GOALS }
					questionNumber={ 3 }
					title={ __( 'What are the goals of this site?', 'google-site-kit' ) }
					next={ next }
					back={ back }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTION_GOALS }
						max={ 2 }
						options={ USER_INPUT_ANSWERS_GOALS }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= steps.indexOf( USER_INPUT_QUESTION_HELP_NEEDED ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_HELP_NEEDED }
					isActive={ activeSlug === USER_INPUT_QUESTION_HELP_NEEDED }
					questionNumber={ 4 }
					title={ __( 'What do you need help most with for this site?', 'google-site-kit' ) }
					next={ next }
					back={ back }
				>
					<UserInputSelectOptions
						slug={ USER_INPUT_QUESTION_HELP_NEEDED }
						max={ 3 }
						options={ USER_INPUT_ANSWERS_HELP_NEEDED }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= steps.indexOf( USER_INPUT_QUESTION_SEARCH_TERMS ) && (
				<UserInputQuestionWrapper
					slug={ USER_INPUT_QUESTION_SEARCH_TERMS }
					isActive={ activeSlug === USER_INPUT_QUESTION_SEARCH_TERMS }
					questionNumber={ 5 }
					title={ __( 'To help us identify opportunities for your site, enter the top three search terms that you’d like to show up for', 'google-site-kit' ) }
					next={ next }
					back={ back }
				>
					<UserInputKeywords
						slug={ USER_INPUT_QUESTION_SEARCH_TERMS }
						max={ 3 }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlug === 'preview' && (
				<UserInputPreview goTo={ goTo } />
			) }
		</Fragment>
	);
}
