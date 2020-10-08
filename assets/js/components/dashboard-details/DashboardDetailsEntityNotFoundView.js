/**
 * DashboardDetailsEntityNotFoundView component.
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
import { __, sprintf } from '@wordpress/i18n';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { sanitizeHTML } from '../../util';
import DashboardDetailsEntityHeaderContainer from './DashboardDetailsEntityHeaderContainer';

export default function DashboardDetailsEntityNotFoundView( { permalink } ) {
	const currentEntityURL = permalink || getQueryArg( global.location.href, 'permaLink' );

	const message = sprintf(
		/* translators: %s: current entity URL */
		__( 'It looks like the URL %s is not part of this site, therefore there is no data available to display.', 'google-site-kit' ),
		`<strong>${ currentEntityURL }</strong>`
	);

	const sanitizeArgs = {
		ALLOWED_TAGS: [ 'strong' ],
		ALLOWED_ATTR: [],
	};

	return (
		<DashboardDetailsEntityHeaderContainer>
			<p dangerouslySetInnerHTML={ sanitizeHTML( message, sanitizeArgs ) } />
		</DashboardDetailsEntityHeaderContainer>
	);
}

DashboardDetailsEntityNotFoundView.propTypes = {
	permalink: PropTypes.string,
};
