/**
 * RRMSetupSuccessSubtleNotification component.
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
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect } from 'googlesitekit-data';
import SubtleNotification from '../../../../googlesitekit/notifications/components/layout/SubtleNotification';
import useQueryArg from '../../../../hooks/useQueryArg';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
} from '../../datastore/constants';
import CTALinkSubtle from '../../../../googlesitekit/notifications/components/common/CTALinkSubtle';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';

const {
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
} = PUBLICATION_ONBOARDING_STATES;

const targetOnboardingStates = [
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
];

export default function RRMSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const viewContext = useViewContext();
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ , setSlug ] = useQueryArg( 'slug' );

	const publicationOnboardingState = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationOnboardingState()
	);

	const publicationID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const serviceURL = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
			path: 'reader-revenue-manager',
			query: {
				publication: publicationID,
			},
		} )
	);

	const dismissNotice = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	const handleDismiss = () => {
		if ( targetOnboardingStates.includes( publicationOnboardingState ) ) {
			trackEvent(
				`${ viewContext }_rrm-setup-success-notification`,
				'dismiss_notification',
				publicationOnboardingState
			);
		}

		dismissNotice();
	};

	const onCTAClick = () => {
		if ( targetOnboardingStates.includes( publicationOnboardingState ) ) {
			trackEvent(
				`${ viewContext }_rrm-setup-success-notification`,
				'confirm_notification',
				publicationOnboardingState
			);
		}
	};

	useEffect( () => {
		if ( targetOnboardingStates.includes( publicationOnboardingState ) ) {
			trackEvent(
				`${ viewContext }_rrm-setup-success-notification`,
				'view_notification',
				publicationOnboardingState
			);
		}
	}, [ publicationOnboardingState, viewContext ] );

	if ( publicationOnboardingState === ONBOARDING_COMPLETE ) {
		return (
			<Notification>
				<SubtleNotification
					title={ __(
						'Your Reader Revenue Manager account was successfully set up!',
						'google-site-kit'
					) }
					description={ __(
						'Unlock your full reader opportunity by enabling features like subscriptions, contributions and newsletter sign ups in the Reader Revenue Manager settings.',
						'google-site-kit'
					) }
					dismissCTA={
						<Dismiss
							id={ id }
							primary={ false }
							dismissLabel={ __(
								'Maybe later',
								'google-site-kit'
							) }
							onDismiss={ handleDismiss }
						/>
					}
					additionalCTA={
						<CTALinkSubtle
							id={ id }
							ctaLabel={ __(
								'Customize settings',
								'google-site-kit'
							) }
							ctaLink={ serviceURL }
							onCTAClick={ onCTAClick }
							isCTALinkExternal
						/>
					}
				/>
			</Notification>
		);
	}

	if ( publicationOnboardingState === PENDING_VERIFICATION ) {
		return (
			<Notification>
				<SubtleNotification
					title={ __(
						'Your Reader Revenue Manager account was successfully set up!',
						'google-site-kit'
					) }
					description={ __(
						'Your publication is still awaiting review, you can check its status in Reader Revenue Manager.',
						'google-site-kit'
					) }
					dismissCTA={
						<Dismiss
							id={ id }
							primary={ false }
							dismissLabel={ __( 'Got it', 'google-site-kit' ) }
							onDismiss={ handleDismiss }
						/>
					}
					additionalCTA={
						<CTALinkSubtle
							id={ id }
							ctaLabel={ __(
								'Check publication status',
								'google-site-kit'
							) }
							ctaLink={ serviceURL }
							onCTAClick={ onCTAClick }
							isCTALinkExternal
						/>
					}
				/>
			</Notification>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_ACTION_REQUIRED ) {
		return (
			<Notification>
				<SubtleNotification
					title={ __(
						'Your Reader Revenue Manager account was successfully set up, but your publication still requires further setup in Reader Revenue Manager.',
						'google-site-kit'
					) }
					dismissCTA={
						<Dismiss
							id={ id }
							primary={ false }
							dismissLabel={ __( 'Got it', 'google-site-kit' ) }
							onDismiss={ handleDismiss }
						/>
					}
					additionalCTA={
						<CTALinkSubtle
							id={ id }
							ctaLabel={ __(
								'Complete publication setup',
								'google-site-kit'
							) }
							ctaLink={ serviceURL }
							onCTAClick={ onCTAClick }
							isCTALinkExternal
						/>
					}
				/>
			</Notification>
		);
	}

	return null;
}
