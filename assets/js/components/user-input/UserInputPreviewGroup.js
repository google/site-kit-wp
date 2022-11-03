/**
 * User Input Preview Group.
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';

export default function UserInputPreviewGroup( {
	questionNumber,
	title,
	edit,
	values,
	options,
} ) {
	const trim = ( value ) => value.trim();
	const notEmpty = ( value ) => value.length > 0;

	const sprintfTemplate =
		/* translators: %s: other option */
		questionNumber < 5 ? __( 'Other: %s', 'google-site-kit' ) : '%s';

	return (
		<div className="googlesitekit-user-input__preview-group">
			<div className="googlesitekit-user-input__preview-group-title">
				<p>
					{ questionNumber } - { title }
				</p>
				<Button text onClick={ edit }>
					{ __( 'Edit', 'google-site-kit' ) }
				</Button>
			</div>

			<div className="googlesitekit-user-input__preview-answers">
				{ values
					.map( trim )
					.filter( notEmpty )
					.map( ( value ) => (
						<div
							key={ value }
							className="googlesitekit-user-input__preview-answer"
						>
							{ options[ value ] ||
								sprintf( sprintfTemplate, value ) }
						</div>
					) ) }
			</div>
		</div>
	);
}

UserInputPreviewGroup.propTypes = {
	questionNumber: PropTypes.number.isRequired,
	title: PropTypes.string.isRequired,
	edit: PropTypes.func.isRequired,
	values: PropTypes.arrayOf( PropTypes.string ).isRequired,
	options: PropTypes.shape( {} ),
};

UserInputPreviewGroup.defaultProps = {
	options: {},
};
