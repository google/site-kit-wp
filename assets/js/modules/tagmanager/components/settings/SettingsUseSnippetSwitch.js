/**
 * Tag Manager Settings Use Snippet Switch component.
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
import UseSnippetSwitch from '../common/UseSnippetSwitch';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import Typography from '../../../../components/Typography';

export default function SettingsUseSnippetSwitch() {
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getUseSnippet()
	);

	const primaryContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getPrimaryContainerID()
	);

	const existingTag = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getExistingTag()
	);

	let description;

	if ( existingTag ) {
		description =
			primaryContainerID === existingTag ? (
				<Fragment>
					<Typography as="p" type="body" size="medium">
						{ sprintf(
							/* translators: %s: existing tag ID */
							__(
								'A tag %s for the selected container already exists on the site',
								'google-site-kit'
							),
							existingTag
						) }
					</Typography>
					<Typography as="p" type="body" size="medium">
						{ __(
							'Consider removing the existing tag to avoid loading both tags on your site',
							'google-site-kit'
						) }
					</Typography>
				</Fragment>
			) : (
				<Fragment>
					<Typography as="p" type="body" size="medium">
						{ sprintf(
							/* translators: %s: existing tag ID */
							__(
								'An existing tag %s was found on the page',
								'google-site-kit'
							),
							existingTag
						) }
					</Typography>
					<Typography as="p" type="body" size="medium">
						{ __(
							'If you prefer to collect data using that existing tag, please select the corresponding account and property above',
							'google-site-kit'
						) }
					</Typography>
				</Fragment>
			);
	} else {
		description = useSnippet ? (
			<Typography as="p" type="body" size="medium">
				{ __(
					'Site Kit will add the code automatically',
					'google-site-kit'
				) }
			</Typography>
		) : (
			<Typography as="p" type="body" size="medium">
				{ __(
					'Site Kit will not add the code to your site',
					'google-site-kit'
				) }
			</Typography>
		);
	}

	return <UseSnippetSwitch description={ description } />;
}
