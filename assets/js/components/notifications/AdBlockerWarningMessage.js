/**
 * AdBlockerWarningMessage component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Link from '../Link';
import ExternalIcon from '../../../svg/icons/external-rounded.svg';
import Notice from '../Notice';

export default function AdBlockerWarningMessage( {
	getHelpLink = '',
	warningMessage = null,
} ) {
	if ( ! warningMessage ) {
		return null;
	}

	return (
		<Notice
			className="googlesitekit-notice--small"
			type={ Notice.TYPES.WARNING }
			description={ createInterpolateElement(
				sprintf(
					/* translators: 1: The warning message. 2: "Get help" text. */
					__(
						'%1$s. <Link><Strong>%2$s</Strong></Link>',
						'google-site-kit'
					),
					warningMessage,
					__( 'Get help', 'google-site-kit' )
				),
				{
					Link: (
						<Link
							href={ getHelpLink }
							trailingIcon={
								<ExternalIcon width={ 15 } height={ 15 } />
							}
							external
							hideExternalIndicator
						/>
					),
					Strong: <strong />,
				}
			) }
			hideIcon
		/>
	);
}

AdBlockerWarningMessage.propTypes = {
	getHelpLink: PropTypes.string,
	warningMessage: PropTypes.string,
};
