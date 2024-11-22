/**
 * Audience Selection Panel Request Access Button
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Button } from 'googlesitekit-components';
import { trackEvent } from '../../../../../../util';
import useViewContext from '../../../../../../hooks/useViewContext';

export default function RequestAccessButton( { requestAccessURL } ) {
	const viewContext = useViewContext();

	return (
		<Button
			className="googlesitekit-audience-selection-panel__error-notice-action"
			tertiary
			href={ requestAccessURL }
			target="_blank"
			onClick={ () => {
				trackEvent(
					`${ viewContext }_audiences-sidebar`,
					'insufficient_permissions_error_request_access'
				);
			} }
		>
			{ __( 'Request access', 'google-site-kit' ) }
		</Button>
	);
}

RequestAccessButton.propTypes = {
	requestAccessURL: PropTypes.string.isRequired,
};
