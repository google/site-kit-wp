/**
 * ErrorNotice component.
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
import { Fragment, useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import { isPermissionScopeError, isErrorRetryable } from '../util/errors';
import ErrorText from './ErrorText';

export default function ErrorNotice( {
	error,
	hasButton = false,
	storeName,
	message = error.message,
	noPrefix = false,
	skipRetryMessage,
	Icon,
} ) {
	const dispatch = useDispatch();

	const selectorData = useSelect( ( select ) => {
		if ( ! storeName ) {
			return null;
		}

		return select( storeName ).getSelectorDataForError( error );
	} );

	const handleRetry = useCallback( () => {
		dispatch( selectorData.storeName ).invalidateResolution(
			selectorData.name,
			selectorData.args
		);
	}, [ dispatch, selectorData ] );

	// Do not display if there is no error, or if the error is for missing scopes.
	if ( ! error || isPermissionScopeError( error ) ) {
		return null;
	}

	const shouldDisplayRetry =
		hasButton && isErrorRetryable( error, selectorData );

	// Append "Try again" messaging if no retry button is present.
	if ( ! hasButton && ! skipRetryMessage ) {
		message = sprintf(
			/* translators: %s: Error message from Google API. */
			__( '%s. Please try again.', 'google-site-kit' ),
			message
		);
	}

	return (
		<Fragment>
			{ Icon && (
				<div className="googlesitekit-error-notice__icon">
					<Icon width="24" height="24" />
				</div>
			) }
			<ErrorText
				message={ message }
				reconnectURL={ error.data?.reconnectURL }
				noPrefix={ noPrefix }
			/>
			{ shouldDisplayRetry && (
				<Button
					className="googlesitekit-error-notice__retry-button"
					onClick={ handleRetry }
				>
					{ __( 'Retry', 'google-site-kit' ) }
				</Button>
			) }
		</Fragment>
	);
}

ErrorNotice.propTypes = {
	error: PropTypes.shape( {
		message: PropTypes.string,
	} ),
	hasButton: PropTypes.bool,
	storeName: PropTypes.string,
	message: PropTypes.string,
	noPrefix: PropTypes.bool,
	skipRetryMessage: PropTypes.bool,
	Icon: PropTypes.elementType,
};
