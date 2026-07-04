/**
 * InviteSearchInput component.
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
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VisuallyHidden from '@/js/components/VisuallyHidden';
import CloseIcon from '@/svg/icons/close.svg';

export default function InviteSearchInput( { value = '', onChange } ) {
	const instanceID = useInstanceId( InviteSearchInput, 'InviteSearchInput' );

	const handleChange = useCallback(
		( event ) => onChange( event.target.value ),
		[ onChange ]
	);

	const handleClear = useCallback( () => {
		onChange( '' );
	}, [ onChange ] );

	return (
		<div className="googlesitekit-invite-search-input">
			<VisuallyHidden>
				<label htmlFor={ instanceID }>
					{ __(
						'Search user name, role, or email',
						'google-site-kit'
					) }
				</label>
			</VisuallyHidden>
			<input
				id={ instanceID }
				type="text"
				className="googlesitekit-invite-search-input__input"
				placeholder={ __(
					'Search user name, role, or email',
					'google-site-kit'
				) }
				value={ value }
				onChange={ handleChange }
			/>
			{ value && (
				<span
					className="googlesitekit-invite-search-input__clear"
					onClick={ handleClear }
					onKeyDown={ ( event ) => {
						if ( event.key === 'Enter' || event.key === ' ' ) {
							event.preventDefault();
							handleClear();
						}
					} }
					role="button"
					tabIndex={ 0 }
					aria-label={ __( 'Clear search', 'google-site-kit' ) }
				>
					<CloseIcon width="8" height="8" />
				</span>
			) }
		</div>
	);
}

InviteSearchInput.propTypes = {
	value: PropTypes.string,
	onChange: PropTypes.func.isRequired,
};
