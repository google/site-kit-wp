/**
 * IP Anonymization Settings View component.
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
import { CORE_SITE } from '../../../../../googlesitekit/datastore/site/constants';
import { MODULES_ANALYTICS } from '../../../datastore/constants';
const { useSelect } = Data;

export default function IPAnonymizationSettingsView() {
	const useSnippet = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getUseSnippet()
	);
	const anonymizeIP = useSelect( ( select ) =>
		select( MODULES_ANALYTICS ).getAnonymizeIP()
	);

	const ampMode = useSelect( ( select ) => select( CORE_SITE ).getAMPMode() );

	if ( ! useSnippet ) {
		return null;
	}

	if ( ampMode === 'primary' ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-module__meta-items">
			<div className="googlesitekit-settings-module__meta-item">
				<h5 className="googlesitekit-settings-module__meta-item-type">
					{ __( 'IP Address Anonymization', 'google-site-kit' ) }
				</h5>
				<p className="googlesitekit-settings-module__meta-item-data">
					{ anonymizeIP && (
						<span>
							{ __(
								'IP addresses are being anonymized',
								'google-site-kit'
							) }
						</span>
					) }
					{ ! anonymizeIP && (
						<span>
							{ __(
								'IP addresses are not being anonymized',
								'google-site-kit'
							) }
						</span>
					) }
				</p>
			</div>
		</div>
	);
}
