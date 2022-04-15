/**
 * Tag Manager Use Snippet Switch component.
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
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_TAGMANAGER } from '../../datastore/constants';
import Switch from '../../../../components/Switch';
const { useSelect, useDispatch } = Data;

export default function UseSnippetSwitch() {
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getUseSnippet()
	);

	const primaryContainerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getPrimaryContainerID()
	);

	const containerID = useSelect( ( select ) =>
		select( MODULES_TAGMANAGER ).getExistingTag()
	);

	const { setUseSnippet } = useDispatch( MODULES_TAGMANAGER );
	const onChange = useCallback( () => {
		setUseSnippet( ! useSnippet );
	}, [ useSnippet, setUseSnippet ] );

	if ( useSnippet === undefined ) {
		return null;
	}

	return (
		<div className="googlesitekit-tagmanager-usesnippet">
			<Switch
				label={ __(
					'Let Site Kit place code on your site',
					'google-site-kit'
				) }
				checked={ useSnippet }
				onClick={ onChange }
				hideLabel={ false }
			/>
			<p>
				{ primaryContainerID === containerID
					? sprintf(
							/* translators: %s: existing tag ID */
							__(
								'A tag %s for the selected container already exists on the site. Make sure you remove it if you want to place the same tag via Site Kit, otherwise they will be duplicated.',
								'google-site-kit'
							),
							containerID
					  )
					: sprintf(
							/* translators: %s: existing tag ID */
							__(
								'An existing tag %s was found on the page. If you prefer to collect data using that existing tag, please select the corresponding account and property above.',
								'google-site-kit'
							),
							containerID
					  ) }
			</p>
		</div>
	);
}
