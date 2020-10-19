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
import UserInputQuestion from './UserInputQuestion';

export default function UserInputQuestionnaire() {
	const [ activeSlug, setActiveSlug ] = useState( 'role' );

	const questions = [ 'role', 'postFrequency', 'goals', 'helpNeeded', 'searchTerms', 'preview' ];
	const activeSlugIndex = questions.indexOf( activeSlug );

	const next = useCallback( () => {
		setActiveSlug( questions[ activeSlugIndex + 1 ] );
	}, [ activeSlugIndex ] );

	const back = useCallback( () => {
		setActiveSlug( questions[ activeSlugIndex - 1 ] );
	}, [ activeSlugIndex ] );

	const list = [];

	const roleIndex = questions.indexOf( 'role' );
	if ( activeSlugIndex <= roleIndex ) {
		list.push(
			<UserInputQuestion
				key="role"
				slug="role"
				isActive={ activeSlugIndex === roleIndex }
				next={ next }
			/>
		);
	}

	const postFrequencyIndex = questions.indexOf( 'postFrequency' );
	if ( activeSlugIndex <= postFrequencyIndex ) {
		list.push(
			<UserInputQuestion
				key="postFrequency"
				slug="postFrequency"
				isActive={ activeSlugIndex === postFrequencyIndex }
				next={ next }
				back={ back }
			/>
		);
	}

	const goalsIndex = questions.indexOf( 'goals' );
	if ( activeSlugIndex <= goalsIndex ) {
		list.push(
			<UserInputQuestion
				key="goals"
				slug="goals"
				isActive={ activeSlugIndex === goalsIndex }
				next={ next }
				back={ back }
			/>
		);
	}

	const helpNeededIndex = questions.indexOf( 'helpNeeded' );
	if ( activeSlugIndex <= helpNeededIndex ) {
		list.push(
			<UserInputQuestion
				key="helpNeeded"
				slug="helpNeeded"
				isActive={ activeSlugIndex === helpNeededIndex }
				next={ next }
				back={ back }
			/>
		);
	}

	const searchTermsIndex = questions.indexOf( 'searchTerms' );
	if ( activeSlugIndex <= searchTermsIndex ) {
		list.push(
			<UserInputQuestion
				key="searchTerms"
				slug="searchTerms"
				isActive={ activeSlugIndex === searchTermsIndex }
				back={ back }
			/>
		);
	}

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-12-desktop
			mdc-layout-grid__cell--span-8-tablet
			mdc-layout-grid__cell--span-4-phone
		">
			<div>progress bar</div>
			{ list }
		</div>
	);
}
