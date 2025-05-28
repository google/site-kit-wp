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

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { isPermissionScopeError, isErrorRetryable } from '../util/errors';
import Notice from '@/js/components/Notice';
import { isURL } from '@wordpress/url';
import { sanitizeHTML } from '@/js/util';

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

	let finalMessage = message;

	// Append "Try again" messaging if no retry button is present.
	if ( ! hasButton && ! skipRetryMessage ) {
		finalMessage = sprintf(
			/* translators: %1$s: Error message from Google API. */
			__( '%1$s%2$s Please try again.', 'google-site-kit' ),
			finalMessage,
			finalMessage.endsWith( '.' ) ? '' : '.'
		);
	}

	if ( ! noPrefix ) {
		finalMessage = sprintf(
			/* translators: $%s: Error message */
			__( 'Error: %s', 'google-site-kit' ),
			finalMessage
		);
	}

	const reconnectURL = error?.data?.reconnectURL;

	let hasReconnectLink = false;

	if ( reconnectURL && isURL( reconnectURL ) ) {
		hasReconnectLink = true;
		finalMessage = sprintf(
			/* translators: %1$s: Original error message, %2$s: Reconnect URL */
			__(
				'%1$s To fix this, <a href="%2$s">redo the plugin setup</a>.',
				'google-site-kit'
			),
			finalMessage,
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
				hasReconnectLink ? (
					<span
						dangerouslySetInnerHTML={ sanitizeHTML(
							finalMessage,
							sanitizeArgs
						) }
					/>
				) : (
					finalMessage
				)
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
