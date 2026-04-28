/**
 * WelcomeModal component.
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
 * WordPress dependencies
 */
import {
	createInterpolateElement,
	useCallback,
	useState,
	Fragment,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { ReactElement, useEffect, useRef } from 'react';
import { useIntersection } from 'react-use';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, type Select } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import {
	CORE_USER,
	WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG,
	WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG,
} from '@/js/googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '@/js/modules/analytics-4/datastore/constants';
import { MODULES_SEARCH_CONSOLE } from '@/js/modules/search-console/datastore/constants';
import { MODULE_SLUG_ANALYTICS_4 } from '@/js/modules/analytics-4/constants';
import { Button } from 'googlesitekit-components';
import { Dialog, DialogContent, DialogFooter } from '@/js/material-components';
import P from '@/js/components/Typography/P';
import Typography from '@/js/components/Typography';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
// @ts-expect-error - We need to add types for imported SVGs.
import CloseIcon from '@/svg/icons/close.svg';
// @ts-expect-error - We need to add types for imported SVGs.
import WelcomeModalGraphic from '@/svg/graphics/welcome-modal-graphic.svg';
// @ts-expect-error - We need to add types for imported SVGs.
import WelcomeModalDataGatheringCompleteGraphic from '@/svg/graphics/welcome-modal-data-gathering-complete-graphic.svg';
import useQueryArg from '@/js/hooks/useQueryArg';
import { trackEvent } from '@/js/util';
import { deleteItem, getItem } from '@/js/googlesitekit/api/cache';
import { useWelcomeTour } from '@/js/feature-tours/hooks/useWelcomeTour';
import useViewContext from '@/js/hooks/useViewContext';

enum MODAL_VARIANT {
	DATA_AVAILABLE,
	GATHERING_DATA,
	DATA_GATHERING_COMPLETE,
}

const VARIANT_TRACKING_LABELS = {
	[ MODAL_VARIANT.DATA_AVAILABLE ]: 'default',
	[ MODAL_VARIANT.GATHERING_DATA ]: 'gathering_data',
	[ MODAL_VARIANT.DATA_GATHERING_COMPLETE ]: 'data_available',
};

/**
 * Determines whether the given modal variant should be rendered based on the
 * data gathering complete modal active state.
 *
 * @since n.e.x.t
 *
 * @param {Object}        options                                    The options.
 * @param {MODAL_VARIANT} options.modalVariant                       The computed modal variant.
 * @param {boolean}       options.isDataGatheringCompleteModalActive Whether the data gathering complete modal is active.
 * @return {boolean} Whether the modal variant should be rendered.
 */
function shouldRenderModalVariant( {
	modalVariant,
	isDataGatheringCompleteModalActive,
}: {
	modalVariant: MODAL_VARIANT;
	isDataGatheringCompleteModalActive: boolean;
} ): boolean {
	// The GATHERING_DATA variant should not render while the data gathering
	// complete modal state is active — the DATA_GATHERING_COMPLETE variant
	// will be shown instead.
	if (
		isDataGatheringCompleteModalActive &&
		modalVariant === MODAL_VARIANT.GATHERING_DATA
	) {
		return false;
	}

	// The DATA_GATHERING_COMPLETE variant must not render when the data
	// gathering complete modal state is not active, e.g. when the user
	// re-submits Key Metrics after already dismissing the modal.
	if (
		! isDataGatheringCompleteModalActive &&
		modalVariant === MODAL_VARIANT.DATA_GATHERING_COMPLETE
	) {
		return false;
	}

	return true;
}

export default function WelcomeModal() {
	const viewContext = useViewContext();

	const [ isOpen, setIsOpen ] = useState( true );

	const analyticsConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 ),
		[]
	);

	const analyticsGatheringData = useSelect(
		( select: Select ) => {
			if ( ! analyticsConnected ) {
				return false;
			}
			return select( MODULES_ANALYTICS_4 ).isGatheringData();
		},
		[ analyticsConnected ]
	);

	const searchConsoleGatheringData = useSelect(
		( select: Select ) =>
			select( MODULES_SEARCH_CONSOLE ).isGatheringData(),
		[]
	);

	const isGatheringDataVariantDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG
			),
		[]
	);

	const showGatheringDataModal = analyticsConnected
		? analyticsGatheringData
		: searchConsoleGatheringData;

	let modalVariant: MODAL_VARIANT;

	if ( showGatheringDataModal ) {
		modalVariant = MODAL_VARIANT.GATHERING_DATA;
	} else {
		modalVariant = isGatheringDataVariantDismissed
			? MODAL_VARIANT.DATA_GATHERING_COMPLETE
			: MODAL_VARIANT.DATA_AVAILABLE;
	}

	const { dismissItem, triggerOnDemandTour } = useDispatch( CORE_USER );
	const [ , setNotification ] = useQueryArg( 'notification' );

	const tooltipSettings = {
		target: '.googlesitekit-help-menu__button',
		tooltipSlug: 'welcome-modal',
		title: __(
			'You can always take the dashboard tour from the help menu',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
		gaTrackingEventLabel: VARIANT_TRACKING_LABELS[ modalVariant ],
	};

	const showTooltip = useShowTooltip( tooltipSettings );

	const closeAndDismissModal = useCallback( async () => {
		setIsOpen( false );

		if ( modalVariant !== MODAL_VARIANT.GATHERING_DATA ) {
			await dismissItem( WELCOME_WITH_TOUR_DISMISSED_ITEM_SLUG );
		}

		if (
			modalVariant === MODAL_VARIANT.GATHERING_DATA ||
			modalVariant === MODAL_VARIANT.DATA_AVAILABLE
		) {
			await dismissItem( WELCOME_GATHERING_DATA_DISMISSED_ITEM_SLUG );
		}

		// Ensure the setup success notification won't be shown on page reload.
		setNotification( undefined );
	}, [ modalVariant, setNotification, dismissItem ] );

	const closeAndDismissModalWithTooltip = useCallback( () => {
		closeAndDismissModal();

		if ( modalVariant !== MODAL_VARIANT.GATHERING_DATA ) {
			showTooltip();
		}
	}, [ closeAndDismissModal, modalVariant, showTooltip ] );

	const welcomeTour = useWelcomeTour();

	const startTourAndClose = useCallback( () => {
		closeAndDismissModal();
		triggerOnDemandTour( welcomeTour );
	}, [ closeAndDismissModal, triggerOnDemandTour, welcomeTour ] );

	const intersectionRef = useRef( null );

	const intersectionEntry = useIntersection( intersectionRef, {
		threshold: 0.25,
	} );
	const [ hasBeenInView, setHasBeenInView ] = useState( false );
	const inView = !! intersectionEntry?.intersectionRatio;

	useEffect( () => {
		if ( ! inView || hasBeenInView ) {
			return;
		}

		setHasBeenInView( true );

		trackEvent(
			`${ viewContext }_welcome-modal`,
			'view_notice',
			VARIANT_TRACKING_LABELS[ modalVariant ]
		);

		async function trackSetupEventsOnce() {
			const startSiteSetup = await getItem( 'start_site_setup' );
			const startUserSetup = await getItem( 'start_user_setup' );

			if ( startSiteSetup.cacheHit ) {
				await deleteItem( 'start_site_setup' );
				trackEvent(
					`${ viewContext }_setup`,
					'setup_flow_v3_complete_site_setup'
				);
			}
			if ( startUserSetup.cacheHit ) {
				await deleteItem( 'start_user_setup' );
				trackEvent(
					`${ viewContext }_setup`,
					'setup_flow_v3_complete_user_setup'
				);
			}
		}

		trackSetupEventsOnce();
	}, [ inView, hasBeenInView, viewContext, modalVariant ] );

	const trackConfirmation = useCallback( () => {
		trackEvent(
			`${ viewContext }_welcome-modal`,
			'confirm_notice',
			VARIANT_TRACKING_LABELS[ modalVariant ]
		);
	}, [ viewContext, modalVariant ] );

	const trackDismissal = useCallback( () => {
		trackEvent(
			`${ viewContext }_welcome-modal`,
			'dismiss_notice',
			VARIANT_TRACKING_LABELS[ modalVariant ]
		);
	}, [ viewContext, modalVariant ] );

	const isDataGatheringCompleteModalActive = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isDataGatheringCompleteModalActive(),
		[]
	);

	if (
		! shouldRenderModalVariant( {
			modalVariant,
			isDataGatheringCompleteModalActive,
		} )
	) {
		return null;
	}

	if ( showGatheringDataModal === undefined ) {
		// TODO: Implement a loading state when we have a design for it in phase 3 of the Setup Flow Refresh epic.
		return null;
	}

	if ( ! isOpen ) {
		return null;
	}

	const title =
		modalVariant === MODAL_VARIANT.DATA_GATHERING_COMPLETE
			? __( 'Data gathering complete!', 'google-site-kit' )
			: __( 'Welcome to Site Kit', 'google-site-kit' );

	let description: string | ReactElement;

	switch ( modalVariant ) {
		case MODAL_VARIANT.DATA_AVAILABLE:
			description = __(
				'Initial setup complete! Take a look at the special features Site Kit added to your dashboard based on your site goals',
				'google-site-kit'
			);
			break;
		case MODAL_VARIANT.GATHERING_DATA:
			description = createInterpolateElement(
				__(
					'Initial setup complete!<br />Site Kit is gathering data and soon metrics for your site will show on your dashboard',
					'google-site-kit'
				),
				{
					br: <br />,
				}
			);
			break;
		case MODAL_VARIANT.DATA_GATHERING_COMPLETE:
			description = __(
				'Take this quick tour to see the most important parts of your dashboard. It will show you where to look to track your site’s success as you get more visitors.',
				'google-site-kit'
			);
			break;
	}

	return (
		<Dialog
			className="googlesitekit-dialog googlesitekit-dialog--with-mobile-margins googlesitekit-welcome-modal"
			onClose={ () => {
				trackDismissal();
				closeAndDismissModalWithTooltip();
			} }
			open
		>
			<DialogContent className="googlesitekit-welcome-modal__content">
				<div
					ref={ intersectionRef }
					className="googlesitekit-welcome-modal__graphic"
				>
					{ modalVariant === MODAL_VARIANT.DATA_GATHERING_COMPLETE ? (
						<WelcomeModalDataGatheringCompleteGraphic />
					) : (
						<WelcomeModalGraphic />
					) }

					<Button
						// @ts-expect-error - The `Button` component is not typed yet.
						className="googlesitekit-welcome-modal__close-button"
						icon={ <CloseIcon width={ 10 } height={ 10 } /> }
						onClick={ () => {
							trackDismissal();
							closeAndDismissModalWithTooltip();
						} }
						aria-label={ __( 'Close', 'google-site-kit' ) }
						hideTooltipTitle
					/>
				</div>

				<div className="googlesitekit-welcome-modal__text">
					<Typography
						as="h1"
						className="googlesitekit-welcome-modal__title"
						size="large"
						type="headline"
					>
						{ title }
					</Typography>

					<P
						type="body"
						size="medium"
						className="googlesitekit-welcome-modal__description"
					>
						{ description }
					</P>
				</div>
			</DialogContent>

			<DialogFooter className="googlesitekit-welcome-modal__footer">
				{ modalVariant === MODAL_VARIANT.GATHERING_DATA ? (
					// @ts-expect-error - The `Button` component is not typed yet.
					<Button
						onClick={ () => {
							trackConfirmation();
							closeAndDismissModal();
						} }
					>
						{ __( 'Get started', 'google-site-kit' ) }
					</Button>
				) : (
					<Fragment>
						{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
						<Button
							onClick={ () => {
								trackDismissal();
								closeAndDismissModalWithTooltip();
							} }
							tertiary
						>
							{ __( 'Maybe later', 'google-site-kit' ) }
						</Button>
						{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
						<Button
							onClick={ () => {
								trackConfirmation();
								startTourAndClose();
							} }
						>
							{ __( 'Start tour', 'google-site-kit' ) }
						</Button>
					</Fragment>
				) }
			</DialogFooter>
		</Dialog>
	);
}
