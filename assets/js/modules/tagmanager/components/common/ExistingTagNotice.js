/**
 * Tag Manager Existing Tag Notice component.
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
import { sprintf, __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
const { useSelect } = Data;

export default function ExistingTagNotice() {
	const containerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getExistingTag()
	);

	if ( ! containerID ) {
		return null;
	}

	return (
		<p>
			{ sprintf(
				// translators: %s: the existing container ID.
				__(
					'An existing tag was found on your site (%s). If you later decide to replace this tag, Site Kit can place the new tag for you. Make sure you remove the old tag first.',
					'google-site-kit'
				),
				containerID
			) }
		</p>
	);
}
