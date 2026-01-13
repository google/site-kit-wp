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
 * Internal dependencies
 */
import { useSelect, useDispatch } from 'googlesitekit-data';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
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

export const WITH_TOUR_DISMISSED_ITEM_SLUG = 'welcome-modal-with-tour';
export const GATHERING_DATA_DISMISSED_ITEM_SLUG =
	'welcome-modal-gathering-data';

const MODAL_VARIANT = {
	DATA_AVAILABLE: 'data-available',
	GATHERING_DATA: 'gathering-data',
	DATA_GATHERING_COMPLETE: 'data-gathering-complete',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/data` is not typed yet.
type SelectFunction = ( select: any ) => any;

export default function WelcomeModal() {
	const [ isOpen, setIsOpen ] = useState( true );

	const analyticsConnected = useSelect( ( select: SelectFunction ) =>
		select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ANALYTICS_4 )
	);

	const analyticsGatheringData = useSelect( ( select: SelectFunction ) => {
		if ( ! analyticsConnected ) {
			return false;
		}
		return select( MODULES_ANALYTICS_4 ).isGatheringData();
	} );

	const searchConsoleGatheringData = useSelect( ( select: SelectFunction ) =>
		select( MODULES_SEARCH_CONSOLE ).isGatheringData()
	);

	const isGatheringDataVariantDismissed = useSelect(
		( select: SelectFunction ) =>
			select( CORE_USER ).isItemDismissed(
				GATHERING_DATA_DISMISSED_ITEM_SLUG
			)
	);

	const isWithTourVariantDismissed = useSelect( ( select: SelectFunction ) =>
		select( CORE_USER ).isItemDismissed( WITH_TOUR_DISMISSED_ITEM_SLUG )
	);

	const showGatheringDataModal = analyticsConnected
		? analyticsGatheringData
		: searchConsoleGatheringData;

	let modalVariant;

	if ( showGatheringDataModal ) {
		modalVariant = MODAL_VARIANT.GATHERING_DATA;
	} else {
		modalVariant = isGatheringDataVariantDismissed
			? MODAL_VARIANT.DATA_GATHERING_COMPLETE
			: MODAL_VARIANT.DATA_AVAILABLE;
	}

	const isItemDismissed =
		modalVariant === MODAL_VARIANT.GATHERING_DATA
			? isGatheringDataVariantDismissed
			: isWithTourVariantDismissed;

	const { dismissItem } = useDispatch( CORE_USER );

	const tooltipSettings = {
		target: '.googlesitekit-help-menu__button',
		tooltipSlug: 'dashboard-tour',
		title: __(
			'You can always take the dashboard tour from the help menu',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};

	const showTooltip = useShowTooltip( tooltipSettings );

	const closeAndDismissModal = useCallback( async () => {
		setIsOpen( false );

		const itemsToDismiss = [];

		if (
			modalVariant === MODAL_VARIANT.GATHERING_DATA ||
			modalVariant === MODAL_VARIANT.DATA_AVAILABLE
		) {
			itemsToDismiss.push( GATHERING_DATA_DISMISSED_ITEM_SLUG );
		}

		if ( modalVariant !== MODAL_VARIANT.GATHERING_DATA ) {
			itemsToDismiss.push( WITH_TOUR_DISMISSED_ITEM_SLUG );
		}

		await Promise.all(
			itemsToDismiss.map( ( item ) => dismissItem( item ) )
		);
	}, [ modalVariant, dismissItem ] );

	const closeAndDismissModalWithTooltip = useCallback( async () => {
		await closeAndDismissModal();

		if ( modalVariant !== MODAL_VARIANT.GATHERING_DATA ) {
			showTooltip();
		}
	}, [ closeAndDismissModal, modalVariant, showTooltip ] );

	if ( showGatheringDataModal === undefined ) {
		// TODO: Implement a loading state when we have a design for it in phase 3 of the Setup Flow Refresh epic.
		return null;
	}

	if ( isItemDismissed || ! isOpen ) {
		return null;
	}

	const title =
		modalVariant === MODAL_VARIANT.DATA_GATHERING_COMPLETE
			? __( 'Data gathering complete!', 'google-site-kit' )
			: __( 'Welcome to Site Kit', 'google-site-kit' );

	let description;

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
			className="googlesitekit-dialog googlesitekit-welcome-modal"
			onClose={ closeAndDismissModalWithTooltip }
			open
		>
			<DialogContent className="googlesitekit-welcome-modal__content">
				<div className="googlesitekit-welcome-modal__graphic">
					{ modalVariant === MODAL_VARIANT.DATA_GATHERING_COMPLETE ? (
						<WelcomeModalDataGatheringCompleteGraphic />
					) : (
						<WelcomeModalGraphic />
					) }

					<Button
						// @ts-expect-error - The `Button` component is not typed yet.
						className="googlesitekit-welcome-modal__close-button"
						icon={ <CloseIcon width={ 10 } height={ 10 } /> }
						onClick={ closeAndDismissModalWithTooltip }
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
					<Button onClick={ closeAndDismissModal }>
						{ __( 'Get started', 'google-site-kit' ) }
					</Button>
				) : (
					<Fragment>
						{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
						<Button
							onClick={ closeAndDismissModalWithTooltip }
							tertiary
						>
							{ __( 'Maybe later', 'google-site-kit' ) }
						</Button>
						{ /* @ts-expect-error - The `Button` component is not typed yet. */ }
						<Button onClick={ closeAndDismissModal }>
							{ __( 'Start tour', 'google-site-kit' ) }
						</Button>
					</Fragment>
				) }
			</DialogFooter>
		</Dialog>
	);
}
