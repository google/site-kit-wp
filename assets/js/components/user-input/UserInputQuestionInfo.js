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
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import UserInputQuestionNotice from './UserInputQuestionNotice';
import { Cell } from '../../material-components';

export default function UserInputQuestionInfo( { title, description, scope, questionNumber, author } ) {
	return (
		<Cell
			className="googlesitekit-user-input__question-instructions"
			lgSize={ 5 }
			mdSize={ 8 }
			smSize={ 4 }
		>
			<p className="googlesitekit-user-input__question-number">
				{
					/* translators: %s: the number of the question */
					sprintf( __( '%s out of 5', 'google-site-kit' ), questionNumber )
				}
			</p>

			<h1>
				{ title }
			</h1>

			{ description && (
				<p>
					{ description }
				</p>
			) }

			<UserInputQuestionNotice />

			{ scope === 'site' && (
				<p>
					{ __( 'This question applies to the entire site and may have an effect for other users.', 'google-site-kit' ) }
				</p>
			) }

			{ author && author.photo && author.name && (
				<Fragment>
					<p>
						{ __( 'This question has last been answered by:', 'google-site-kit' ) }
					</p>

					<div className="googlesitekit-user-input__question-instructions--author">
						<img alt={ author.name } src={ author.photo } />
						{ author.name }
					</div>
				</Fragment>
			) }
		</Cell>
	);
}

UserInputQuestionInfo.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	scope: PropTypes.string,
	questionNumber: PropTypes.number,
	author: PropTypes.shape( {
		photo: PropTypes.string,
		name: PropTypes.string,
	} ),
};
