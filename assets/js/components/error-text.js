/**
 * Error Text component.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import { sprintf, __ } from '@wordpress/i18n';

function ErrorText( { message, reconnectURL } ) {
	if ( ! message ) {
		return null;
	}

	let error = sprintf(
		/* translators: %s: Error message */
		__( 'Error: %s', 'google-site-kit' ),
		message
	);

	try {
		if ( reconnectURL ) {
			// reconnectURL must be a valid URI, if it is not, "new URL" will
			// trigger an error and we jump over "error" variable change
			new URL( reconnectURL );

			error = error + ' ' + sprintf(
				/* translators: %s: Reconnect URL */
				__( 'To fix this, <a href="%s">redo the plugin setup</a>.', 'google-site-kit' ),
				reconnectURL
			);
		}
	} catch ( err ) {
		// do nothing
	}

	return (
		<div className="googlesitekit-error-text">
			<p dangerouslySetInnerHTML={ { __html: error } } />
		</div>
	);
}

ErrorText.propTypes = {
	message: PropTypes.string.isRequired,
	reconnectURL: PropTypes.string,
};

ErrorText.defaultProps = {
	reconnectURL: '',
};

export default ErrorText;
