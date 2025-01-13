/**
 * PAXSetupSuccessSubtleNotification component.
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
 * External dependencies
 */
import PropTypes from 'prop-types';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useDispatch } from 'googlesitekit-data';
import { CORE_NOTIFICATIONS } from '../../../../googlesitekit/notifications/datastore/constants';
import { getNavigationalScrollTop } from '../../../../util/scroll';
import SubtleNotification from '../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import useQueryArg from '../../../../hooks/useQueryArg';
import { useBreakpoint } from '../../../../hooks/useBreakpoint';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';
import CTALinkSubtle from '../../../../googlesitekit/notifications/components/common/CTALinkSubtle';

export default function PAXSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const breakpoint = useBreakpoint();

	const { dismissNotification } = useDispatch( CORE_NOTIFICATIONS );

	const [ , setNotification ] = useQueryArg( 'notification' );

	const dismissNotice = () => {
		setNotification( undefined );
	};

	const scrollToWidget = ( event ) => {
		event.preventDefault();

		setTimeout( () => {
			const widgetClass = '.googlesitekit-widget--partnerAdsPAX';

			global.scrollTo( {
				top: getNavigationalScrollTop( widgetClass, breakpoint ),
				behavior: 'smooth',
			} );

			dismissNotice();
			dismissNotification( id );
		}, 50 );
	};

	return (
		<Notification>
			<SubtleNotification
				title={ __(
					'Your Ads campaign was successfully set up!',
					'google-site-kit'
				) }
				description={ __(
					'Track your conversions, measure your campaign results and make the most of your ad spend',
					'google-site-kit'
				) }
				dismissCTA={
					<Dismiss
						id={ id }
						primary={ false }
						dismissLabel={ __( 'Got it', 'google-site-kit' ) }
						onDismiss={ dismissNotice }
					/>
				}
				additionalCTA={
					<CTALinkSubtle
						id={ id }
						ctaLabel={ __( 'Show me', 'google-site-kit' ) }
						onCTAClick={ scrollToWidget }
					/>
				}
			/>
		</Notification>
	);
}

PAXSetupSuccessSubtleNotification.propTypes = {
	id: PropTypes.string.isRequired,
	Notification: PropTypes.elementType.isRequired,
};
