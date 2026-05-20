/**
 * AdSenseConnectCTAWidget component.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
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
import { FC } from 'react';

/**
 * WordPress dependencies
 */
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSelect, useDispatch, Select } from 'googlesitekit-data';
import AdSenseConnectCTA from '@/js/modules/adsense/components/common/AdSenseConnectCTA';
import {
	ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY,
	ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY,
	MODULE_SLUG_ADSENSE,
} from '@/js/modules/adsense/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_MODULES } from '@/js/googlesitekit/modules/datastore/constants';
import { useShowTooltip } from '@/js/components/AdminScreenTooltip';
import WidgetDismissTransition from '@/js/googlesitekit/widgets/components/WidgetDismissTransition';
import { getNavigationalScrollTop } from '@/js/util/scroll';
import { useBreakpoint } from '@/js/hooks/useBreakpoint';
import { ANCHOR_ID_SPEED } from '@/js/googlesitekit/constants';
import type { WidgetComponentProps } from '@/js/googlesitekit/widgets/util/get-widget-component-props';

const AdSenseConnectCTAWidget: FC< WidgetComponentProps > = ( {
	Widget,
	WidgetNull,
} ) => {
	const { dismissItem } = useDispatch( CORE_USER );
	const breakpoint = useBreakpoint();

	// Captured on the first non-loading render: if the widget was already
	// dismissed before this component mounted (e.g. a previous session),
	// skip the animation entirely and render WidgetNull. Distinguishes a
	// page-reload-after-dismissal from an in-session dismissal.
	const wasInitiallyDismissedRef = useRef< boolean | null >( null );
	// Set by `WidgetDismissTransition` via `onDismissComplete` once the
	// fade has fully played out. After this flips true, render WidgetNull.
	const [ animationComplete, setAnimationComplete ] = useState( false );

	const tooltipSettings = {
		tooltipSlug: ADSENSE_CTA_WIDGET_TOOLTIP_STATE_KEY,
		title: __(
			'You can always connect AdSense from here later',
			'google-site-kit'
		),
		content: __(
			'The Monetization section will be added back to your dashboard if you connect AdSense in Settings later',
			'google-site-kit'
		),
		dismissLabel: __( 'Got it', 'google-site-kit' ),
	};
	const showTooltip = useShowTooltip( tooltipSettings );

	const adSenseModuleConnected = useSelect(
		( select: Select ) =>
			select( CORE_MODULES ).isModuleConnected( MODULE_SLUG_ADSENSE ),
		[]
	);
	const hasDismissedWidget = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY
			),
		[]
	);
	const isDismissingItem = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isDismissingItem(
				ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY
			),
		[]
	);

	const handleDismissModule = useCallback( async () => {
		showTooltip();
		await dismissItem( ADSENSE_CTA_WIDGET_DISMISSED_ITEM_KEY );
	}, [ dismissItem, showTooltip ] );

	const handleDismissComplete = useCallback( () => {
		// Smoothly scroll to the heading of the preceding section (PageSpeed
		// Insights, anchored at `#speed`) using the existing dashboard scroll
		// utility. Matches the pattern in `useNavChipHelpers.scrollToChip`.
		global.scrollTo( {
			top: getNavigationalScrollTop(
				`#${ ANCHOR_ID_SPEED }`,
				breakpoint
			),
			behavior: 'smooth',
		} );
		setAnimationComplete( true );
	}, [ breakpoint ] );

	// Render gating, in order:
	// 1. Loading: any lifecycle selector still resolving → WidgetNull.
	// 2. AdSense connected (user activated it) → WidgetNull.
	// 3. Dismissed in a previous session (captured on first non-loading
	//    render) → WidgetNull.
	// 4. Wrapper has signalled animation completion → WidgetNull.
	// 5. Otherwise: render wrapper (visible, in flight, or animating out).
	if (
		adSenseModuleConnected === undefined ||
		hasDismissedWidget === undefined ||
		isDismissingItem === undefined
	) {
		return <WidgetNull />;
	}

	if ( wasInitiallyDismissedRef.current === null ) {
		wasInitiallyDismissedRef.current = hasDismissedWidget;
	}

	if ( adSenseModuleConnected === true ) {
		return <WidgetNull />;
	}

	if ( wasInitiallyDismissedRef.current === true ) {
		return <WidgetNull />;
	}

	if ( animationComplete ) {
		return <WidgetNull />;
	}

	return (
		<WidgetDismissTransition
			isDismissing={ isDismissingItem }
			isDismissed={ hasDismissedWidget }
			onDismissComplete={ handleDismissComplete }
		>
			<Widget noPadding>
				<AdSenseConnectCTA
					onDismissModule={ handleDismissModule }
					isDismissing={ isDismissingItem }
				/>
			</Widget>
		</WidgetDismissTransition>
	);
};

export default AdSenseConnectCTAWidget;
