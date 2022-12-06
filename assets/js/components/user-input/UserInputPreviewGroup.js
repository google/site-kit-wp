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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_UI } from '../../googlesitekit/datastore/ui/constants';
import Link from '../Link';
import { trackEvent } from '../../util';
import useViewContext from '../../hooks/useViewContext';
import {
	USER_INPUT_CURRENTLY_EDITING_KEY,
	USER_INPUT_MAX_ANSWERS,
} from './util/constants';
import UserInputSelectOptions from './UserInputSelectOptions';
import { getErrorMessageForAnswer } from './util/validation';

const { useSelect, useDispatch } = Data;

export default function UserInputPreviewGroup( {
	slug,
	title,
	values,
	options,
	errorMessage,
	onCollapse,
} ) {
	const viewContext = useViewContext();
	const currentlyEditingSlug = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_INPUT_CURRENTLY_EDITING_KEY )
	);
	const { setValues } = useDispatch( CORE_UI );

	const isEditing = currentlyEditingSlug === slug;

	const onEditClick = () => {
		if ( ! isEditing ) {
			trackEvent( viewContext, 'question_edit', slug );
		} else {
			onCollapse();
		}

		setValues( {
			[ USER_INPUT_CURRENTLY_EDITING_KEY ]: isEditing ? undefined : slug,
		} );
	};

	const error = getErrorMessageForAnswer(
		values,
		USER_INPUT_MAX_ANSWERS[ slug ]
	);

	return (
		<div className="googlesitekit-user-input__preview-group">
			<div className="googlesitekit-user-input__preview-group-title">
				<p>{ title }</p>
				<Link
					className={ classnames( {
						'googlesitekit-user-input__preview-group-editing':
							isEditing,
					} ) }
					onClick={ onEditClick }
				>
					{ __( 'Edit', 'google-site-kit' ) }
				</Link>
			</div>

			{ ! isEditing && (
				<div className="googlesitekit-user-input__preview-answers">
					{ error && (
						<p className="googlesitekit-error-text">{ error }</p>
					) }

					{ ! error &&
						values.map( ( value ) => (
							<div
								key={ value }
								className="googlesitekit-user-input__preview-answer"
							>
								{ options[ value ] }
							</div>
						) ) }
				</div>
			) }

			{ isEditing && (
				<Fragment>
					<UserInputSelectOptions
						isActive={ true }
						slug={ slug }
						max={ USER_INPUT_MAX_ANSWERS[ slug ] }
						options={ options }
						noInstructions
					/>
					{ errorMessage && (
						<p className="googlesitekit-error-text">
							{ errorMessage }
						</p>
					) }
				</Fragment>
			) }
		</div>
	);
}

UserInputPreviewGroup.propTypes = {
	slug: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	values: PropTypes.arrayOf( PropTypes.string ).isRequired,
	options: PropTypes.shape( {} ),
	errorMessage: PropTypes.string,
	onCollapse: PropTypes.func,
};

UserInputPreviewGroup.defaultProps = {
	options: {},
};
