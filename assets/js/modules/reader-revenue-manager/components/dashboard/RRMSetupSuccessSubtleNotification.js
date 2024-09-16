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
import { useSelect, useDispatch } from 'googlesitekit-data';
import { Cell, Grid, Row } from '../../../../material-components';
import SubtleNotification from '../../../../components/notifications/SubtleNotification';
import useQueryArg from '../../../../hooks/useQueryArg';
import whenActive from '../../../../util/when-active';
import { trackEvent } from '../../../../util';
import { useRefocus } from '../../../../hooks/useRefocus';
import useViewContext from '../../../../hooks/useViewContext';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	READER_REVENUE_MANAGER_NOTICES_FORM,
	SYNC_PUBLICATION,
} from '../../datastore/constants';

const {
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
} = PUBLICATION_ONBOARDING_STATES;

const actionableOnboardingStates = [
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
];

const targetOnboardingStates = [
	...actionableOnboardingStates,
	ONBOARDING_COMPLETE,
];

function RRMSetupSuccessSubtleNotification() {
	const viewContext = useViewContext();
	const [ notification, setNotification ] = useQueryArg( 'notification' );
	const [ slug, setSlug ] = useQueryArg( 'slug' );

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

	const showNotification =
		notification === 'authentication_success' &&
		slug === READER_REVENUE_MANAGER_MODULE_SLUG &&
		publicationOnboardingState !== undefined;

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
		// Set publication data to be reset when user re-focuses window.
		if (
			actionableOnboardingStates.includes( publicationOnboardingState )
		) {
			setValues( READER_REVENUE_MANAGER_NOTICES_FORM, {
				[ SYNC_PUBLICATION ]: true,
			} );
		}

		if ( targetOnboardingStates.includes( publicationOnboardingState ) ) {
			trackEvent(
				`${ viewContext }_rrm-setup-success-notification`,
				'confirm_notification',
				publicationOnboardingState
			);
		}
	};

	const syncPublication = () => {
		if ( ! shouldSyncPublication ) {
			return;
		}

		syncPublicationOnboardingState();
	};

	useEffect( () => {
		if (
			showNotification &&
			targetOnboardingStates.includes( publicationOnboardingState )
		) {
			trackEvent(
				`${ viewContext }_rrm-setup-success-notification`,
				'view_notification',
				publicationOnboardingState
			);
		}
	}, [ publicationOnboardingState, showNotification, viewContext ] );

	// Sync publication data when user re-focuses window.
	useRefocus( syncPublication, 15000 );

	if ( ! showNotification ) {
		return null;
	}

	function WithGridWrapped( { children } ) {
		return (
			<Grid>
				<Row>
					<Cell alignMiddle size={ 12 }>
						{ children }
					</Cell>
				</Row>
			</Grid>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_COMPLETE ) {
		return (
			<WithGridWrapped>
				<SubtleNotification
					title={ __(
						'Your Reader Revenue Manager account was successfully set up!',
						'google-site-kit'
					) }
					description={ __(
						'Unlock your full reader opportunity by enabling features like subscriptions, contributions and newsletter sign ups in the Reader Revenue Manager settings.',
						'google-site-kit'
					) }
					onDismiss={ handleDismiss }
					dismissLabel={ __( 'Maybe later', 'google-site-kit' ) }
					ctaLabel={ __( 'Customize settings', 'google-site-kit' ) }
					ctaLink={ serviceURL }
					onCTAClick={ onCTAClick }
					isCTALinkExternal
				/>
			</WithGridWrapped>
		);
	}

	if ( publicationOnboardingState === PENDING_VERIFICATION ) {
		return (
			<WithGridWrapped>
				<SubtleNotification
					title={ __(
						'Your Reader Revenue Manager account was successfully set up!',
						'google-site-kit'
					) }
					description={ __(
						'Your publication is still awaiting review, you can check its status in Reader Revenue Manager.',
						'google-site-kit'
					) }
					onDismiss={ handleDismiss }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					ctaLabel={ __(
						'Check publication status',
						'google-site-kit'
					) }
					ctaLink={ serviceURL }
					onCTAClick={ onCTAClick }
					isCTALinkExternal
				/>
			</WithGridWrapped>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_ACTION_REQUIRED ) {
		return (
			<WithGridWrapped>
				<SubtleNotification
					title={ __(
						'Your Reader Revenue Manager account was successfully set up, but your publication still requires further setup in Reader Revenue Manager.',
						'google-site-kit'
					) }
					onDismiss={ handleDismiss }
					dismissLabel={ __( 'Got it', 'google-site-kit' ) }
					ctaLabel={ __(
						'Complete publication setup',
						'google-site-kit'
					) }
					ctaLink={ serviceURL }
					onCTAClick={ onCTAClick }
					isCTALinkExternal
					variant="warning"
				/>
			</WithGridWrapped>
		);
	}

	return null;
}

export default whenActive( { moduleName: READER_REVENUE_MANAGER_MODULE_SLUG } )(
	RRMSetupSuccessSubtleNotification
);
