/**
 * User Input Role Question.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import UserInputQuestionWrapper from './UserInputQuestionWrapper';
import UserInputQuestionInfo from './UserInputQuestionInfo';
import UserInputSelectOptions from './UserInputSelectOptions';
import { USER_INPUT_ANSWERS_ROLE } from './util/constants';

export default function UserInputRoleQuestion( props ) {
	return (
		<UserInputQuestionWrapper slug="role" { ...props }>
			<UserInputQuestionInfo
				title={ __( 'Which best describes your team/role in relation to this site?', 'google-site-kit' ) }
				questionNumber={ 1 }
			/>

			<UserInputSelectOptions
				slug="role"
				options={ USER_INPUT_ANSWERS_ROLE }
			/>
		</UserInputQuestionWrapper>
	);
}

UserInputRoleQuestion.propTypes = {
	isActive: PropTypes.bool,
	next: PropTypes.func,
};
