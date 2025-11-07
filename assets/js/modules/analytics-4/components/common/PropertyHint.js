/**
 * Analytics PropertyHint component.
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import Link from '@/js/components/Link';
import StepHint from '@/js/components/setup/StepHint';

export default function PropertyHint() {
	const learnMoreLink = useSelect( ( select ) =>
		select( CORE_SITE ).getDocumentationLinkURL( 'ga4-property' )
	);

	return (
		<StepHint
			leadingText={ __(
				'What is an Analytics property?',
				'google-site-kit'
			) }
			tooltipText={ createInterpolateElement(
				__(
					'An Analytics property is a container for data collected from a website. It represents a specific website, and within a property, you can view reports, manage data collection, attribution, privacy settings, and product links. <a>Learn more</a>',
					'google-site-kit'
				),
				{
					a: (
						<Link
							href={ learnMoreLink }
							external
							hideExternalIndicator
						/>
					),
				}
			) }
		/>
	);
}
