/**
 * Report Details Link component.
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
 * WordPress dependencies
 */
import { sprintf, __, _x } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { MODULES_PAGESPEED_INSIGHTS } from '../../datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import Link from '../../../../components/Link';

export default function ReportDetailsLink() {
	const referenceURL = useSelect( ( select ) =>
		select( CORE_SITE ).getCurrentReferenceURL()
	);
	const pagespeedInsightsURL = useSelect( ( select ) =>
		select( MODULES_PAGESPEED_INSIGHTS ).getServiceURL( {
			path: 'report',
			query: { url: referenceURL },
		} )
	);

	return (
		<p>
			{ createInterpolateElement(
				sprintf(
					/* translators: %s: link with translated service name */
					__( 'View details at %s', 'google-site-kit' ),
					`<a>${ _x(
						'PageSpeed Insights',
						'Service name',
						'google-site-kit'
					) }</a>`
				),
				{
					a: <Link href={ pagespeedInsightsURL } external />,
				}
			) }
		</p>
	);
}
