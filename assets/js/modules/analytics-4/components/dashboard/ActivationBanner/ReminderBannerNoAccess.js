/**
 * ReminderBannerNoAccess component.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
import { __, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { CORE_MODULES } from '../../../../../googlesitekit/modules/datastore/constants';
import BannerNotification from '../../../../../components/notifications/BannerNotification';
const { useSelect } = Data;

export default function ReminderBannerNoAccess( props ) {
	const { title, description, dismissExpires, onDismiss } = props;

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'analytics' )
	);

	const formattedOwnerName = module?.owner?.login
		? `<strong>${ module.owner.login }</strong>`
		: __( 'Another admin', 'google-site-kit' );

	const extendedDescription = (
		<p>
			{ createInterpolateElement(
				sprintf(
					/* translators: 1. Original reminder description text, 2: module owner's name */
					__(
						'%1$s.<br />%2$s configured Analytics and you don’t have access to its configured property. Contact them to share access or set up Google Analytics 4.',
						'google-site-kit'
					),
					description,
					formattedOwnerName
				),
				{
					strong: <strong />,
					br: <br />,
				}
			) }
		</p>
	);

	return (
		<BannerNotification
			id="ga4-activation-banner"
			className="googlesitekit-ga4-reminder-banner"
			title={ title }
			description={ extendedDescription }
			dismiss={ __( 'Remind me later', 'google-site-kit' ) }
			dismissExpires={ dismissExpires }
			onDismiss={ onDismiss }
		/>
	);
}

ReminderBannerNoAccess.propTypes = {
	title: PropTypes.string.isRequired,
	description: PropTypes.node,
	dismissExpires: PropTypes.number,
	onDismiss: PropTypes.func,
};
