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
import WarningNotice from '../WarningNotice';
import ExternalIcon from '../../../svg/icons/external-rounded.svg';

export default function AdBlockerWarningMessage( {
	getHelpLink = '',
	warningMessage = null,
} ) {
	if ( ! warningMessage ) {
		return null;
	}

	return (
		<WarningNotice>
			{ createInterpolateElement(
				sprintf(
					/* translators: 1: The warning message. 2: "Get help" text. */
					__( '%1$s. <Link>%2$s</Link>', 'google-site-kit' ),
					warningMessage,
					__( 'Get help', 'google-site-kit' )
				),
				{
					Link: (
						<Link
							href={ getHelpLink }
							external
							hideExternalIndicator
							trailingIcon={
								<ExternalIcon width={ 13 } height={ 14 } />
							}
						/>
					),
				}
			) }
		</WarningNotice>
	);
}

AdBlockerWarningMessage.propTypes = {
	getHelpLink: PropTypes.string,
	warningMessage: PropTypes.string,
};
