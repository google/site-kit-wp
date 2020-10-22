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
 * Internal dependencies
 */
import ProgressBar from '../progress-bar';
import UserInputRoleQuestion from './UserInputRoleQuestion';
import UserInputPostFrequencyQuestion from './UserInputPostFrequencyQuestion';
import UserInputGoalsQuestion from './UserInputGoalsQuestion';
import UserInputHelpNeededQuestion from './UserInputHelpNeededQuestion';
import UserInputSearchTermsQuestion from './UserInputSearchTermsQuestion';

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
				<UserInputRoleQuestion isActive={ activeSlug === 'role' } next={ next } />
			) }

			{ activeSlugIndex <= questions.indexOf( 'postFrequency' ) && (
				<UserInputPostFrequencyQuestion isActive={ activeSlug === 'postFrequency' } next={ next } back={ back } />
			) }

			{ activeSlugIndex <= questions.indexOf( 'goals' ) && (
				<UserInputGoalsQuestion isActive={ activeSlug === 'goals' } next={ next } back={ back } />
			) }

			{ activeSlugIndex <= questions.indexOf( 'helpNeeded' ) && (
				<UserInputHelpNeededQuestion isActive={ activeSlug === 'helpNeeded' } next={ next } back={ back } />
			) }

			{ activeSlugIndex <= questions.indexOf( 'searchTerms' ) && (
				<UserInputSearchTermsQuestion isActive={ activeSlug === 'searchTerms' } next={ next } back={ back } />
			) }
		</div>
	);
}
