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
import {
	CORE_USER,
	PERMISSION_MANAGE_OPTIONS,
} from '@/js/googlesitekit/datastore/user/constants';
import useFormValue from '@/js/hooks/useFormValue';
import useViewContext from '@/js/hooks/useViewContext';
import useViewOnly from '@/js/hooks/useViewOnly';
import {
	BREAKDOWN_DISMISSED_FORM_KEY,
	BREAKDOWN_ORIGIN_FORM_KEY,
	BREAKDOWN_ORIGIN_WIDGET,
	BREAKDOWN_SCOPE_BOTH,
	BREAKDOWN_SCOPE_FORM_KEY,
	SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE,
	SITE_GOALS_BREAKDOWN_NOTICE,
} from '@/js/modules/analytics-4/components/site-goals/constants';
import { GOAL_TYPES } from '@/js/modules/analytics-4/components/site-goals/goal-drivers/constants';
import {
	BreakdownScope,
	GoalType,
} from '@/js/modules/analytics-4/components/site-goals/goal-drivers/types';
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
import { DAY_IN_SECONDS, trackEvent } from '@/js/util';
import { isInsufficientPermissionsError } from '@/js/util/errors';

export const AVAILABILITY_SYNC_CACHE_KEY =
	'analytics4_site-goals_breakdown_availability-synced';

interface BreakdownNoticeAreaProps {
	origin: string;
	goalTypes: GoalType[];
}

type BreakdownNoticeState = 'error' | 'loading' | 'success' | 'new' | null;

function deriveBreakdownScope( goalTypes: GoalType[] ): BreakdownScope {
	const hasEcommerce = goalTypes.includes( GOAL_TYPES.ECOMMERCE );
	const hasLead = goalTypes.includes( GOAL_TYPES.LEAD );

	if ( hasEcommerce && hasLead ) {
		return BREAKDOWN_SCOPE_BOTH;
	}

	return hasEcommerce ? GOAL_TYPES.ECOMMERCE : GOAL_TYPES.LEAD;
}

interface BreakdownDimensionStateArgs {
	goalTypes: GoalType[];
	presenceByGoalType: Record< GoalType, boolean | undefined >;
}

interface BreakdownDimensionState {
	hasBreakdownDimensions: boolean | undefined;
	/**
	 * Scope derived from the goal types whose dimension is still missing.
	 * Determines the "New"/loading copy and the scope passed to the
	 * "enable" handler.
	 */
	missingScope: BreakdownScope;
}

function getBreakdownDimensionState(
	args: BreakdownDimensionStateArgs
): BreakdownDimensionState {
	const { goalTypes, presenceByGoalType } = args;

	const dimensionsResolving = goalTypes.some(
		( goalType ) => presenceByGoalType[ goalType ] === undefined
	);
	const missingGoalTypes = goalTypes.filter(
		( goalType ) => presenceByGoalType[ goalType ] === false
	);

	return {
		hasBreakdownDimensions: dimensionsResolving
			? undefined
			: missingGoalTypes.length === 0,
		// Derived from what is still missing; once nothing is missing it falls
		// back to the full set (then only used for the handler, never rendered).
		missingScope: deriveBreakdownScope(
			missingGoalTypes.length ? missingGoalTypes : goalTypes
		),
	};
}

interface BreakdownClickedInstanceArgs {
	breakdownOrigin: unknown;
	origin: string;
	breakdownScope: unknown;
	goalTypes: GoalType[];
}

function isBreakdownClickedInstance(
	args: BreakdownClickedInstanceArgs
): boolean {
	const { breakdownOrigin, origin, breakdownScope, goalTypes } = args;

	if ( breakdownOrigin !== origin ) {
		return false;
	}

	// The Side Panel renders a single combined notice, so an origin match alone
	// identifies it. The widgets render one notice per goal type, so they also
	// match on scope to keep the two apart.
	return goalTypes.length > 1 || breakdownScope === goalTypes[ 0 ];
}

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

interface ComputeNoticeStateArgs {
	isViewOnly: boolean;
	hasBreakdownDimensions: boolean | undefined;
	isIntroModalDismissed: boolean | undefined;
	isNoticeDismissed: boolean | undefined;
	creationError: unknown;
	isBusy: boolean;
	isDismissed: boolean;
	isClickedInstance: boolean;
	attempted: boolean;
}

/**
 * Resolves the notice state, gating on the view-only and still-resolving cases.
 *
 * @since 1.182.0
 *
 * @param {Object} args Resolver arguments, see `ComputeNoticeStateArgs`.
 * @return {?string} The resolved notice state, or `null` while gated or when no notice applies.
 */
function computeNoticeState(
	args: ComputeNoticeStateArgs
): BreakdownNoticeState {
	const {
		isViewOnly,
		hasBreakdownDimensions,
		isIntroModalDismissed,
		isNoticeDismissed,
		...rest
	} = args;

	// Avoid a flash while any of the gating selectors are still resolving.
	if (
		isViewOnly ||
		hasBreakdownDimensions === undefined ||
		isIntroModalDismissed === undefined ||
		isNoticeDismissed === undefined
	) {
		return null;
	}

	return resolveBreakdownNoticeState( {
		hasBreakdownDimensions,
		isIntroModalDismissed,
		isNoticeDismissed,
		...rest,
	} );
}

interface UseBreakdownNoticeTrackingArgs {
	origin: string;
	goalTypes: GoalType[];
	creationError: unknown;
	noticeState: BreakdownNoticeState;
	handleEnable: () => void;
	onDismissComplete: () => void;
	dismissBreakdownResult: () => void;
}

/**
 * Tracks the breakdown notice area's view/confirm/dismiss events.
 *
 * Kept outside the main component to keep its cyclomatic complexity within
 * the project's lint threshold.
 *
 * @since 1.182.0
 *
 * @param {Object}   args                        Hook arguments.
 * @param {string}   args.origin                 Notice origin, either the widget or the Side Panel.
 * @param {Array}    args.goalTypes              Goal types the notice area covers.
 * @param {*}        args.creationError          Custom dimension creation error, if any.
 * @param {?string}  args.noticeState            Resolved notice state being displayed.
 * @param {Function} args.handleEnable           Triggers the breakdown "enable" action.
 * @param {Function} args.onDismissComplete      Called once the "New" notice's dismissal is persisted.
 * @param {Function} args.dismissBreakdownResult Persists dismissal of the success/error notice.
 * @return {Object} The tracked event handlers for the notice variants.
 */
function useBreakdownNoticeTracking( {
	origin,
	goalTypes,
	creationError,
	noticeState,
	handleEnable,
	onDismissComplete,
	dismissBreakdownResult,
}: UseBreakdownNoticeTrackingArgs ) {
	const viewContext = useViewContext();

	// `widget_ecommerce` | `widget_lead` | `side_panel`: the widgets render one
	// notice per goal type, while the Side Panel renders a single combined one.
	const noticeLabel =
		origin === BREAKDOWN_ORIGIN_WIDGET
			? `widget_${ goalTypes[ 0 ] }`
			: 'side_panel';
	const errorLabel =
		creationError && isInsufficientPermissionsError( creationError )
			? 'insufficient_permissions'
			: 'setup_error';

	useEffect( () => {
		if ( noticeState === 'new' || noticeState === 'loading' ) {
			trackEvent(
				`${ viewContext }_site-goals-breakdown-notice`,
				'view_notification',
				noticeLabel
			);
		} else if ( noticeState === 'success' ) {
			trackEvent(
				`${ viewContext }_site-goals-breakdown-success-notice`,
				'view_notification'
			);
		} else if ( noticeState === 'error' ) {
			trackEvent(
				`${ viewContext }_site-goals-breakdown-error-notice`,
				'view_notification',
				errorLabel
			);
		}
	}, [ noticeState, viewContext, noticeLabel, errorLabel ] );

	const handleNewNoticeConfirm = useCallback( () => {
		trackEvent(
			`${ viewContext }_site-goals-breakdown-notice`,
			'confirm_notification',
			noticeLabel
		);
		handleEnable();
	}, [ viewContext, noticeLabel, handleEnable ] );

	const handleNewNoticeDismiss = useCallback( () => {
		trackEvent(
			`${ viewContext }_site-goals-breakdown-notice`,
			'dismiss_notification',
			noticeLabel
		);
		onDismissComplete();
	}, [ viewContext, noticeLabel, onDismissComplete ] );

	const handleSuccessDismiss = useCallback( () => {
		trackEvent(
			`${ viewContext }_site-goals-breakdown-success-notice`,
			'dismiss_notification'
		);
		dismissBreakdownResult();
	}, [ viewContext, dismissBreakdownResult ] );

	const handleErrorRetry = useCallback( () => {
		trackEvent(
			`${ viewContext }_site-goals-breakdown-error-notice`,
			'confirm_notification',
			errorLabel
		);
		handleEnable();
	}, [ viewContext, errorLabel, handleEnable ] );

	const handleErrorDismiss = useCallback( () => {
		trackEvent(
			`${ viewContext }_site-goals-breakdown-error-notice`,
			'dismiss_notification',
			errorLabel
		);
		dismissBreakdownResult();
	}, [ viewContext, errorLabel, dismissBreakdownResult ] );

	return {
		handleNewNoticeConfirm,
		handleNewNoticeDismiss,
		handleSuccessDismiss,
		handleErrorRetry,
		handleErrorDismiss,
	};
}

const BreakdownNoticeArea: FC< BreakdownNoticeAreaProps > = ( {
	origin,
	goalTypes,
} ) => {
	// Trigger the resolver so the dimension checks run against synced data.
	useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).getAvailableCustomDimensions(),
		[]
	);

	const hasEcommerceDimension = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[
					GOAL_TYPES.ECOMMERCE
				]
			),
		[]
	);
	const hasLeadDimension = useSelect(
		( select: Select ) =>
			select( MODULES_ANALYTICS_4 ).hasCustomDimensions(
				SITE_GOALS_BREAKDOWN_CUSTOM_DIMENSION_BY_GOAL_TYPE[
					GOAL_TYPES.LEAD
				]
			),
		[]
	);

	const { hasBreakdownDimensions, missingScope } = getBreakdownDimensionState(
		{
			goalTypes,
			presenceByGoalType: {
				[ GOAL_TYPES.ECOMMERCE ]: hasEcommerceDimension,
				[ GOAL_TYPES.LEAD ]: hasLeadDimension,
			},
		}
	);

	const { onEnable, inProgress, disabled } = useBreakdownEnableHandler(
		origin,
		missingScope
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

	const canSyncCustomDimensions = useSelect(
		( select: Select ) =>
			select( CORE_USER ).isAuthenticated() &&
			select( CORE_USER ).hasCapability( PERMISSION_MANAGE_OPTIONS ),
		[]
	);

	// The synced `availableCustomDimensions` setting is only refreshed via report
	// errors, and no report yet queries the breakdown dimensions. Sync it (at
	// most once a day) so an out-of-band GA4 change to them is detected.
	//
	// TODO: Scope down once #12803 lands — its breakdown reports query these
	// dimensions while a breakdown is enabled, so the report-error sync then
	// covers that case and this can be limited to the not-yet-enabled one.
	useEffect( () => {
		let ignore = false;

		if ( canSyncCustomDimensions ) {
			( async () => {
				const { cacheHit } = await getItem(
					AVAILABILITY_SYNC_CACHE_KEY
				);

				if ( ignore || cacheHit ) {
					return;
				}

				await setItem( AVAILABILITY_SYNC_CACHE_KEY, true, {
					ttl: DAY_IN_SECONDS,
				} );

				scheduleSyncAvailableCustomDimensions();
			} )();
		}

		return () => {
			ignore = true;
		};
	}, [ canSyncCustomDimensions, scheduleSyncAvailableCustomDimensions ] );

	const onDismissComplete = useCallback( () => {
		if ( origin === BREAKDOWN_ORIGIN_WIDGET ) {
			showBreakdownTooltip();
		} else {
			setSiteGoalsBreakdownTooltipPending( true );
		}
	}, [ origin, showBreakdownTooltip, setSiteGoalsBreakdownTooltipPending ] );

	const isViewOnly = useViewOnly();

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

		// Also surface a failure to load the property's custom dimensions (e.g.
		// the user lacks permission on the GA4 property), which aborts creation
		// before any create error is recorded and otherwise leaves the notice
		// stuck loading.
		const propertyID = select( MODULES_ANALYTICS_4 ).getPropertyID();

		return select( MODULES_ANALYTICS_4 ).getCustomDimensionsError(
			propertyID
		);
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
	const [ breakdownScope ] = useFormValue(
		FORM_CUSTOM_DIMENSIONS_CREATE,
		BREAKDOWN_SCOPE_FORM_KEY
	);
	const [ isDismissed ] = useFormValue(
		FORM_CUSTOM_DIMENSIONS_CREATE,
		BREAKDOWN_DISMISSED_FORM_KEY
	);

	const isClickedInstance = isBreakdownClickedInstance( {
		breakdownOrigin,
		origin,
		breakdownScope,
		goalTypes,
	} );

	// "New"/loading copy follows what is still missing (`missingScope`); the
	// success/error copy follows the scope that was enabled at this instance.
	const noticeCopy = useSiteGoalsBreakdownNoticeCopy( missingScope );
	const { successTitle, successDescription, permissionsErrorTitle } =
		useSiteGoalsBreakdownResultCopy(
			isClickedInstance && breakdownScope
				? ( breakdownScope as BreakdownScope )
				: missingScope
		);

	const className =
		origin === BREAKDOWN_ORIGIN_WIDGET
			? 'googlesitekit-site-goals-breakdown-notice'
			: 'googlesitekit-site-goals-selection-panel__breakdown-notice';

	// Dismiss the in-session success/error notice and drop the shared
	// `customDimensions` list so unrelated auto-create flows don't inherit it.
	const dismissBreakdownResult = useCallback( () => {
		return setValues( FORM_CUSTOM_DIMENSIONS_CREATE, {
			[ BREAKDOWN_DISMISSED_FORM_KEY ]: true,
			customDimensions: [],
		} );
	}, [ setValues ] );

	// Suppresses "New" once an enable was attempted this session (any scope set).
	const attempted = Boolean( breakdownScope );

	const noticeState = computeNoticeState( {
		isViewOnly,
		hasBreakdownDimensions,
		isIntroModalDismissed,
		isNoticeDismissed,
		creationError,
		isBusy,
		isDismissed: Boolean( isDismissed ),
		isClickedInstance,
		attempted,
	} );

	const {
		handleNewNoticeConfirm,
		handleNewNoticeDismiss,
		handleSuccessDismiss,
		handleErrorRetry,
		handleErrorDismiss,
	} = useBreakdownNoticeTracking( {
		origin,
		goalTypes,
		creationError,
		noticeState,
		handleEnable,
		onDismissComplete,
		dismissBreakdownResult,
	} );

	if ( noticeState === 'error' ) {
		return (
			<BreakdownErrorNotice
				className={ className }
				error={ creationError }
				permissionsTitle={ permissionsErrorTitle }
				onRetry={ handleErrorRetry }
				onDismiss={ handleErrorDismiss }
			/>
		);
	}

	if ( noticeState === 'success' ) {
		return (
			<BreakdownSuccessNotice
				className={ className }
				title={ successTitle }
				description={ successDescription }
				onDismiss={ handleSuccessDismiss }
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
				onCTAClick={ handleNewNoticeConfirm }
				ctaInProgress={ ctaBusy }
				ctaDisabled={ ctaBusy }
				onDismissComplete={ handleNewNoticeDismiss }
			/>
		);
	}

	return null;
};

export default BreakdownNoticeArea;
