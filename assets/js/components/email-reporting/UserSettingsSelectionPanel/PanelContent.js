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
import Header from './Header';
import SelectionPanelFooter from './SelectionPanelFooter';
import P from '@/js/components/Typography/P';
import Typography from '@/js/components/Typography';
import FrequencySelector from '@/js/components/email-reporting/FrequencySelector';
import SubscribeActions from '@/js/components/email-reporting/UserSettingsSelectionPanel/SubscribeActions';

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
	const email = user?.email;

	return (
		<Fragment>
			<div className="googlesitekit-user-settings-selection__panel-content">
				<Header closePanel={ closePanel } />

				<div className="googlesitekit-user-settings-selection__panel-description">
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
				</div>

				<FrequencySelector isUserSubscribed={ isUserSubscribed } />

				<SubscribeActions
					onSubscribe={ onSubscribe }
					onUnsubscribe={ onUnsubscribe }
					updateSettings={ onSaveCallback }
					isSubscribed={ isUserSubscribed }
					isLoading={ isSavingSettings }
				/>
			</div>
			<SelectionPanelFooter
				notice={ notice }
				onNoticeDismiss={ onNoticeDismiss }
			/>
		</Fragment>
	);
}

PanelContent.propTypes = {
	savedFrequency: PropTypes.string,
	notice: PropTypes.shape( {
		text: PropTypes.string,
		type: PropTypes.oneOf( [ 'info', 'success', 'error' ] ),
	} ),
	onSaveCallback: PropTypes.func,
	onUnsubscribe: PropTypes.func,
	onNoticeDismiss: PropTypes.func,
	closePanel: PropTypes.func,
};
