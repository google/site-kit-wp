/**
 * AdSense AdBlockerWarning component.
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
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { sprintf, __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import ErrorIcon from '../../../../../svg/icons/error.svg';
import Link from '../../../../components/Link';

import { MODULES_ADSENSE } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function AdBlockerWarning( { context } ) {
	const adBlockerWarningMessage = useSelect( ( select ) =>
		select( MODULES_ADSENSE ).getAdBlockerWarningMessage()
	);
	const getHelpLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ad-blocker-detected' )
	);

	// Return nothing if loading or if everything is fine.
	if ( ! adBlockerWarningMessage ) {
		return null;
	}

	return (
		<div
			className={ classnames( 'googlesitekit-settings-module-warning', {
				[ `googlesitekit-settings-module-warning--${ context }` ]:
					context,
			} ) }
		>
			{ createInterpolateElement(
				sprintf(
					/* translators: 1: The warning message. 2: "Get help" text. */
					__(
						'<ErrorIcon /> %1$s. <Link>%2$s</Link>',
						'google-site-kit'
					),
					adBlockerWarningMessage,
					__( 'Get help', 'google-site-kit' )
				),
				{
					ErrorIcon: <ErrorIcon height="20" width="23" />,
					Link: <Link href={ getHelpLink } external />,
				}
			) }
		</div>
	);
}

AdBlockerWarning.propTypes = {
	context: PropTypes.string,
};

AdBlockerWarning.defaultProps = {
	context: '',
};
