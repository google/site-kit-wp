/**
 * Analytics Settings View component.
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
import { useSelect } from '@wordpress/data';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../datastore';
// import { STORE_NAME as CORE_SITE } from '../../../googlesitekit/datastore/site';
import { trackingExclusionLabels } from '../common/tracking-exclusion-switches';

export default function SettingsView() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );
	const useSnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const anonymizeIP = useSelect( ( select ) => select( STORE_NAME ).getAnonymizeIP() );
	const trackingDisabled = useSelect( ( select ) => select( STORE_NAME ).getTrackingDisabled() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );

	// TODO: use selector once available.
	const ampMode = /* useSelect( ( select ) => select( CORE_SITE ).getAmpMode() ) */ false;

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<p className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Account', 'google-site-kit' ) }
					</p>
					<h5 className="googlesitekit-settings-module__meta-item-data">
						{ accountID || null }
					</h5>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<p className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Property', 'google-site-kit' ) }
					</p>
					<h5 className="googlesitekit-settings-module__meta-item-data">
						{ propertyID || null }
					</h5>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<p className="googlesitekit-settings-module__meta-item-type">
						{ __( 'View', 'google-site-kit' ) }
					</p>
					<h5 className="googlesitekit-settings-module__meta-item-data">
						{ profileID || null }
					</h5>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<p className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Analytics Code Snippet', 'google-site-kit' ) }
					</p>
					<h5 className="googlesitekit-settings-module__meta-item-data">
						{ hasExistingTag && __( 'Inserted by another plugin or theme', 'google-site-kit' ) }
						{ ( ! hasExistingTag && useSnippet ) && __( 'Snippet is inserted', 'google-site-kit' ) }
						{ ( ! hasExistingTag && ! useSnippet ) && __( 'Snippet is not inserted', 'google-site-kit' ) }
					</h5>
				</div>
			</div>

			{ useSnippet && ampMode !== 'primary' && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<p className="googlesitekit-settings-module__meta-item-type">
							{ __( 'IP Address Anonymization', 'google-site-kit' ) }
						</p>
						<h5 className="googlesitekit-settings-module__meta-item-data">
							{ anonymizeIP && __( 'IP addresses are being anonymized.', 'google-site-kit' ) }
							{ ! anonymizeIP && __( 'IP addresses are not being anonymized.', 'google-site-kit' ) }
						</h5>
					</div>
				</div>
			) }

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<p className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Excluded from Analytics', 'google-site-kit' ) }
					</p>
					<h5 className="googlesitekit-settings-module__meta-item-data">
						{ !! trackingDisabled.length &&
										trackingDisabled
											.map( ( exclusion ) => trackingExclusionLabels[ exclusion ] )
											.join( _x( ', ', 'list separator', 'google-site-kit' ) )
						}
						{ ! trackingDisabled.length && __( 'Analytics is currently enabled for all visitors.', 'google-site-kit' ) }
					</h5>
				</div>
			</div>
		</div>
	);
}
