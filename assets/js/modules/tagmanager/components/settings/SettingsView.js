/**
 * Tag Manager Settings View component.
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
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import DisplaySetting from '../../../../components/display-setting';
import { STORE_NAME as CORE_SITE } from '../../../../googlesitekit/datastore/site';
import { STORE_NAME } from '../../datastore';
import {
	ExistingTagError,
	ExistingTagNotice,
} from '../common';
import StoreErrorNotice from '../../../../components/StoreErrorNotice';
const { useSelect } = Data;

export default function SettingsView() {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const containerID = useSelect( ( select ) => select( STORE_NAME ).getContainerID() );
	const ampContainerID = useSelect( ( select ) => select( STORE_NAME ).getAMPContainerID() );
	const useSnippet = useSelect( ( select ) => select( STORE_NAME ).getUseSnippet() );
	const hasExistingTag = useSelect( ( select ) => select( STORE_NAME ).hasExistingTag() );
	const hasExistingTagPermission = useSelect( ( select ) => select( STORE_NAME ).hasExistingTagPermission() );
	const isAMP = useSelect( ( select ) => select( CORE_SITE ).isAMP() );
	const isSecondaryAMP = useSelect( ( select ) => select( CORE_SITE ).isSecondaryAMP() );

	return (
		<Fragment>

			{ /* Prevent showing ExistingTagError and general error notice at the same time. */ }
			{ ( ! hasExistingTag || hasExistingTagPermission ) && <StoreErrorNotice module="tagmanager" moduleName={ _x( 'Tag Manager', 'Service name', 'google-site-kit' ) } storeName={ STORE_NAME } /> }
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

				{ ( ! isAMP || isSecondaryAMP ) && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ isSecondaryAMP && __( 'Web Container ID', 'google-site-kit' ) }
							{ ! isSecondaryAMP && __( 'Container ID', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ containerID } />
						</p>
					</div>
				) }

				{ isAMP && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ isSecondaryAMP && __( 'AMP Container ID', 'google-site-kit' ) }
							{ ! isSecondaryAMP && __( 'Container ID', 'google-site-kit' ) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ ampContainerID } />
						</p>
					</div>
				) }
			</div>

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Tag Manager Code Snippet', 'google-site-kit' ) }
					</h5>

					<p className="googlesitekit-settings-module__meta-item-data">
						{ useSnippet && __( 'Snippet is inserted', 'google-site-kit' ) }
						{ ! useSnippet && __( 'Snippet is not inserted', 'google-site-kit' ) }
					</p>

					{ hasExistingTag && (
						<p>
							{ __( 'Placing two tags at the same time is not recommended.', 'google-site-kit' ) }
						</p>
					) }
				</div>
			</div>
		</Fragment>
	);
}
