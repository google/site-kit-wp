/**
 * ReportErrorButton component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import copyToClipboard from 'clipboard-copy';
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, check, copy } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';

function ReportErrorButton( { message, componentStack } ) {
	const [ copied, setCopied ] = useState( false );

	const onErrorClick = () => {
		// Copy message with wrapping backticks for code block formatting on wp.org.
		copyToClipboard( `\`${ message }\n${ componentStack }\`` );

		setCopied( true );
	};

	return (
		<Button
			aria-label={
				copied
					? __(
							'Error message copied to clipboard. Click to copy the error message again.',
							'google-site-kit'
					  )
					: undefined
			}
			onClick={ onErrorClick }
			trailingIcon={
				<Icon
					className="mdc-button__icon"
					icon={ copied ? check : copy }
				/>
			}
		>
			{ copied
				? __( 'Copied to clipboard', 'google-site-kit' )
				: __( 'Copy error contents', 'google-site-kit' ) }
		</Button>
	);
}

ReportErrorButton.propTypes = {
	message: PropTypes.string,
	componentStack: PropTypes.string,
};

export default ReportErrorButton;
