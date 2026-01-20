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
import { useCallback, useEffect } from '@wordpress/element';

/**
 * External dependencies
 */
import { FC, ElementType } from 'react';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import useQueryArg from '@/js/hooks/useQueryArg';
import { useRefocus } from '@/js/hooks/useRefocus';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_UI } from '@/js/googlesitekit/datastore/ui/constants';
import {
	CONTENT_POLICY_STATES,
	MODULES_READER_REVENUE_MANAGER,
	PENDING_POLICY_VIOLATION_STATES,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_NOTICES_FORM,
	SYNC_PUBLICATION,
} from '@/js/modules/reader-revenue-manager/datastore/constants';
import { MODULE_SLUG_READER_REVENUE_MANAGER } from '@/js/modules/reader-revenue-manager/constants';
import useFormValue from '@/js/hooks/useFormValue';
import PendingVerification from './PendingVerification';
import OnboardingActionRequired from './OnboardingActionRequired';
import OnboardingComplete from './OnboardingComplete';
import PolicyViolation from '@/js/modules/reader-revenue-manager/components/dashboard/RRMSetupSuccessSubtleNotification/PolicyViolation';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type SelectFunction = ( select: any ) => any;

const {
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
} = PUBLICATION_ONBOARDING_STATES;

interface RRMSetupSuccessSubtleNotificationProps {
	id: string;
	Notification: ElementType;
}

const RRMSetupSuccessSubtleNotification: FC<
	RRMSetupSuccessSubtleNotificationProps
> = ( { id, Notification } ) => {
	const [ notification, setNotification ] = useQueryArg( 'notification' );
	const [ slug, setSlug ] = useQueryArg( 'slug' );

	const actionableOnboardingStates = [
		PENDING_VERIFICATION,
		ONBOARDING_ACTION_REQUIRED,
	];

	const publicationOnboardingState = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationOnboardingState()
	);

	const publicationID = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationID()
	);

	const serviceURL = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getServiceURL( {
			path: 'reader-revenue-manager',
			query: {
				publication: publicationID,
			},
		} )
	);

	const policyInfoURL = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPolicyInfoURL()
	);

	const shouldSyncPublicationValue = useFormValue(
		READER_REVENUE_MANAGER_NOTICES_FORM,
		SYNC_PUBLICATION
	);

	const shouldSyncPublication =
		shouldSyncPublicationValue &&
		actionableOnboardingStates.includes( publicationOnboardingState );

	const paymentOption = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPaymentOption()
	);

	const productID = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductID()
	);

	const contentPolicyState = useSelect( ( select: SelectFunction ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getContentPolicyState()
	);

	const { setValues } = useDispatch( CORE_FORMS );
	const { setValue } = useDispatch( CORE_UI );
	const { syncPublicationOnboardingState } = useDispatch(
		MODULES_READER_REVENUE_MANAGER
	);

	const dismissNotice = useCallback( () => {
		setNotification( undefined );
		setSlug( undefined );
	}, [ setNotification, setSlug ] );

	function onCTAClick( url: string ) {
		// Set publication data to be reset when user re-focuses window.
		if (
			actionableOnboardingStates.includes( publicationOnboardingState )
		) {
			setValues( READER_REVENUE_MANAGER_NOTICES_FORM, {
				[ SYNC_PUBLICATION ]: true,
			} );
		}

		global.open( url, '_blank' );
	}

	const syncPublication = useCallback( async () => {
		if ( ! shouldSyncPublication ) {
			return;
		}

		await syncPublicationOnboardingState();
	}, [ shouldSyncPublication, syncPublicationOnboardingState ] );

	// Sync publication data when user re-focuses window.
	useRefocus( syncPublication, 15000 );

	const showingSuccessNotification =
		notification === 'authentication_success' &&
		slug === MODULE_SLUG_READER_REVENUE_MANAGER;

	// On successful module setup, if the payment option is not set,
	// the "Publication approved" Overlay Notification will be triggered
	// instead of this notice, so we can dismiss this notice.
	useEffect( () => {
		if (
			showingSuccessNotification &&
			publicationOnboardingState === ONBOARDING_COMPLETE &&
			paymentOption === ''
		) {
			dismissNotice();
		}
	}, [
		dismissNotice,
		paymentOption,
		publicationOnboardingState,
		setValue,
		showingSuccessNotification,
	] );

	const hasCustomProductID = !! productID && productID !== 'openaccess';

	const gaTrackingEventArgs = {
		label: `${ publicationOnboardingState }:${ paymentOption }:${
			hasCustomProductID ? 'yes' : 'noElementType'
		}`,
	};

	if (
		contentPolicyState &&
		contentPolicyState !== CONTENT_POLICY_STATES.CONTENT_POLICY_STATE_OK
	) {
		const policyViolationType = PENDING_POLICY_VIOLATION_STATES.includes(
			contentPolicyState
		)
			? 'PENDING_POLICY_VIOLATION'
			: 'ACTIVE_POLICY_VIOLATION';

		return (
			<PolicyViolation
				id={ id }
				Notification={ Notification }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				dismissNotice={ dismissNotice }
				onCTAClick={ () => onCTAClick( policyInfoURL ) }
				policyViolationType={ policyViolationType }
			/>
		);
	}

	if ( publicationOnboardingState === PENDING_VERIFICATION ) {
		return (
			<PendingVerification
				id={ id }
				Notification={ Notification }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				dismissNotice={ dismissNotice }
				onCTAClick={ () => onCTAClick( serviceURL ) }
			/>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_ACTION_REQUIRED ) {
		return (
			<OnboardingActionRequired
				id={ id }
				Notification={ Notification }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				dismissNotice={ dismissNotice }
				onCTAClick={ () => onCTAClick( serviceURL ) }
			/>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_COMPLETE ) {
		return (
			<OnboardingComplete
				id={ id }
				Notification={ Notification }
				gaTrackingEventArgs={ gaTrackingEventArgs }
				dismissNotice={ dismissNotice }
				paymentOption={ paymentOption }
				productID={ productID }
				serviceURL={ serviceURL }
			/>
		);
	}

	return null;
};

export default RRMSetupSuccessSubtleNotification;
