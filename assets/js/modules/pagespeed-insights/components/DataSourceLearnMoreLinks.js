/**
 * Data Source Learn More Link components.
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
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Link from '../../../components/link';
import { sanitizeHTML } from '../../../util';

function DataSourceLearnMoreLink( { href, html } ) {
	return (
		<Link
			href={ href }
			external
			inherit
			dangerouslySetInnerHTML={ sanitizeHTML(
				html,
				{
					ALLOWED_TAGS: [ 'span' ],
					ALLOWED_ATTR: [ 'class' ],
				}
			) }
		/>
	);
}

export function FieldDataLearnMoreLink() {
	return (
		<DataSourceLearnMoreLink
			href="https://web.dev/user-centric-performance-metrics/#in-the-field"
			html={ __( 'Learn more<span class="screen-reader-text"> about field data.</span>', 'google-site-kit' ) }
		/>
	);
}

export function LabDataLearnMoreLink() {
	return (
		<DataSourceLearnMoreLink
			href="https://web.dev/user-centric-performance-metrics/#in-the-lab"
			html={ __( 'Learn more<span class="screen-reader-text"> about lab data.</span>', 'google-site-kit' ) }
		/>
	);
}
