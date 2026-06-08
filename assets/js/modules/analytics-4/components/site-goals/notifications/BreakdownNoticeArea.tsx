/**
 * Site Goals breakdown notice area (orchestrator).
 *
 * Site Kit by Google, Copyright 2026 Google LLC
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
import { useCallback, useEffect, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Select, useDispatch, useSelect } from 'googlesitekit-data';
import { getItem, setItem } from '@/js/googlesitekit/api/cache';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import useViewOnly from '@/js/hooks/useViewOnly';
import {
	BREAKDOWN_DISMISSED_FORM_KEY,
	BREAKDOWN_GOAL_TYPE_FORM_KEY,
	BREAKDOWN_ORIGIN_FORM_KEY,
	BREAKDOWN_ORIGIN_WIDGET,
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GoalType } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
import BreakdownErrorNotice from '@/js/modules/analytics-4/components/site-goals/notifications/BreakdownErrorNotice';
import BreakdownNotice from '@/js/modules/analytics-4/components/site-goals/notifications/BreakdownNotice';
import BreakdownSuccessNotice from '@/js/modules/analytics-4/components/site-goals/notifications/BreakdownSuccessNotice';
import { SITE_GOALS_INTRO_MODAL_BANNER } from '@/js/modules/analytics-4/components/site-goals/notifications/IntroModalBanner';
import { useBreakdownNoticeTooltip } from '@/js/modules/analytics-4/components/site-goals/notifications/useBreakdownNoticeTooltip';
import { useSiteGoalsBreakdownNoticeCopy } from '@/js/modules/analytics-4/components/site-goals/notifications/useSiteGoalsBreakdownNoticeCopy';
import { useSiteGoalsBreakdownResultCopy } from '@/js/modules/analytics-4/components/site-goals/notifications/useSiteGoalsBreakdownResultCopy';
import {
	FORM_CUSTOM_DIMENSIONS_CREATE,
	MODULES_ANALYTICS_4,
} from '@/js/modules/analytics-4/datastore/constants';
import {
	ALL_CUSTOM_DIMENSIONS,
	useBreakdownEnableHandler,
} from '@/js/modules/analytics-4/hooks/useBreakdownEnableHandler';
import { DAY_IN_SECONDS } from '@/js/util';

export const AVAILABILITY_SYNC_CACHE_KEY =
	'analytics4_site-goals_breakdown_availability-synced';

interface BreakdownNoticeAreaProps {
	origin: string;
	goalType: GoalType;
}

type BreakdownNoticeState = 'error' | 'loading' | 'success' | 'new' | null;

interface ResolveBreakdownNoticeStateArgs {
	hasBreakdownDimensions: boolean;
	isIntroModalDismissed: boolean;
	isNoticeDismissed: boolean;
	creationError: unknown;
	isBusy: boolean;
	isDismissed: boolean;
	isClickedInstance: boolean;
	attempted: boolean;
}

function resolveBreakdownNoticeState(
	args: ResolveBreakdownNoticeStateArgs
): BreakdownNoticeState {
	const {
		hasBreakdownDimensions,
		isIntroModalDismissed,
		isNoticeDismissed,
		creationError,
		isBusy,
		isDismissed,
		isClickedInstance,
		attempted,
	} = args;

	// Error: render at every section whose own dimension is still missing after
	// an attempt — in both the widget and the Side Panel.
	if (
		creationError &&
		attempted &&
		hasBreakdownDimensions === false &&
		! isDismissed
	) {
		return 'error';
	}

	// Loading: only at the clicked instance. `isBusy` spans the whole enable
	// action — the click, the OAuth redirect and the dimension creation — so the
	// notice persists throughout.
	if ( isBusy && isClickedInstance ) {
		return 'loading';
	}

	// Success: a single notice at the clicked instance, once its dimension
	// actually exists (so a failed creation never shows success).
	if ( hasBreakdownDimensions && isClickedInstance && ! isDismissed ) {
		return 'success';
	}

	// "New": while this section's dimension is still missing, the intro modal has
	// been dismissed and the notice has not been dismissed (persisted "No
	// thanks"). It is suppressed once an enable was attempted this session, so a
	// section being created does not flash "New" while availability settles.
	if (
		hasBreakdownDimensions === false &&
		isIntroModalDismissed &&
		! isNoticeDismissed &&
		! attempted
	) {
		return 'new';
	}

	return null;
}

const BreakdownNoticeArea: FC< BreakdownNoticeAreaProps > = ( {
	origin,
	goalType,
} ) => {
	const { onEnable, inProgress, disabled } = useBreakdownEnableHandler(
		origin,
		goalType
	);

	// Keep the notice in its loading state from the moment the CTA is clicked,
	// covering the window before the OAuth redirect starts (when neither
	// `inProgress` nor `disabled` is true yet). Cleared once a real busy signal
	// takes over, and reset on reload.
	const [ isEnabling, setIsEnabling ] = useState( false );
	const handleEnable = useCallback( () => {
		setIsEnabling( true );
		onEnable();
	}, [ onEnable ] );
	useEffect( () => {
		if ( isEnabling && ( inProgress || disabled ) ) {
			setIsEnabling( false );
		}
	}, [ isEnabling, inProgress, disabled ] );
	const isBusy = inProgress || disabled || isEnabling;

	// On "No thanks", the widget shows the settings tooltip immediately while the
	// Side Panel defers it until the panel overlay closes (read on close in the
	// panel's `closePanel`). Both hooks always run; origin picks the behavior.
	const showBreakdownTooltip = useBreakdownNoticeTooltip();
	const {
		setSiteGoalsBreakdownTooltipPending,
		scheduleSyncAvailableCustomDimensions,
	} = useDispatch( MODULES_ANALYTICS_4 );
	const { setValues } = useDispatch( CORE_FORMS );

	// The synced `availableCustomDimensions` setting is only refreshed via report
	// errors, and no report yet queries the breakdown dimensions. Sync it (at
	// most once a day) so an out-of-band GA4 change to them is detected.
	//
	// TODO: Scope down once #12803 lands — its breakdown reports query these
	// dimensions while a breakdown is enabled, so the report-error sync then
	// covers that case and this can be limited to the not-yet-enabled one.
	useEffect( () => {
		let ignore = false;

		( async () => {
			const { cacheHit } = await getItem( AVAILABILITY_SYNC_CACHE_KEY );

			if ( ignore || cacheHit ) {
				return;
			}

			await setItem( AVAILABILITY_SYNC_CACHE_KEY, true, {
				ttl: DAY_IN_SECONDS,
			} );

			scheduleSyncAvailableCustomDimensions();
		} )();

		return () => {
			ignore = true;
		};
	}, [ scheduleSyncAvailableCustomDimensions ] );

	const onDismissComplete =
		origin === BREAKDOWN_ORIGIN_WIDGET
			? showBreakdownTooltip
			: () => setSiteGoalsBreakdownTooltipPending( true );

	const isViewOnly = useViewOnly();

	// Trigger the resolver so hasCustomDimensions checks against synced data.
	useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions(),
		[]
	);

	// Each section gates on its own breakdown dimension: the ecommerce sections
	// on the plugin-source dimension, the lead generation sections on the form
	// dimension. The CTA still creates every missing dimension.
	const requiredDimension =
		SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[ goalType ];
	const hasBreakdownDimensions = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				requiredDimension
			),
		[ requiredDimension ]
	);
	const creationError = useSelect( ( select: Select ) => {
		for ( const customDimension of ALL_CUSTOM_DIMENSIONS ) {
			const error =
				select( MODULES_ANALYTICS_4 ).getCreateCustomDimensionError(
					customDimension
				);

			if ( error ) {
				return error;
			}
		}

		return undefined;
	}, [] );
	const isIntroModalDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed(
				SITE_GOALS_INTRO_MODAL_BANNER
			),
		[]
	);
	const isNoticeDismissed = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isItemDismissed( SITE_GOALS_BREAKDOWN_NOTICE ),
		[]
	);

	const [ breakdownOrigin ] = useFormValue(
		FORM_CUSTOM_DIMENSIONS_CREATE,
		BREAKDOWN_ORIGIN_FORM_KEY
	);
	const [ breakdownGoalType ] = useFormValue(
		FORM_CUSTOM_DIMENSIONS_CREATE,
		BREAKDOWN_GOAL_TYPE_FORM_KEY
	);
	const [ isDismissed ] = useFormValue(
		FORM_CUSTOM_DIMENSIONS_CREATE,
		BREAKDOWN_DISMISSED_FORM_KEY
	);

	const noticeCopy = useSiteGoalsBreakdownNoticeCopy( goalType );

	const className =
		origin === BREAKDOWN_ORIGIN_WIDGET
			? 'googlesitekit-site-goals-breakdown-notice'
			: 'googlesitekit-site-goals-selection-panel__breakdown-notice';

	// Result copy depends on the goal type only; the success and error notices
	// are identical in the widget and the Side Panel.
	const { successTitle, successDescription, permissionsErrorTitle } =
		useSiteGoalsBreakdownResultCopy( goalType );

	// Dismiss the in-session success/error notice and drop the shared
	// `customDimensions` list so unrelated auto-create flows don't inherit it.
	function dismissBreakdownResult() {
		return setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
			[ BREAKDOWN_DISMISSED_FORM_KEY ]: true,
			customDimensions: [],
		} );
	}

	if ( isViewOnly ) {
		return null;
	}

	// Avoid a flash while any of the gating selectors are still resolving.
	if (
		hasBreakdownDimensions === undefined ||
		isIntroModalDismissed === undefined ||
		isNoticeDismissed === undefined
	) {
		return null;
	}

	const noticeState = resolveBreakdownNoticeState( {
		hasBreakdownDimensions,
		isIntroModalDismissed,
		isNoticeDismissed,
		creationError,
		isBusy,
		isDismissed: Boolean( isDismissed ),
		isClickedInstance:
			breakdownOrigin === origin && breakdownGoalType === goalType,
		attempted: Boolean( breakdownGoalType ),
	} );

	if ( noticeState === 'error' ) {
		return (
			<BreakdownErrorNotice
				className={ className }
				error={ creationError }
				permissionsTitle={ permissionsErrorTitle }
				onRetry={ handleEnable }
				onDismiss={ dismissBreakdownResult }
			/>
		);
	}

	if ( noticeState === 'success' ) {
		return (
			<BreakdownSuccessNotice
				className={ className }
				title={ successTitle }
				description={ successDescription }
				onDismiss={ dismissBreakdownResult }
			/>
		);
	}

	// Both 'loading' and 'new' render the "New" notice. In the loading state the
	// enable action is underway, so the CTA shows a spinner and is disabled so it
	// can't be triggered again.
	if ( noticeState === 'loading' || noticeState === 'new' ) {
		const ctaBusy = noticeState === 'loading';

		return (
			<BreakdownNotice
				className={ className }
				{ ...noticeCopy }
				onCTAClick={ handleEnable }
				ctaInProgress={ ctaBusy }
				ctaDisabled={ ctaBusy }
				onDismissComplete={ onDismissComplete }
			/>
		);
	}

	return null;
};

export default BreakdownNoticeArea;
