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
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { isURL } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { isPermissionScopeError, isErrorRetryable } from '../util/errors';
import Notice from './Notice';
import { sanitizeHTML } from '../util';

export default function ErrorNotice( {
	className,
	error,
	hasButton = false,
	storeName,
	message = error.message,
	noPrefix = false,
	skipRetryMessage,
	hideIcon = false,
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
	// This only applies when no message prop is directly passed.
	if ( ! message && ( ! error || isPermissionScopeError( error ) ) ) {
		return null;
	}

	const shouldDisplayRetry =
		hasButton && isErrorRetryable( error, selectorData );

	/**
	 * Error message to display to the user. Sometimes we append a retry message
	 * or a reconnect URL, so we create a new variable for the message to display.
	 */
	let errorMessageWithModifications = message;

	// Append "Try again" messaging if no retry button is present.
	if ( ! hasButton && ! skipRetryMessage ) {
		errorMessageWithModifications = sprintf(
			/* translators: %s: Error message from Google API. */
			__( '%s (Please try again.)', 'google-site-kit' ),
			errorMessageWithModifications
		);
	}

	if ( ! noPrefix ) {
		errorMessageWithModifications = sprintf(
			/* translators: $%s: Error message */
			__( 'Error: %s', 'google-site-kit' ),
			errorMessageWithModifications
		);
	}

	const reconnectURL = error?.data?.reconnectURL;

	if ( reconnectURL && isURL( reconnectURL ) ) {
		errorMessageWithModifications =
			errorMessageWithModifications +
			' ' +
			sprintf(
				/* translators: %s: Reconnect URL */
				__(
					'To fix this, <a href="%s">redo the plugin setup</a>.',
					'google-site-kit'
				),
				reconnectURL
			);
	}

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'a' ],
		ALLOWED_ATTR: [ 'href' ],
	};

	return (
		<Notice
			className={ className }
			type={ Notice.TYPES.ERROR }
			description={
				<span
					dangerouslySetInnerHTML={ sanitizeHTML(
						errorMessageWithModifications,
						sanitizeArgs
					) }
				/>
			}
			ctaButton={
				shouldDisplayRetry
					? {
							label: __( 'Retry', 'google-site-kit' ),
							onClick: handleRetry,
					  }
					: undefined
			}
			hideIcon={ hideIcon }
		/>
	);
}

ErrorNotice.propTypes = {
	className: PropTypes.string,
	error: PropTypes.shape( {
		message: PropTypes.string,
	} ),
	hasButton: PropTypes.bool,
	storeName: PropTypes.string,
	message: PropTypes.string,
	noPrefix: PropTypes.bool,
	skipRetryMessage: PropTypes.bool,
	hideIcon: PropTypes.bool,
};
