/**
 * Error Text component.
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
import { isURL } from '@wordpress/url';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { sanitizeHTML } from '../util';

function ErrorText( { message, reconnectURL, noPrefix = false } ) {
	if ( ! message ) {
		return null;
	}

	let error = message;

	if ( ! noPrefix ) {
		error = sprintf(
			/* translators: %s: Error message */
			__( 'Error: %s', 'google-site-kit' ),
			message
		);
	}

	if ( reconnectURL && isURL( reconnectURL ) ) {
		error =
			error +
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
		<div className="googlesitekit-error-text">
			<p
				dangerouslySetInnerHTML={ sanitizeHTML( error, sanitizeArgs ) }
			/>
		</div>
	);
}

ErrorText.propTypes = {
	message: PropTypes.string.isRequired,
	reconnectURL: PropTypes.string,
	noPrefix: PropTypes.bool,
};

ErrorText.defaultProps = {
	reconnectURL: '',
	noPrefix: false,
};

export default ErrorText;
