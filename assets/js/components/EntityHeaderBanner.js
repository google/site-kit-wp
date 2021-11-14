/**
 * EntityHeaderBanner component.
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
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ViewContextContext from './Root/ViewContextContext';
import { VIEW_CONTEXT_DASHBOARD } from '../googlesitekit/constants';

const EntityHeaderBanner = () => {
	const viewContext = useContext( ViewContextContext );
	if ( VIEW_CONTEXT_DASHBOARD !== viewContext ) {
		return null;
	}

	const pageTitle = 'Everything you need to know about driving in Ireland.'; // @TODO.

	const label = sprintf(
		/* translators: %s: page title of the page whose stats we're showing */
		__(
			'<strong>Detailed page stats for:</strong> "%s"',
			'google-site-kit'
		),
		pageTitle
	);

	return label;
};

export default EntityHeaderBanner;
