/**
 * ErrorNotifications component.
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
import { Fragment } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import AuthError from './AuthError';
import UnsatisfiedScopesAlert from './UnsatisfiedScopesAlert';
import UnsatisfiedScopesAlertGTE from './UnsatisfiedScopesAlertGTE';
import InternalServerError from './InternalServerError';
import { CORE_MODULES } from '../../googlesitekit/modules/datastore/constants';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import { READ_SCOPE as TAGMANAGER_READ_SCOPE } from '../../modules/tagmanager/datastore/constants';
import BannerNotification from './BannerNotification';
const { useSelect } = Data;

export default function ErrorNotifications() {
	const isAuthenticated = useSelect( ( select ) =>
		select( CORE_USER ).isAuthenticated()
	);

	// These will be `null` if no errors exist.
	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);
	const setupErrorMessage = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorMessage()
	);
	const setupErrorRedoURL = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorRedoURL()
	);
	const errorTroubleshootingLinkURL = useSelect( ( select ) =>
		select( CORE_SITE ).getErrorTroubleshootingLinkURL( {
			code: setupErrorCode,
		} )
	);
	const ga4ModuleConnected = useSelect( ( select ) =>
		select( CORE_MODULES ).isModuleConnected( 'analytics-4' )
	);
	const hasTagManagerReadScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( TAGMANAGER_READ_SCOPE )
	);

	const showUnsatisfiedScopesAlertGTE =
		ga4ModuleConnected && ! hasTagManagerReadScope;

	return (
		<Fragment>
			<InternalServerError />
			<AuthError />
			{ setupErrorMessage && (
				<BannerNotification
					id="setup_error"
					type="win-error"
					title={ __(
						'Error connecting Site Kit',
						'google-site-kit'
					) }
					description={ setupErrorMessage }
					isDismissible={ false }
					ctaLink={ setupErrorRedoURL }
					ctaLabel={ __(
						'Redo the plugin setup',
						'google-site-kit'
					) }
					learnMoreLabel={ __( 'Get help', 'google-site-kit' ) }
					learnMoreURL={ errorTroubleshootingLinkURL }
				/>
			) }
			{ ! setupErrorMessage && isAuthenticated && (
				<Fragment>
					{ ! showUnsatisfiedScopesAlertGTE && (
						<UnsatisfiedScopesAlert />
					) }
					{ showUnsatisfiedScopesAlertGTE && (
						<UnsatisfiedScopesAlertGTE />
					) }
				</Fragment>
			) }
		</Fragment>
	);
}
