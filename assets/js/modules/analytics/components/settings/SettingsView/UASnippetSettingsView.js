/**
 * UA Snippet Settings View component.
 *
 * Site Kit by Google, Copyright 2023 Google LLC
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
import Data from 'googlesitekit-data';
import { MODULES_ANALYTICS } from '../../../datastore/constants';
const { useSelect } = Data;

export default function UASnippetSettingsView() {
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const canUseSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getCanUseSnippet()
	);
	const hasExistingTag = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).hasExistingTag()
	);

	return (
		<div className="googlesitekit-settings-module__meta-items">
			<div className="googlesitekit-settings-module__meta-item">
				<h5 className="googlesitekit-settings-module__meta-item-type">
					{ __(
						'Universal Analytics Code Snippet',
						'google-site-kit'
					) }
				</h5>
				<p className="googlesitekit-settings-module__meta-item-data">
					{ canUseSnippet === false && (
						<span>
							{ __(
								'The code is controlled by the Tag Manager module',
								'google-site-kit'
							) }
						</span>
					) }
					{ canUseSnippet && useSnippet && (
						<span>
							{ __( 'Snippet is inserted', 'google-site-kit' ) }
						</span>
					) }
					{ canUseSnippet && ! useSnippet && ! hasExistingTag && (
						<span>
							{ __(
								'Snippet is not inserted',
								'google-site-kit'
							) }
						</span>
					) }
					{ canUseSnippet && ! useSnippet && hasExistingTag && (
						<span>
							{ __(
								'Inserted by another plugin or theme',
								'google-site-kit'
							) }
						</span>
					) }
				</p>
			</div>
		</div>
	);
}
