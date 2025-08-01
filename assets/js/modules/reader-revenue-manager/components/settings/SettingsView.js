/**
 * Reader Revenue Manager SettingsView component.
 *
 * Site Kit by Google, Copyright 2024 Google LLC
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
import { useSelect } from 'googlesitekit-data';
import { getPostTypesString, getProductIDLabel } from '../../utils/settings';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { MODULES_READER_REVENUE_MANAGER } from '../../datastore/constants';
import {
	SNIPPET_MODES,
	MODULE_SLUG_READER_REVENUE_MANAGER,
} from '../../constants';
import DisplaySetting from '../../../../components/DisplaySetting';
import { PublicationOnboardingStateNotice } from '../common';

export default function SettingsView() {
	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const productID = useSelect( ( select ) => {
		const id = select( MODULES_READER_REVENUE_MANAGER ).getProductID();

		if ( 'openaccess' === id ) {
			return __( 'Open access', 'google-site-kit' );
		}

		return getProductIDLabel( id );
	} );

	const snippetMode = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getSnippetMode()
	);

	const postTypes = useSelect( ( select ) => {
		const allPostTypes = select( CORE_SITE ).getPostTypes();
		const types = select( MODULES_READER_REVENUE_MANAGER ).getPostTypes();

		return getPostTypesString( types, allPostTypes );
	} );

	const hasModuleAccess = useSelect( ( select ) => {
		const { hasModuleOwnershipOrAccess, getErrorForAction } =
			select( CORE_MODULES );

		const hasAccess = hasModuleOwnershipOrAccess(
			MODULE_SLUG_READER_REVENUE_MANAGER
		);

		if ( hasAccess ) {
			return true;
		}

		const checkAccessError = getErrorForAction( 'checkModuleAccess', [
			MODULE_SLUG_READER_REVENUE_MANAGER,
		] );

		// Return early if request is not completed yet.
		if ( undefined === hasAccess && ! checkAccessError ) {
			return undefined;
		}

		// Return false if RRM is connected and access is concretely missing.
		if ( false === hasAccess ) {
			return false;
		}

		if ( 'module_not_connected' === checkAccessError?.code ) {
			return true;
		}

		return false;
	} );

	return (
		<div className="googlesitekit-setup-module googlesitekit-setup-module--reader-revenue-manager">
			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Publication', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ publicationID } />
					</p>
				</div>

				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Default Product ID', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting value={ productID } />
					</p>
				</div>
			</div>

			{ hasModuleAccess && <PublicationOnboardingStateNotice /> }

			<div className="googlesitekit-settings-module__meta-items">
				<div className="googlesitekit-settings-module__meta-item">
					<h5 className="googlesitekit-settings-module__meta-item-type">
						{ __( 'Display CTAs', 'google-site-kit' ) }
					</h5>
					<p className="googlesitekit-settings-module__meta-item-data">
						<DisplaySetting
							value={
								SNIPPET_MODES[ snippetMode ] || snippetMode
							}
						/>
					</p>
				</div>

				{ 'post_types' === snippetMode && (
					<div className="googlesitekit-settings-module__meta-item">
						<h5 className="googlesitekit-settings-module__meta-item-type">
							{ __(
								'Content type to display CTAs',
								'google-site-kit'
							) }
						</h5>
						<p className="googlesitekit-settings-module__meta-item-data">
							<DisplaySetting value={ postTypes } />
						</p>
					</div>
				) }
			</div>
		</div>
	);
}
