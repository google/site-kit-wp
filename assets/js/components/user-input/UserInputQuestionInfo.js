/**
 * User Input Question Info.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import Data from 'googlesitekit-data';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { Cell } from '../../material-components';
import UserInputQuestionNotice from './UserInputQuestionNotice';
import UserInputQuestionAuthor from './UserInputQuestionAuthor';
const { useSelect } = Data;

export default function UserInputQuestionInfo( {
	slug,
	title,
	description,
	questionNumber,
} ) {
	const hasMultipleUser = useSelect( ( select ) =>
		select( CORE_SITE ).hasMultipleAdmins()
	);
	const scope = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettingScope( slug )
	);
	const author = useSelect( ( select ) =>
		select( CORE_USER ).getUserInputSettingAuthor( slug )
	);

	return (
		<Fragment>
			<Cell
				className="googlesitekit-user-input__question-instructions"
				lgSize={ 5 }
				mdSize={ 8 }
				smSize={ 4 }
			>
				<p className="googlesitekit-user-input__question-number">
					{ sprintf(
						/* translators: %s: the number of the question */
						__( '%s out of 3', 'google-site-kit' ),
						questionNumber
					) }
				</p>

				<h1>{ title }</h1>

				{ description && (
					<p className="googlesitekit-user-input__question-instructions--description">
						{ description }
					</p>
				) }

				<UserInputQuestionNotice className="googlesitekit-non-desktop-display-none" />
			</Cell>
			<Cell
				className="googlesitekit-user-input__question-info"
				lgSize={ 5 }
				mdSize={ 8 }
				smSize={ 4 }
				smOrder={ 3 }
			>
				<UserInputQuestionNotice className="googlesitekit-desktop-display-none " />

				{ scope === 'site' && hasMultipleUser && (
					<p>
						{ author
							? __(
									'This answer can be edited by all Site Kit admins',
									'google-site-kit'
							  )
							: __(
									'Your answer to this question will apply to all Site Kit users. Any other admins with access to Site Kit can see and edit this response.',
									'google-site-kit'
							  ) }
					</p>
				) }

				<UserInputQuestionAuthor slug={ slug } />
			</Cell>
		</Fragment>
	);
}

UserInputQuestionInfo.propTypes = {
	slug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	description: PropTypes.string,
	questionNumber: PropTypes.number,
};
