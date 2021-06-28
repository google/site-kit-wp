/**
 * Idea Hub Settings View component
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
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { STORE_NAME } from '../../datastore/constants';
import Link from '../../../../components/Link';
const { useSelect } = Data;

export default function SettingsView() {
	const dashboardPermalink = useSelect( ( select ) => select( STORE_NAME ).getAdminScreenURL() );

	return (
		createInterpolateElement(
			/* translators: %s is the URL to the Site Kit dashboard. */
			__( 'To view ideas for new content, <a>visit the dashboard</a>', 'google-site-kit' ),
			{
				a: <Link href={ dashboardPermalink } inherit />,
			}
		)
	);
}
