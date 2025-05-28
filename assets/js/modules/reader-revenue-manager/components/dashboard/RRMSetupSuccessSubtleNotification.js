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
import {
	createInterpolateElement,
	useCallback,
	useEffect,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import useQueryArg from '../../../../hooks/useQueryArg';
import { useRefocus } from '../../../../hooks/useRefocus';
import { CORE_FORMS } from '../../../../googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '../../../../googlesitekit/datastore/site/constants';
import { CORE_UI } from '../../../../googlesitekit/datastore/ui/constants';
import {
	MODULES_READER_REVENUE_MANAGER,
	PUBLICATION_ONBOARDING_STATES,
	READER_REVENUE_MANAGER_MODULE_SLUG,
	READER_REVENUE_MANAGER_NOTICES_FORM,
	SYNC_PUBLICATION,
	UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
} from '../../datastore/constants';
import LearnMoreLink from '../../../../googlesitekit/notifications/components/common/LearnMoreLink';
import NoticeNotification from '../../../../googlesitekit/notifications/components/layout/NoticeNotification';
import { TYPES } from '../../../../components/Notice/constants';

const {
	ONBOARDING_COMPLETE,
	PENDING_VERIFICATION,
	ONBOARDING_ACTION_REQUIRED,
} = PUBLICATION_ONBOARDING_STATES;

export default function RRMSetupSuccessSubtleNotification( {
	id,
	Notification,
} ) {
	const [ notification, setNotification ] = useQueryArg( 'notification' );
	const [ slug, setSlug ] = useQueryArg( 'slug' );

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

	const currentOnboardingState = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPublicationOnboardingState()
	);

	const paymentOption = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getPaymentOption()
	);

	const productID = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductID()
	);

	const productIDs = useSelect( ( select ) =>
		select( MODULES_READER_REVENUE_MANAGER ).getProductIDs()
	);

	const settingsURL = useSelect( ( select ) =>
		select( CORE_SITE ).getAdminURL( 'googlesitekit-settings' )
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

	const onCTAClick = () => {
		// Set publication data to be reset when user re-focuses window.
		if (
			actionableOnboardingStates.includes( publicationOnboardingState )
		) {
			setValues( READER_REVENUE_MANAGER_NOTICES_FORM, {
				[ SYNC_PUBLICATION ]: true,
			} );
		}

		global.open( serviceURL, '_blank' );
	};

	const syncPublication = useCallback( async () => {
		if ( ! shouldSyncPublication ) {
			return;
		}

		const { response } = await syncPublicationOnboardingState();
		const newOnboardingState = response?.publicationOnboardingState;

		if (
			currentOnboardingState &&
			newOnboardingState !== currentOnboardingState &&
			newOnboardingState ===
				PUBLICATION_ONBOARDING_STATES.ONBOARDING_COMPLETE
		) {
			setValue(
				UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
				true
			);
		}
	}, [
		currentOnboardingState,
		setValue,
		shouldSyncPublication,
		syncPublicationOnboardingState,
	] );

	// Sync publication data when user re-focuses window.
	useRefocus( syncPublication, 15000 );

	const showingSuccessNotification =
		notification === 'authentication_success' &&
		slug === READER_REVENUE_MANAGER_MODULE_SLUG;

	// On successful module setup, if the payment option is not set,
	// show the publication approved overlay notification.
	useEffect( () => {
		if (
			showingSuccessNotification &&
			publicationOnboardingState === ONBOARDING_COMPLETE &&
			paymentOption === ''
		) {
			setValue(
				UI_KEY_READER_REVENUE_MANAGER_SHOW_PUBLICATION_APPROVED_NOTIFICATION,
				true
			);

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
			hasCustomProductID ? 'yes' : 'no'
		}`,
	};

	if ( publicationOnboardingState === PENDING_VERIFICATION ) {
		return (
			<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
				<NoticeNotification
					notificationID={ id }
					type={ TYPES.SUCCESS }
					gaTrackingEventArgs={ gaTrackingEventArgs }
					title={ __(
						'Your Reader Revenue Manager account was successfully set up!',
						'google-site-kit'
					) }
					description={ __(
						'Your publication is still awaiting review, you can check its status in Reader Revenue Manager.',
						'google-site-kit'
					) }
					dismissButton={ {
						onClick: dismissNotice,
					} }
					ctaButton={ {
						label: __(
							'Check publication status',
							'google-site-kit'
						),
						onClick: onCTAClick,
						external: true,
					} }
				/>
			</Notification>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_ACTION_REQUIRED ) {
		return (
			<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
				<NoticeNotification
					type={ TYPES.WARNING }
					notificationID={ id }
					gaTrackingEventArgs={ gaTrackingEventArgs }
					title={ __(
						'Your Reader Revenue Manager account was successfully set up, but your publication still requires further setup in Reader Revenue Manager.',
						'google-site-kit'
					) }
					dismissButton={ {
						onClick: dismissNotice,
					} }
					ctaButton={ {
						label: __(
							'Complete publication setup',
							'google-site-kit'
						),
						onClick: onCTAClick,
						external: true,
					} }
				/>
			</Notification>
		);
	}

	if ( publicationOnboardingState === ONBOARDING_COMPLETE ) {
		// Do not show the notification if the payment option is not set.
		if ( '' === paymentOption ) {
			return null;
		}

		const notificationContent = {
			title: __(
				'Success! Your Reader Revenue Manager account is set up',
				'google-site-kit'
			),
			description: '',
			primaryButton: {
				text: __( 'Manage CTAs', 'google-site-kit' ),
				ctaLink: `${ settingsURL }#connected-services/reader-revenue-manager/edit`,
				isCTALinkExternal: false,
			},
			secondaryButton: {
				text: __( 'Got it', 'google-site-kit' ),
				onClick: dismissNotice,
			},
		};

		switch ( paymentOption ) {
			case 'subscriptions':
				if ( productID === 'openaccess' ) {
					notificationContent.description = __(
						'You can edit your settings to manage product IDs and select which of your site’s pages will include a subscription CTA.',
						'google-site-kit'
					);
				} else {
					notificationContent.description = __(
						'You can edit your settings and select which of your site’s pages will include a subscription CTA.',
						'google-site-kit'
					);
				}
				break;
			case 'contributions':
				if ( productIDs.length > 0 && productID === 'openaccess' ) {
					notificationContent.description = __(
						'You can edit your settings to manage product IDs and select which of your site’s pages will include a contribution CTA.',
						'google-site-kit'
					);
				} else {
					notificationContent.description = __(
						'You can edit your settings and select which of your site’s pages will include a contribution CTA.',
						'google-site-kit'
					);
				}
				break;
			case 'noPayment':
				notificationContent.description = createInterpolateElement(
					__(
						'Explore Reader Revenue Manager’s additional features, such as paywalls, subscriptions and contributions. <a>Learn more</a>',
						'google-site-kit'
					),
					{
						a: (
							<LearnMoreLink
								id={ id }
								ariaLabel={ __(
									'Learn more about Reader Revenue Manager features',
									'google-site-kit'
								) }
								label={ __( 'Learn more', 'google-site-kit' ) }
								url="https://support.google.com/news/publisher-center/answer/12813936"
								hideExternalIndicator
								gaTrackingEventArgs={ gaTrackingEventArgs }
							/>
						),
					}
				);
				notificationContent.primaryButton = {
					text: __( 'Get started', 'google-site-kit' ),
					ctaLink: serviceURL,
					isCTALinkExternal: true,
				};
				break;
		}

		return (
			<Notification gaTrackingEventArgs={ gaTrackingEventArgs }>
				<NoticeNotification
					notificationID={ id }
					type={ TYPES.SUCCESS }
					gaTrackingEventArgs={ gaTrackingEventArgs }
					title={ notificationContent.title }
					description={ notificationContent.description }
					dismissButton={ {
						label: notificationContent.secondaryButton.text,
						onClick: notificationContent.secondaryButton.onClick,
					} }
					ctaButton={ {
						label: notificationContent.primaryButton.text,
						href: notificationContent.primaryButton.ctaLink,
						external:
							notificationContent.primaryButton.isCTALinkExternal,
					} }
				/>
			</Notification>
		);
	}

	return null;
}
