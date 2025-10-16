/**
 * EmailReportingCardNotice component.
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
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useDispatch, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import Notice from '@/js/components/Notice';
import { TYPES } from '@/js/components/Notice/constants';
import { USER_SETTINGS_SELECTION_PANEL_OPENED_KEY } from '@/js/components/email-reporting/constants';
import { Row, Cell } from '@/js/material-components';

export const EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM =
	'email-reporting-card-notice';

export default function EmailReportingCardNotice( { className } ) {
	const settings = useSelect( ( select ) =>
		select( CORE_USER ).getEmailReportingSettings()
	);

	const isSubscribed = useSelect( ( select ) =>
		select( CORE_USER ).isEmailReportingSubscribed()
	);

	const isDismissed = useSelect( ( select ) =>
		select( CORE_USER ).isItemDismissed(
			EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM
		)
	);

	const { setValue } = useDispatch( CORE_UI );
	const { dismissItem } = useDispatch( CORE_USER );

	const handleSetup = useCallback( () => {
		setValue( USER_SETTINGS_SELECTION_PANEL_OPENED_KEY, true );
	}, [ setValue ] );

	const handleDismiss = useCallback( async () => {
		await dismissItem( EMAIL_REPORTING_CARD_NOTICE_DISMISSED_ITEM );
	}, [ dismissItem ] );

	if ( settings === undefined ) {
		return null;
	}

	if ( isSubscribed || isDismissed !== false ) {
		return null;
	}

	return (
		<Row className={ className }>
			<Cell size={ 12 }>
				<Notice
					type={ TYPES.NEW }
					title={ __(
						'Get site insights in your inbox',
						'google-site-kit'
					) }
					description={ __(
						"Receive the most important insights about your site’s performance, key trends, and tailored metrics directly in your inbox",
						'google-site-kit'
					) }
					ctaButton={ {
						label: __( 'Set up', 'google-site-kit' ),
						onClick: handleSetup,
					} }
					dismissButton={ {
						label: __( 'Maybe later', 'google-site-kit' ),
						onClick: handleDismiss,
					} }
				/>
			</Cell>
		</Row>
	);
}

EmailReportingCardNotice.propTypes = {
	className: PropTypes.string,
};
