/**
 * CustomQuestionSideSheet utilities.
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
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { CustomQuestionAnswer } from './types';

export function createAnswer( value = '' ): CustomQuestionAnswer {
	return { id: uniqueId( 'answer-' ), value };
}

export function getAnswerID( { id }: CustomQuestionAnswer ) {
	return id;
}

export function getAnswerLabel( index: number ) {
	return sprintf(
		/* translators: %d: answer number. */
		__( 'Answer %d', 'google-site-kit' ),
		index + 1
	);
}

export function getAnswerValue( { value }: CustomQuestionAnswer ) {
	return value;
}

export function getMoveAnswerLabel( index: number ) {
	return sprintf(
		/* translators: %d: answer number. */
		__( 'Move answer %d', 'google-site-kit' ),
		index + 1
	);
}

export function getNewAnswer() {
	return createAnswer( '' );
}

export function getRemoveAnswerLabel( index: number ) {
	return sprintf(
		/* translators: %d: answer number. */
		__( 'Remove answer %d', 'google-site-kit' ),
		index + 1
	);
}

export function getUpdatedAnswer(
	value: string,
	answer: CustomQuestionAnswer
) {
	return { ...answer, value };
}
