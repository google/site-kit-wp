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
import { __ } from '@wordpress/i18n';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import Header from './Header';
import SelectionPanelFooter from './SelectionPanelFooter';
import P from '@/js/components/Typography/P';
import Typography from '@/js/components/Typography';
import FrequencySelector from '@/js/components/email-reporting/FrequencySelector';
import SubscribeActions from '@/js/components/email-reporting/UserSettingsSelectionPanel/SubscribeActions';
import Notices from './Notices';
import { NOTICE_TYPES } from '@/js/components/Notice/constants';
import InviteOthersToSubscribe from '@/js/components/email-reporting/InviteOthersToSubscribe';
import PreviewBlock from '@/js/components/PreviewBlock';
import useViewOnly from '@/js/hooks/useViewOnly';
import { SelectionPanelContent } from '@/js/components/SelectionPanel';

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

				{ isEmailReportingEnabled && ! isViewOnly && (
					<InviteOthersToSubscribe />
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
