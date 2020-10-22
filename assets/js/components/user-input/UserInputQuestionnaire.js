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
import { useState, useCallback } from '@wordpress/element';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ProgressBar from '../progress-bar';
import UserInputQuestionWrapper from './UserInputQuestionWrapper';
import UserInputQuestionInfo from './UserInputQuestionInfo';
import UserInputSelectOptions from './UserInputSelectOptions';
import UserInputKeywords from './UserInputKeywords';
import UserInputPreview from './UserInputPreview';
import {
	USER_INPUT_ANSWERS_GOALS,
	USER_INPUT_ANSWERS_HELP_NEEDED,
	USER_INPUT_ANSWERS_POST_FREQUENCY,
	USER_INPUT_ANSWERS_ROLE,
} from './util/constants';

export default function UserInputQuestionnaire() {
	const [ activeSlug, setActiveSlug ] = useState( 'role' );

	const questions = [ 'role', 'postFrequency', 'goals', 'helpNeeded', 'searchTerms', 'preview' ];
	const activeSlugIndex = questions.indexOf( activeSlug );

	const next = useCallback( () => {
		setActiveSlug( questions[ activeSlugIndex + 1 ] );
	}, [ activeSlugIndex ] );

	const back = useCallback( () => {
		setActiveSlug( questions[ activeSlugIndex - 1 ] );
		global.scrollTo( 0, 0 );
	}, [ activeSlugIndex ] );

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-12-desktop
			mdc-layout-grid__cell--span-8-tablet
			mdc-layout-grid__cell--span-4-phone
		">
			<ProgressBar
				height={ 0 }
				indeterminate={ false }
				progress={ ( activeSlugIndex + 1 ) / questions.length }
			/>

			{ activeSlugIndex <= questions.indexOf( 'role' ) && (
				<UserInputQuestionWrapper
					slug="role"
					isActive={ activeSlug === 'role' }
					questionNumber={ 1 }
					next={ next }
				>
					<UserInputQuestionInfo>
						{ __( 'Which best describes your team/role in relation to this site?', 'google-site-kit' ) }
					</UserInputQuestionInfo>

					<UserInputSelectOptions
						slug="role"
						options={ USER_INPUT_ANSWERS_ROLE }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= questions.indexOf( 'postFrequency' ) && (
				<UserInputQuestionWrapper
					slug="postFrequency"
					isActive={ activeSlug === 'postFrequency' }
					questionNumber={ 2 }
					next={ next }
					back={ back }
				>
					<UserInputQuestionInfo>
						{ __( 'How often do you create new post for this site?', 'google-site-kit' ) }
					</UserInputQuestionInfo>

					<UserInputSelectOptions
						slug="postFrequency"
						options={ USER_INPUT_ANSWERS_POST_FREQUENCY }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= questions.indexOf( 'goals' ) && (
				<UserInputQuestionWrapper
					slug="goals"
					isActive={ activeSlug === 'goals' }
					questionNumber={ 3 }
					max={ 2 }
					next={ next }
					back={ back }
				>
					<UserInputQuestionInfo>
						{ __( 'What are the goals of this site?', 'google-site-kit' ) }
					</UserInputQuestionInfo>

					<UserInputSelectOptions
						slug="goals"
						max={ 2 }
						options={ USER_INPUT_ANSWERS_GOALS }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= questions.indexOf( 'helpNeeded' ) && (
				<UserInputQuestionWrapper
					slug="helpNeeded"
					isActive={ activeSlug === 'helpNeeded' }
					questionNumber={ 4 }
					max={ 3 }
					next={ next }
					back={ back }
				>
					<UserInputQuestionInfo>
						{ __( 'What do you need help most with for this site?', 'google-site-kit' ) }
					</UserInputQuestionInfo>

					<UserInputSelectOptions
						slug="helpNeeded"
						max={ 3 }
						options={ USER_INPUT_ANSWERS_HELP_NEEDED }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlugIndex <= questions.indexOf( 'searchTerms' ) && (
				<UserInputQuestionWrapper
					slug="searchTerms"
					isActive={ activeSlug === 'searchTerms' }
					questionNumber={ 5 }
					max={ 3 }
					next={ next }
					back={ back }
				>
					<UserInputQuestionInfo>
						{ __( 'To help us identify opportunities for your site, enter the top three search terms that you’d like to show up for', 'google-site-kit' ) }
					</UserInputQuestionInfo>

					<UserInputKeywords
						slug="searchTerms"
						max={ 3 }
					/>
				</UserInputQuestionWrapper>
			) }

			{ activeSlug === 'preview' && (
				<UserInputPreview back={ back } />
			) }
		</div>
	);
}
