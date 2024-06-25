/**
 * User Input Question Author Component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';

export default function UserInputQuestionAuthor( { slug } ) {
	const author = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettingAuthor( slug )
	);

	if ( ! author || ! author.photo || ! author.login ) {
		return null;
	}

	return (
		<div className="googlesitekit-user-input__author">
			<p>
				{ __(
					'This question has been answered by:',
					'google-site-kit'
				) }
			</p>

			<div className="googlesitekit-user-input__author-info">
				<img alt={ author.login } src={ author.photo } />
				{ author.login }
			</div>
		</div>
	);
}

UserInputQuestionAuthor.propTypes = {
	slug: PropTypes.string.isRequired,
};
