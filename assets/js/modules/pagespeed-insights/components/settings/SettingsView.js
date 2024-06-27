/**
 * PageSpeed Insights Settings View component
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
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { sanitizeHTML } from '../../../../util';
import { MODULES_PAGESPEED_INSIGHTS } from '../../datastore/constants';

export default function SettingsView() {
	const dashboardPermalink = useSelect( ( select ) =>
		select( MODULES_PAGESPEED_INSIGHTS ).getAdminScreenURL()
	);

	const content = sprintf(
		/* translators: %s: is the URL to the Site Kit dashboard. */
		__(
			'To view insights, <a href="%s">visit the dashboard</a>',
			'google-site-kit'
		),
		`${ dashboardPermalink }#speed`
	);

	return (
		<p
			dangerouslySetInnerHTML={ sanitizeHTML( content, {
				ALLOWED_TAGS: [ 'a' ],
				ALLOWED_ATTR: [ 'href' ],
			} ) }
		/>
	);
}
