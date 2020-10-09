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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { sanitizeHTML } from '../../util';
import DashboardDetailsEntityHeaderContainer from './DashboardDetailsEntityHeaderContainer';
import { STORE_NAME as CORE_SITE } from '../../googlesitekit/datastore/site/constants';
const { useSelect } = Data;

export default function DashboardDetailsEntityNotFoundView() {
	const permaLink = useSelect( ( select ) => select( CORE_SITE ).getPermaLinkParam() );

	const message = sprintf(
		/* translators: %s: current entity URL */
		__( 'It looks like the URL %s is not part of this site, therefore there is no data available to display.', 'google-site-kit' ),
		`<strong>${ permaLink }</strong>`
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
