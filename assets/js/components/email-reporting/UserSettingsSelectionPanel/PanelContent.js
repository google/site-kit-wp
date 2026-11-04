/**
 * User Settings Selection Panel Content
 *
 * Site Kit by Google, Copyright 2025 Google LLC
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Tab, TabBar } from 'googlesitekit-components';
import { useSelect } from 'googlesitekit-data';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import FrequencySelector from '@/js/components/email-reporting/FrequencySelector';
import InviteOthersToSubscribe from '@/js/components/email-reporting/InviteOthersToSubscribe';
import SubscribedUsers from '@/js/components/email-reporting/SubscribedUsers';
import SubscribeActions from '@/js/components/email-reporting/UserSettingsSelectionPanel/SubscribeActions';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import PreviewBlock from '@/js/components/PreviewBlock';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';
import Typography from '@/js/components/Typography';
import P from '@/js/components/Typography/P';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import useViewOnly from '@/js/hooks/useViewOnly';
import Header from './Header';
import Notices from './Notices';
import SelectionPanelFooter from './SelectionPanelFooter';

const TAB_INVITE = 0;
const TAB_SUBSCRIBED_USERS = 1;

export default function PanelContent( {
	notice,
	isUserSubscribed,
	isSavingSettings,
	onSaveCallback,
	onSubscribe,
	onUnsubscribe,
	onNoticeDismiss,
	closePanel,
} ) {
	const user = useSelect( ( select ) => select( CORE_USER ).getUser() );
	const email = user?.wpEmail;
	const isViewOnly = useViewOnly();
	const isEmailReportingEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);
	const hasManageOptionsCapability = useSelect( ( select ) =>
		select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS )
	);
	const isSelectionPanelOpen = useSelect( ( select ) =>
		select( CORE_UI ).getValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY )
	);

	const [ activeSubscriberTab, setActiveSubscriberTab ] =
		useState( TAB_INVITE );

	// Reset to the default tab when the panel opens so a stale "Subscribed
	// users" selection from a prior visit doesn't persist across reopens,
	// matching the reset-on-reopen pattern each tab already applies to its
	// own state.
	useEffect( () => {
		if ( isSelectionPanelOpen ) {
			setActiveSubscriberTab( TAB_INVITE );
		}
	}, [ isSelectionPanelOpen ] );

	// The following selectors are used to determine if the data is still loading,
	// as these are used in child components within the panel.
	const emailReportingErrors = useSelect( ( select ) => {
		if ( isViewOnly ) {
			return null;
		}

		return select( CORE_SITE ).getEmailReportingErrors();
	} );
	const userEmailReportingSettings = useSelect( ( select ) =>
		select( CORE_USER ).getEmailReportingSettings()
	);
	const modules = useSelect( ( select ) =>
		select( CORE_MODULES ).getModules()
	);

	const isLoading = [
		isEmailReportingEnabled,
		userEmailReportingSettings,
		emailReportingErrors,
		modules,
	].some( ( value ) => value === undefined );

	return (
		<Fragment>
			<Header closePanel={ closePanel } isLoading={ isLoading } />
			<SelectionPanelContent className="googlesitekit-user-settings-selection__panel-content">
				<Notices
					isLoading={ isLoading }
					onGoToSettings={ closePanel }
				/>
				<div className="googlesitekit-user-settings-selection__panel-description">
					{ isLoading && (
						<Fragment>
							<PreviewBlock width="100%" height="16px" />
							<PreviewBlock width="60%" height="16px" />
						</Fragment>
					) }
					{ ! isLoading && isEmailReportingEnabled && (
						<P type="body" size="small">
							{ __(
								'You’ll receive the report to your WordPress user email',
								'google-site-kit'
							) }
							{ email && (
								<Typography type="body" size="medium">
									{ email }
								</Typography>
							) }
						</P>
					) }
				</div>

				<FrequencySelector
					isUserSubscribed={ isUserSubscribed }
					isLoading={ isLoading }
				/>

				<SubscribeActions
					onSubscribe={ onSubscribe }
					onUnsubscribe={ onUnsubscribe }
					updateSettings={ onSaveCallback }
					isSubscribed={ isUserSubscribed }
					isSavingSettings={ isSavingSettings }
					isLoading={ isLoading }
				/>

				{ isEmailReportingEnabled &&
					! isViewOnly &&
					hasManageOptionsCapability && (
						<div className="googlesitekit-subscriber-management">
							<TabBar
								activeIndex={ activeSubscriberTab }
								handleActiveIndexUpdate={
									setActiveSubscriberTab
								}
								className="googlesitekit-tab-bar__subscriber-management googlesitekit-tab-bar--start-aligned-high-contrast"
							>
								<Tab focusOnActivate={ false }>
									<span className="mdc-tab__text-label">
										{ __(
											'Invite others to subscribe',
											'google-site-kit'
										) }
									</span>
								</Tab>
								<Tab focusOnActivate={ false }>
									<span className="mdc-tab__text-label">
										{ __(
											'Subscribed users',
											'google-site-kit'
										) }
									</span>
								</Tab>
							</TabBar>

							{ activeSubscriberTab === TAB_INVITE && (
								<InviteOthersToSubscribe />
							) }
							{ activeSubscriberTab === TAB_SUBSCRIBED_USERS && (
								<SubscribedUsers />
							) }
						</div>
					) }
			</SelectionPanelContent>

			{ isEmailReportingEnabled && (
				<SelectionPanelFooter
					notice={ notice }
					onNoticeDismiss={ onNoticeDismiss }
				/>
			) }
		</Fragment>
	);
}

PanelContent.propTypes = {
	savedFrequency: PropTypes.string,
	notice: PropTypes.shape( {
		title: PropTypes.string,
		text: PropTypes.string,
		type: PropTypes.oneOf( Object.values( NOTICE_TYPES ) ),
	} ),
	isUserSubscribed: PropTypes.bool,
	isSavingSettings: PropTypes.bool,
	onSaveCallback: PropTypes.func,
	onSubscribe: PropTypes.func,
	onUnsubscribe: PropTypes.func,
	onNoticeDismiss: PropTypes.func,
	closePanel: PropTypes.func,
};
