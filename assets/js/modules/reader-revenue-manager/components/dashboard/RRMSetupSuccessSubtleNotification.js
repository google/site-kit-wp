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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import SubtleNotification from '../../../../components/notifications/SubtleNotification';
import useQueryArg from '../../../../hooks/useQueryArg';
import { useRefocus } from '../../../../hooks/useRefocus';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_NOTICES_FORM,
	SYNC_PUBLICATION,
} from '../../datastore/constants';
import CTALinkSubtle from '../../../../googlesitekit/notifications/components/common/CTALinkSubtle';
import Dismiss from '../../../../googlesitekit/notifications/components/common/Dismiss';

const {
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
} = PUBLICATION_ONBOARDING_STATES;

export default function RRMSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const [ , setNotification ] = useQueryArg( 'notification' );
	const [ , setSlug ] = useQueryArg( 'slug' );

	const actionableOnboardingStates = [
		PENDING_VERIFICATION,
		ONBOARDING_ACTION_REQUIRED,
	];

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

	const shouldSyncPublication = useSelect(
		( select ) =>
			select( CORE_FORMS ).getValue(
				READER_REVENUE_MANAGER_NOTICES_FORM,
				SYNC_PUBLICATION
			) &&
			actionableOnboardingStates.includes( publicationOnboardingState )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { syncPublicationOnboardingState } = useDispatch(
		MODULES_READER_REVENUE_MANAGER
	);

	const dismissNotice = () => {
		setNotification( undefined );
		setSlug( undefined );
	};

	const onCTAClick = () => {
		// Set publication data to be reset when user re-focuses window.
		if (
			actionableOnboardingStates.includes( publicationOnboardingState )
		) {
			setValues( READER_REVENUE_MANAGER_NOTICES_FORM, {
				[ SYNC_PUBLICATION ]: true,
			} );
		}
	};

	const syncPublication = useCallback( () => {
		if ( ! shouldSyncPublication ) {
			return;
		}

		syncPublicationOnboardingState();
	}, [ shouldSyncPublication, syncPublicationOnboardingState ] );

	// Sync publication data when user re-focuses window.
	useRefocus( syncPublication, 15000 );

	if ( publicationOnboardingState === ONBOARDING_COMPLETE ) {
		return (
			<Notification gaViewEventLabel={ publicationOnboardingState }>
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
							onDismiss={ dismissNotice }
							gaDismissEventLabel={ publicationOnboardingState }
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
							gaConfirmEventLabel={ publicationOnboardingState }
						/>
					}
				/>
			</Notification>
		);
	}

	if ( publicationOnboardingState === PENDING_VERIFICATION ) {
		return (
			<Notification gaViewEventLabel={ publicationOnboardingState }>
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
							onDismiss={ dismissNotice }
							gaDismissEventLabel={ publicationOnboardingState }
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
							gaConfirmEventLabel={ publicationOnboardingState }
						/>
					}
				/>
			</Notification>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_ACTION_REQUIRED ) {
		return (
			<Notification gaViewEventLabel={ publicationOnboardingState }>
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
							onDismiss={ dismissNotice }
							gaDismissEventLabel={ publicationOnboardingState }
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
							gaConfirmEventLabel={ publicationOnboardingState }
						/>
					}
				/>
			</Notification>
		);
	}

	return null;
}
