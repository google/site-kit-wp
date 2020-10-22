/**
 * User Input Question Info.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { sanitizeHTML } from '../../util';

export default function UserInputQuestionInfo( { title, questionNumber } ) {
	const notice = sprintf(
		/* translators: %s: Settings page URL */
		__( 'You can always edit your answers after your submission in <a href="%s">Setting</a>.', 'google-site-kit' ),
		'#'
	);

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'a' ],
		ALLOWED_ATTR: [ 'href' ],
	};

	return (
		<div className="
			mdc-layout-grid__cell
			mdc-layout-grid__cell--span-5-desktop
			mdc-layout-grid__cell--span-8-tablet
			mdc-layout-grid__cell--span-4-phone
		">
			<p className="googlesitekit-user-input__question-number">
				{
					/* translators: %s: the number of the question */
					sprintf( __( '%s out of 5', 'google-site-kit' ), questionNumber )
				}
			</p>

			<h1 className="googlesitekit-user-input__question-title">
				{ title }
			</h1>

			<p className="googlesitekit-user-input__question-instructions">
				{ __( 'Place a text here that gives more context and information to the user to answer the question correctly.', 'google-site-kit' ) }
			</p>

			<p
				className="googlesitekit-user-input__question-instructions googlesitekit-user-input__question-instructions--notice"
				dangerouslySetInnerHTML={ sanitizeHTML( notice, sanitizeArgs ) }
			/>
		</div>
	);
}

UserInputQuestionInfo.propTypes = {
	title: PropTypes.string.isRequired,
	questionNumber: PropTypes.number.isRequired,
};
