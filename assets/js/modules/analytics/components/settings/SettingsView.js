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
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/display-setting';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { trackingExclusionLabels } from '../common/TrackingExclusionSwitches';
import { ExistingTagError, ExistingTagNotice } from '../common';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import Link from '../../../../components/Link';
const { useSelect } = Data;

export default function SettingsView() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const propertyID = useSelect( ( select ) => select( STORE_NAME ).getPropertyID() );
	const internalWebPropertyID = useSelect( ( select ) => select( STORE_NAME ).getInternalWebPropertyID() );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );
	const useSnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const anonymizeIP = useSelect( ( select ) => select( STORE_NAME ).getAnonymizeIP() );
	const trackingDisabled = useSelect( ( select ) => select( STORE_NAME ).getTrackingDisabled() ) || [];
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const hasExistingTagPermission = useSelect( ( select ) => select( STORE_NAME ).hasExistingTagPermission() );
	const ampMode = useSelect( ( select ) => select( CORE_SITE ).getAMPMode() );
	const editViewSettingsURL = useSelect( ( select ) => select( STORE_NAME ).getServiceURL(
		{
			path: `/a${ accountID }w${ internalWebPropertyID }p${ profileID }/admin/view/settings`,
		}
	) );

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--analytics">

			{ /* Prevent showing ExistingTagError and general error notice at the same time. */ }
			{ ( ! hasExistingTag || hasExistingTagPermission ) && <StoreErrorNotices moduleSlug="analytics" storeName={ STORE_NAME } /> }
			{ ( hasExistingTag && ! hasExistingTagPermission && hasExistingTagPermission !== undefined ) && <ExistingTagError /> }
			{ ( hasExistingTag && hasExistingTagPermission && hasExistingTagPermission !== undefined ) && <ExistingTagNotice /> }

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Account', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ accountID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Property', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ propertyID } />
					</p>
				</div>
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'View', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ profileID } />
					</p>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<Link
						href={ editViewSettingsURL }
						external
					>
						{ __( 'You can make changes to this view (e.g. exclude URL query parameters) in Google Analytics', 'google-site-kit' ) }
					</Link>
				</div>
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Analytics Code Snippet', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ useSnippet && __( 'Snippet is inserted', 'google-site-kit' ) }
						{ ( ! useSnippet && ! hasExistingTag ) && __( 'Snippet is not inserted', 'google-site-kit' ) }
						{ ( ! useSnippet && hasExistingTag ) && __( 'Inserted by another plugin or theme', 'google-site-kit' ) }
					</p>
				</div>
			</div>

			{ ( useSnippet && ampMode !== 'primary' ) && (
				<div className="googlesitekit-settings-module__meta-items">
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __( 'IP Address Anonymization', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							{ anonymizeIP && __( 'IP addresses are being anonymized', 'google-site-kit' ) }
							{ ! anonymizeIP && __( 'IP addresses are not being anonymized', 'google-site-kit' ) }
						</p>
					</div>
				</div>
			) }

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Excluded from Analytics', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						{ !! trackingDisabled.length &&
										trackingDisabled
											.map( ( exclusion ) => trackingExclusionLabels[ exclusion ] )
											.join( _x( ', ', 'list separator', 'google-site-kit' ) )
						}
						{ ! trackingDisabled.length && __( 'Analytics is currently enabled for all visitors.', 'google-site-kit' ) }
					</p>
				</div>
			</div>
		</div>
	);
}
