/**
 * SettingsEmailReporting component.
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
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { Switch } from 'googlesitekit-components';
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { Cell, Row } from '@/js/material-components';
import Link from '@/js/components/Link';
import Typography from '@/js/components/Typography';
import EmailReportingCardNotice, {
	EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM,
} from '@/js/components/email-reporting/EmailReportingCardNotice';

export default function SettingsEmailReporting( { loading = false } ) {
	const isEnabled = useSelect( ( select ) =>
		select( CORE_SITE ).isEmailReportingEnabled()
	);

	const settings = useSelect( ( select ) =>
		select( CORE_SITE ).getEmailReportingSettings()
	);

	const isSubscribed = useSelect( ( select ) =>
		select( CORE_USER ).isEmailReportingSubscribed()
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM
		)
	);

	const { setEmailReportingEnabled, saveEmailReportingSettings } =
		useDispatch( CORE_SITE );

	const { setValue } = useDispatch( CORE_UI );

	const handleToggle = useCallback( async () => {
		await setEmailReportingEnabled( ! isEnabled );
		await saveEmailReportingSettings();
	}, [ isEnabled, setEmailReportingEnabled, saveEmailReportingSettings ] );

	const handleManageClick = useCallback( () => {
		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ setValue ] );

	if ( loading || settings === undefined ) {
		return null;
	}

	return (
		<Fragment>
			<Row>
				<Cell size={ 12 }>
					<div className="googlesitekit-settings-email-reporting__switch">
						<Switch
							label={
								<Fragment>
									<Typography
										type="body"
										size="medium"
										className="googlesitekit-settings-email-reporting__label"
									>
										{ __(
											'Enable email reports',
											'google-site-kit'
										) }
									</Typography>
									<br />
									<Typography
										type="body"
										size="medium"
										className="googlesitekit-settings-email-reporting__label-description"
									>
										{ __(
											'This allows you and any dashboard sharing user to subscribe to email reports',
											'google-site-kit'
										) }
									</Typography>
								</Fragment>
							}
							checked={ isEnabled }
							onClick={ handleToggle }
							hideLabel={ false }
						/>
					</div>
				</Cell>
			</Row>
			{ /* Show the introductory notice if notice is not dismissed and user is not already subscribed */ }
			{ isEnabled &&
				settings !== undefined &&
				! isSubscribed &&
				isDismissed === false && (
					<EmailReportingCardNotice className="googlesitekit-settings-email-reporting__manage" />
				) }
			{ /* Show manage email reports link if notice is dismissed or user is already subscribed */ }
			{ isEnabled &&
				settings !== undefined &&
				isDismissed !== undefined &&
				( isSubscribed || isDismissed !== false ) && (
					<Row className="googlesitekit-settings-email-reporting__manage">
						<Cell size={ 12 }>
							<Link onClick={ handleManageClick }>
								{ __(
									'Manage email reports subscription',
									'google-site-kit'
								) }
							</Link>
						</Cell>
					</Row>
				) }
		</Fragment>
	);
}

SettingsEmailReporting.propTypes = {
	loading: PropTypes.bool,
};
