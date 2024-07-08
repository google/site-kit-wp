/**
 * SettingsCardVisitorGroups SetupCTA component.
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
import { AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION } from '../../dashboard/AudienceSegmentationSetupCTAWidget';
import { CORE_USER } from '../../../../../../googlesitekit/datastore/user/constants';
import { useSelect } from 'googlesitekit-data';
import useEnableAudienceGroup from '../../../../hooks/useEnableAudienceGroup';
import { ProgressBar } from 'googlesitekit-components';
import Link from '../../../../../../components/Link';

export default function SetupCTA() {
	const { isSaving, onEnableGroups } = useEnableAudienceGroup( {
		redirectURL: global.location.href,
	} );

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isPromptDismissed(
			AUDIENCE_SEGMENTATION_SETUP_CTA_NOTIFICATION
		)
	);

	if ( isDismissed ) {
		return null;
	}

	return (
		<div className="googlesitekit-settings-visitor-groups__setup">
			<p>
				{ __(
					'To set up new visitor groups for your site, Site Kit needs to update your Google Analytics property.',
					'google-site-kit'
				) }
			</p>
			{ isSaving && (
				<div className="googlesitekit-settings-visitor-groups__setup-progress">
					<p>{ __( 'Enabling groups', 'google-site-kit' ) }</p>
					<ProgressBar compress />
				</div>
			) }
			{ ! isSaving && (
				<Link onClick={ onEnableGroups }>
					{ __( 'Enable groups', 'google-site-kit' ) }
				</Link>
			) }
		</div>
	);
}
