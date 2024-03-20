/**
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Internal dependencies
 */
import Button from './Button';
import CircularProgress from './CircularProgress';

export const SPINNER_POSITION = {
	BEFORE: 'before',
	AFTER: 'after',
};
export default function SpinnerButton( props ) {
	const {
		className,
		onClick = () => {},
		isSaving = false,
		spinnerPosition = SPINNER_POSITION.AFTER,
		...restProps
	} = props;

	return (
		<Button
			className={ classnames(
				className,
				'googlesitekit-button-icon--spinner',
				{
					'googlesitekit-button-icon--spinner__running': isSaving,
					'googlesitekit-button-icon--spinner__before':
						spinnerPosition === SPINNER_POSITION.BEFORE,
					'googlesitekit-button-icon--spinner__after':
						spinnerPosition === SPINNER_POSITION.AFTER,
				}
			) }
			icon={
				isSaving && spinnerPosition === SPINNER_POSITION.BEFORE ? (
					<CircularProgress size={ 14 } />
				) : undefined
			}
			trailingIcon={
				isSaving && spinnerPosition === SPINNER_POSITION.AFTER ? (
					<CircularProgress size={ 14 } />
				) : undefined
			}
			onClick={ onClick }
			{ ...restProps }
		/>
	);
}

SpinnerButton.propTypes = {
	className: PropTypes.string,
	onClick: PropTypes.func,
	isSaving: PropTypes.bool,
	spinnerPosition: PropTypes.oneOf( Object.values( SPINNER_POSITION ) ),
};
