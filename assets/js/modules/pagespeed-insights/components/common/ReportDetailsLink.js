/**
 * Report Details Link component.
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
import { sprintf, __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { sanitizeHTML } from '../../../../util';
const { useSelect } = Data;

export default function ReportDetailsLink() {
	const referenceURL = useSelect( ( select ) => select( CORE_SITE ).getCurrentReferenceURL() );
	const pagespeedInsightsURL = useSelect( ( select ) => select( STORE_NAME ).getServiceURL( { query: { url: referenceURL } } ) );

	const footerLinkHTML = sprintf(
		/* translators: %s: link with translated service name */
		__( 'View details at %s', 'google-site-kit' ),
		`<a href="${ pagespeedInsightsURL }" class="googlesitekit-cta-link googlesitekit-cta-link--external" target="_blank" rel="noopener noreferrer">${ _x( 'PageSpeed Insights', 'Service name', 'google-site-kit' ) }</a>`
	);

	return (
		<p
			dangerouslySetInnerHTML={ sanitizeHTML(
				footerLinkHTML,
				{
					ALLOWED_TAGS: [ 'a' ],
					ALLOWED_ATTR: [ 'href', 'class', 'target', 'rel' ],
				}
			) }
		/>
	);
}
