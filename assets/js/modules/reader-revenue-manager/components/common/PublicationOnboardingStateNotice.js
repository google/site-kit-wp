/**
 * Reader Revenue Manager PublicationOnboardingStateNotice component.
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
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_NOTICES_FORM,
	SYNC_PUBLICATION,
} from '../../datastore/constants';
import SubtleNotification from '../../../../components/notifications/SubtleNotification';
import { trackEvent } from '../../../../util';
import useViewContext from '../../../../hooks/useViewContext';
import { useRefocus } from '../../../../hooks/useRefocus';

const { PENDING_VERIFICATION, ONBOARDING_ACTION_REQUIRED } =
	PUBLICATION_ONBOARDING_STATES;

export default function PublicationOnboardingStateNotice() {
	const viewContext = useViewContext();
	const onboardingState = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationOnboardingState()
	);

	const actionableOnboardingStates = [
		PENDING_VERIFICATION,
		ONBOARDING_ACTION_REQUIRED,
	];

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
			) && actionableOnboardingStates.includes( onboardingState )
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { syncPublicationOnboardingState } = useDispatch(
		MODULES_READER_REVENUE_MANAGER
	);

	const showNotice =
		onboardingState &&
		actionableOnboardingStates.includes( onboardingState );

	const onCTAClick = useCallback( () => {
		// Set publication data to be reset when user re-focuses window.
		setValues( READER_REVENUE_MANAGER_NOTICES_FORM, {
			[ SYNC_PUBLICATION ]: true,
		} );

		trackEvent(
			`${ viewContext }_rrm-onboarding-state-notification`,
			'confirm_notification',
			onboardingState
		);
	}, [ onboardingState, setValues, viewContext ] );

	const syncPublication = useCallback( () => {
		if ( ! shouldSyncPublication ) {
			return;
		}

		syncPublicationOnboardingState();
	}, [ shouldSyncPublication, syncPublicationOnboardingState ] );

	useEffect( () => {
		if ( ! showNotice ) {
			return;
		}

		trackEvent(
			`${ viewContext }_rrm-onboarding-state-notification`,
			'view_notification',
			onboardingState
		);
	}, [ onboardingState, showNotice, viewContext ] );

	// Sync publication data when user re-focuses window.
	useRefocus( syncPublication, 15000 );

	if ( ! showNotice ) {
		return null;
	}

	const noticeText =
		PENDING_VERIFICATION === onboardingState
			? __(
					'Your publication is still awaiting review. You can check its status in Reader Revenue Manager.',
					'google-site-kit'
			  )
			: __(
					'Your publication requires further setup in Reader Revenue Manager',
					'google-site-kit'
			  );

	const buttonText =
		PENDING_VERIFICATION === onboardingState
			? __( 'Check publication status', 'google-site-kit' )
			: __( 'Complete publication setup', 'google-site-kit' );

	return (
		<SubtleNotification
			className="googlesitekit-publication-onboarding-state-notice"
			title={ noticeText }
			ctaLabel={ buttonText }
			ctaLink={ serviceURL }
			isCTALinkExternal
			variant="warning"
			onCTAClick={ onCTAClick }
		/>
	);
}
