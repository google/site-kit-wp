/**
 * Audience Segmentation Get Help Link component.
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
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '../../../../../components/Link';

export default function GetHelpLink( { linkURL } ) {
	return createInterpolateElement(
		__(
			'Contact your administrator. Trouble getting access? <HelpLink />',
			'google-site-kit'
		),
		{
			HelpLink: (
				<Link href={ linkURL } external hideExternalIndicator>
					{ __( 'Get help', 'google-site-kit' ) }
				</Link>
			),
		}
	);
}

GetHelpLink.propTypes = {
	linkURL: PropTypes.string.isRequired,
};
