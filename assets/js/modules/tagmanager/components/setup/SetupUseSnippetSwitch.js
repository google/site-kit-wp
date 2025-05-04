/**
 * Tag Manager Setup Use Snippet Switch component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import UseSnippetSwitch from '../common/UseSnippetSwitch';

export default function SetupUseSnippetSwitch() {
	const primaryContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getPrimaryContainerID()
	);

	const existingTag = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getExistingTag()
	);

	const description =
		primaryContainerID === existingTag ? (
			<Fragment>
				<p>
					{ sprintf(
						/* translators: %s: existing tag ID */
						__(
							'A tag %s for the selected container already exists on the site',
							'google-site-kit'
						),
						existingTag
					) }
				</p>
				<p>
					{ __(
						'Make sure you remove it if you want to place the same tag via Site Kit, otherwise they will be duplicated',
						'google-site-kit'
					) }
				</p>
			</Fragment>
		) : (
			<Fragment>
				<p>
					{ sprintf(
						/* translators: %s: existing tag ID */
						__(
							'An existing tag %s was found on the page',
							'google-site-kit'
						),
						existingTag
					) }
				</p>
				<p>
					{ __(
						'If you prefer to collect data using that existing tag, please select the corresponding account and property above',
						'google-site-kit'
					) }
				</p>
			</Fragment>
		);

	return <UseSnippetSwitch description={ description } />;
}
