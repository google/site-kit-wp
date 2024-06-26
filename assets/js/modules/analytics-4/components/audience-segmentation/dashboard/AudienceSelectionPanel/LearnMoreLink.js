/**
 * Audience Selection Panel Learn More Link
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
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_SITE } from '../../../../../../googlesitekit/datastore/site/constants';
import Link from '../../../../../../components/Link';

export default function LearnMoreLink() {
	const audienceLearnMoreURL = useSelect( ( select ) =>
		select( CORE_SITE ).getGoogleSupportURL( {
			path: '/analytics/answer/12799087',
		} )
	);

	return (
		<div className="googlesitekit-audience-selection-panel__learn-more">
			{ createInterpolateElement(
				__(
					'Learn more about grouping site visitors and audiences in <link><strong>Analytics</strong></link>',
					'google-site-kit'
				),
				{
					link: (
						<Link
							secondary
							href={ audienceLearnMoreURL }
							external
							hideExternalIndicator
						/>
					),
					strong: <strong />,
				}
			) }
		</div>
	);
}
