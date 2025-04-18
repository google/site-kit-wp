/**
 * SetupSuccessContent component.
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
import { forwardRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION } from '../../../../../../../googlesitekit/widgets/default-areas';
import { CORE_LOCATION } from '../../../../../../../googlesitekit/datastore/location/constants';
import { CORE_SITE } from '../../../../../../../googlesitekit/datastore/site/constants';
import { CORE_USER } from '../../../../../../../googlesitekit/datastore/user/constants';
import { trackEvent } from '../../../../../../../util';
import useViewContext from '../../../../../../../hooks/useViewContext';
import { useDispatch, useSelect } from 'googlesitekit-data';
import { Button } from 'googlesitekit-components';
import CheckFill from '../../../../../../../../svg/icons/check-fill.svg';

export const SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION =
	'settings_visitor_groups_setup_success_notification';

const SetupSuccessContent = forwardRef( ( props, ref ) => {
	const viewContext = useViewContext();

	const dashboardURL = useSelect( ( select ) => {
		const url = select( CORE_SITE ).getAdminURL(
			'googlesitekit-dashboard'
		);

		return addQueryArgs( url, {
			widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
		} );
	} );

	const { navigateTo } = useDispatch( CORE_LOCATION );
	const { dismissItem } = useDispatch( CORE_USER );

	function dismissNotificationForUser() {
		return dismissItem(
			SETTINGS_VISITOR_GROUPS_SETUP_SUCCESS_NOTIFICATION
		);
	}

	function handleDismiss() {
		trackEvent(
			`${ viewContext }_audiences-setup-cta-settings-success`,
			'dismiss_notification'
		).finally( dismissNotificationForUser );
	}

	function scrollToWidgetArea() {
		trackEvent(
			`${ viewContext }_audiences-setup-cta-settings-success`,
			'confirm_notification'
		).finally( async () => {
			await dismissNotificationForUser();
			navigateTo( dashboardURL );
		} );
	}

	return (
		<div
			ref={ ref }
			className="googlesitekit-settings-visitor-groups__setup-success googlesitekit-subtle-notification"
		>
			<div className="googlesitekit-subtle-notification__icon">
				<CheckFill width={ 24 } height={ 24 } />
			</div>
			<div className="googlesitekit-subtle-notification__content">
				<p>
					{ __(
						'We’ve added the visitor groups section to your dashboard!',
						'google-site-kit'
					) }
				</p>
			</div>
			<div className="googlesitekit-subtle-notification__action">
				<Button tertiary onClick={ handleDismiss }>
					{ __( 'Got it', 'google-site-kit' ) }
				</Button>
				<Button onClick={ scrollToWidgetArea }>
					{ __( 'Show me', 'google-site-kit' ) }
				</Button>
			</div>
		</div>
	);
} );

export default SetupSuccessContent;
