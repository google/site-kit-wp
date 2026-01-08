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
import { createInterpolateElement } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import Link from '@/js/components/Link';
import P from '@/js/components/Typography/P';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { MODULES_PAGESPEED_INSIGHTS } from '@/js/modules/pagespeed-insights/datastore/constants';

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
		<P size="small" type="label">
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
		</P>
	);
}
