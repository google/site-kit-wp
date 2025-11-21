/**
 * AudienceTilesWidget Body component (clean rebuild).
 */

import PropTypes from 'prop-types';
import { useCallback, useEffect } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { __ } from '@wordpress/i18n';
import { useDispatch, useInViewSelect, useSelect } from 'googlesitekit-data';
import { CORE_USER } from '@/js/googlesitekit/datastore/user/constants';
import { CORE_FORMS } from '@/js/googlesitekit/datastore/forms/constants';
import { CORE_SITE } from '@/js/googlesitekit/datastore/site/constants';
import {
	MODULES_ANALYTICS_4,
	EDIT_SCOPE,
	CUSTOM_DIMENSION_DEFINITIONS,
	AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
} from '@/js/modules/analytics-4/datastore/constants';
import { isInvalidCustomDimensionError } from '@/js/modules/analytics-4/utils/custom-dimensions';
import useAudienceTilesReports from '@/js/modules/analytics-4/hooks/useAudienceTilesReports';
import {
	BREAKPOINT_SMALL,
	BREAKPOINT_TABLET,
	useBreakpoint,
} from '@/js/hooks/useBreakpoint';
import useViewOnly from '@/js/hooks/useViewOnly';
import useViewContext from '@/js/hooks/useViewContext';
import AudienceSegmentationErrorWidget from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceSegmentationErrorWidget';
import MaybePlaceholderTile from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/MaybePlaceholderTile';
import AudienceTilesList from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceTilesWidget/AudienceTiles/AudienceTilesList';
import AudienceErrorModal from '@/js/modules/analytics-4/components/audience-segmentation/dashboard/AudienceErrorModal';
import useFormValue from '@/js/hooks/useFormValue';
import { ERROR_CODE_MISSING_REQUIRED_SCOPE } from '@/js/util/errors';
import { AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION } from '@/js/googlesitekit/widgets/default-areas';
import { trackEvent } from '@/js/util';

function hasZeroDataForAudience( report, dimensionName ) {
	const audienceData = report?.rows?.find(
		( row ) => row.dimensionValues?.[ 0 ]?.value === dimensionName
	);
	const totalUsers = audienceData?.metricValues?.[ 0 ]?.value || 0;
	return totalUsers === 0;
}

function useAudienceTilesController( { allTilesError, loading } ) {
	const breakpoint = useBreakpoint();
	const isTabbedBreakpoint =
		breakpoint === BREAKPOINT_SMALL || breakpoint === BREAKPOINT_TABLET;
	const isViewOnly = useViewOnly();
	const viewContext = useViewContext();

	const audiences = useInViewSelect(
		( select ) =>
			select( MODULES_ANALYTICS_4 ).getOrSyncAvailableAudiences(),
		[]
	);
	const configuredAudiences = useInViewSelect(
		( select ) => select( CORE_USER ).getConfiguredAudiences(),
		[]
	);
	const [ siteKitAudiences, otherAudiences ] = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getConfiguredSiteKitAndOtherAudiences()
	) || [ [], [] ];
	const isSiteKitAudiencePartialData = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).hasAudiencePartialData( siteKitAudiences )
	);
	const partialDataStates = useInViewSelect(
		( select ) =>
			configuredAudiences?.reduce( ( acc, name ) => {
				acc[ name ] =
					select( MODULES_ANALYTICS_4 ).isAudiencePartialData( name );
				return acc;
			}, {} ),
		[ configuredAudiences ]
	);

	const {
		report,
		reportError,
		siteKitAudiencesReport,
		totalPageviews,
		totalPageviewsReportError,
		topCitiesReport,
		topContentReport,
		topContentReportErrors,
		topContentPageTitlesReport,
		topContentPageTitlesReportErrors,
	} = useAudienceTilesReports( {
		isSiteKitAudiencePartialData,
		siteKitAudiences,
		otherAudiences,
	} );

	function getAudienceTileMetrics( audienceResourceName ) {
		const isSiteKitAudience = siteKitAudiences.some(
			( a ) => a.name === audienceResourceName
		);
		const audienceSlug = siteKitAudiences.find(
			( a ) => a.name === audienceResourceName
		)?.audienceSlug;
		function find( range ) {
			let row;
			if ( isSiteKitAudience && isSiteKitAudiencePartialData ) {
				const dimValue =
					audienceSlug === 'new-visitors' ? 'new' : 'returning';
				row = siteKitAudiencesReport?.rows?.find(
					( { dimensionValues } ) =>
						dimensionValues?.[ 0 ]?.value === dimValue &&
						dimensionValues?.[ 1 ]?.value === range
				);
			} else {
				row = report?.rows?.find(
					( { dimensionValues } ) =>
						dimensionValues?.[ 0 ]?.value ===
							audienceResourceName &&
						dimensionValues?.[ 1 ]?.value === range
				);
			}
			return [
				Number( row?.metricValues?.[ 0 ]?.value || 0 ),
				Number( row?.metricValues?.[ 1 ]?.value || 0 ),
				Number( row?.metricValues?.[ 2 ]?.value || 0 ),
				Number( row?.metricValues?.[ 3 ]?.value || 0 ),
			];
		}
		return {
			current: find( 'date_range_0' ),
			previous: find( 'date_range_1' ),
		};
	}

	function getAudienceTileData( audienceResourceName, index ) {
		const audience = audiences?.find(
			( { name } ) => name === audienceResourceName
		);
		const audienceName = audience?.displayName || '';
		const audienceSlug = audience?.audienceSlug || '';
		const { current, previous } =
			getAudienceTileMetrics( audienceResourceName );
		const [ visitors, visitsPerVisitors, pagesPerVisit, pageviews ] =
			current;
		const [
			prevVisitors,
			prevVisitsPerVisitors,
			prevPagesPerVisit,
			prevPageviews,
		] = previous;
		const topCities = topCitiesReport?.[ index ];
		const topContent = topContentReport?.[ index ];
		const topContentTitles =
			topContentPageTitlesReport?.[ index ]?.rows?.reduce(
				( acc, row ) => {
					acc[ row.dimensionValues[ 0 ].value ] =
						row.dimensionValues[ 1 ].value;
					return acc;
				},
				{}
			) || {};
		const isSiteKitAudience = siteKitAudiences.some(
			( a ) => a.name === audienceResourceName
		);
		let reportToCheck = report;
		let dimValue = audienceResourceName;
		if ( isSiteKitAudience && isSiteKitAudiencePartialData ) {
			reportToCheck = siteKitAudiencesReport;
			dimValue = audienceSlug === 'new-visitors' ? 'new' : 'returning';
		}
		const isZeroData = hasZeroDataForAudience( reportToCheck, dimValue );
		const isPartialData = isSiteKitAudience
			? false
			: partialDataStates[ audienceResourceName ];
		return {
			audienceName,
			audienceSlug,
			visitors,
			prevVisitors,
			visitsPerVisitors,
			prevVisitsPerVisitors,
			pagesPerVisit,
			prevPagesPerVisit,
			pageviews,
			prevPageviews,
			topCities,
			topContent,
			topContentTitles,
			isZeroData,
			isPartialData,
		};
	}

	const hasInvalidCustomDimensionError =
		Object.values( topContentReportErrors ).some(
			isInvalidCustomDimensionError
		) ||
		Object.values( topContentPageTitlesReportErrors ).some(
			isInvalidCustomDimensionError
		);

	const postTypeParam =
		CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type.parameterName;
	const isCreatingCustomDimension = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isCreatingCustomDimension( postTypeParam )
	);
	const isSyncingAvailableCustomDimensions = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).isFetchingSyncAvailableCustomDimensions()
	);
	const customDimensionError = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getCreateCustomDimensionError(
			postTypeParam
		)
	);
	const propertyID = useSelect( ( select ) =>
		select( MODULES_ANALYTICS_4 ).getPropertyID()
	);
	const hasAnalyticsEditScope = useSelect( ( select ) =>
		select( CORE_USER ).hasScope( EDIT_SCOPE )
	);

	const isAutoCreatingCustomDimensionsForAudience = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'isAutoCreatingCustomDimensionsForAudience'
	);
	const isRetryingCustomDimensionCreate = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'isRetrying'
	);
	const autoSubmit = useFormValue(
		AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE,
		'autoSubmit'
	);
	const setupErrorCode = useSelect( ( select ) =>
		select( CORE_SITE ).getSetupErrorCode()
	);
	const hasOAuthError = autoSubmit && setupErrorCode === 'access_denied';
	const isSaving =
		isAutoCreatingCustomDimensionsForAudience ||
		isCreatingCustomDimension ||
		isSyncingAvailableCustomDimensions;

	const { setValues } = useDispatch( CORE_FORMS );
	const { setPermissionScopeError, clearPermissionScopeError } =
		useDispatch( CORE_USER );
	const { clearError } = useDispatch( MODULES_ANALYTICS_4 );
	const { setSetupErrorCode } = useDispatch( CORE_SITE );

	const redirectURL = addQueryArgs( global.location.href, {
		notification: 'audience_segmentation',
		widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	} );
	const errorRedirectURL = addQueryArgs( global.location.href, {
		widgetArea: AREA_MAIN_DASHBOARD_TRAFFIC_AUDIENCE_SEGMENTATION,
	} );

	const onCreateCustomDimension = useCallback(
		( { isRetrying } = {} ) => {
			setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
				autoSubmit: true,
				isRetrying,
			} );
			if ( ! hasAnalyticsEditScope ) {
				setPermissionScopeError( {
					code: ERROR_CODE_MISSING_REQUIRED_SCOPE,
					message: __(
						'Additional permissions are required to create new audiences in Analytics.',
						'google-site-kit'
					),
					data: {
						status: 403,
						scopes: [ EDIT_SCOPE ],
						skipModal: true,
						skipDefaultErrorNotifications: true,
						redirectURL,
						errorRedirectURL,
					},
				} );
			}
		},
		[
			hasAnalyticsEditScope,
			redirectURL,
			errorRedirectURL,
			setPermissionScopeError,
			setValues,
		]
	);

	const onCancel = useCallback( () => {
		setValues( AUDIENCE_TILE_CUSTOM_DIMENSION_CREATE, {
			autoSubmit: false,
			isRetrying: false,
		} );
		setSetupErrorCode( null );
		clearPermissionScopeError();
		clearError( 'createCustomDimension', [
			propertyID,
			CUSTOM_DIMENSION_DEFINITIONS.googlesitekit_post_type,
		] );
	}, [
		clearError,
		clearPermissionScopeError,
		propertyID,
		setSetupErrorCode,
		setValues,
	] );

	const { dismissItem } = useDispatch( CORE_USER );
	const { fetchSyncAvailableCustomDimensions } =
		useDispatch( MODULES_ANALYTICS_4 );

	const handleDismiss = useCallback(
		( audienceResourceName ) => {
			dismissItem( `audience-tile-${ audienceResourceName }` );
		},
		[ dismissItem ]
	);

	useEffect( () => {
		if ( ! isViewOnly && hasInvalidCustomDimensionError ) {
			fetchSyncAvailableCustomDimensions();
		}
	}, [
		fetchSyncAvailableCustomDimensions,
		hasInvalidCustomDimensionError,
		isViewOnly,
	] );

	const showTilesList = ! allTilesError || loading;
	const showErrorModal =
		( ( customDimensionError && ! isSaving ) ||
			( isRetryingCustomDimensionCreate &&
				! isAutoCreatingCustomDimensionsForAudience ) ||
			hasOAuthError ) &&
		! allTilesError &&
		! loading;

	return {
		// Data & reports
		reportError,
		totalPageviewsReportError,
		totalPageviews,
		hasInvalidCustomDimensionError,
		customDimensionError,
		isSaving,
		hasOAuthError,
		viewContext,
		showTilesList,
		showErrorModal,
		isTabbedBreakpoint,
		getAudienceTileData,
		onCreateCustomDimension,
		onCancel,
		handleDismiss,
	};
}

export default function Body( props ) {
	const {
		activeTileIndex,
		allTilesError,
		individualTileErrors,
		loading,
		topCitiesReportsLoaded,
		topContentReportsLoaded,
		topContentPageTitlesReportsLoaded,
		visibleAudiences,
		Widget,
	} = props;
	const controller = useAudienceTilesController( { allTilesError, loading } );
	const {
		reportError,
		totalPageviewsReportError,
		totalPageviews,
		hasInvalidCustomDimensionError,
		customDimensionError,
		isSaving,
		hasOAuthError,
		viewContext,
		showTilesList,
		showErrorModal,
		isTabbedBreakpoint,
		getAudienceTileData,
		onCreateCustomDimension,
		onCancel,
		handleDismiss,
	} = controller;

	return (
		<div className="googlesitekit-widget-audience-tiles__body">
			{ allTilesError && ! loading && (
				<AudienceSegmentationErrorWidget
					Widget={ Widget }
					errors={ [
						...Object.values( individualTileErrors ).flat( 2 ),
						reportError,
						totalPageviewsReportError,
					] }
				/>
			) }
			{ showTilesList && (
				<AudienceTilesList
					activeTileIndex={ activeTileIndex }
					isTabbedBreakpoint={ isTabbedBreakpoint }
					visibleAudiences={ visibleAudiences }
					loading={ loading }
					topCitiesReportsLoaded={ topCitiesReportsLoaded }
					topContentReportsLoaded={ topContentReportsLoaded }
					topContentPageTitlesReportsLoaded={
						topContentPageTitlesReportsLoaded
					}
					individualTileErrors={ individualTileErrors }
					totalPageviews={ totalPageviews }
					hasInvalidCustomDimensionError={
						hasInvalidCustomDimensionError
					}
					Widget={ Widget }
					getAudienceTileData={ getAudienceTileData }
					handleDismiss={ handleDismiss }
				/>
			) }
			{ showErrorModal && (
				<AudienceErrorModal
					apiErrors={ [ customDimensionError ] }
					title={ __( 'Failed to enable metric', 'google-site-kit' ) }
					description={ __(
						'Oops! Something went wrong. Retry enabling the metric.',
						'google-site-kit'
					) }
					onRetry={ () => {
						trackEvent(
							`${ viewContext }_audiences-top-content-cta`,
							'retry_enable_metric'
						);
						onCreateCustomDimension( { isRetrying: true } );
					} }
					onCancel={ () => {
						trackEvent(
							`${ viewContext }_audiences-top-content-cta`,
							'cancel_enable_metric'
						);
						onCancel();
					} }
					inProgress={ isSaving }
					hasOAuthError={ hasOAuthError }
					trackEventCategory={ `${ viewContext }_audiences-top-content-cta` }
				/>
			) }
			{ ! isTabbedBreakpoint && (
				<MaybePlaceholderTile
					Widget={ Widget }
					loading={ loading }
					allTilesError={ allTilesError }
					visibleAudienceCount={ visibleAudiences.length }
				/>
			) }
		</div>
	);
}

Body.propTypes = {
	activeTileIndex: PropTypes.number.isRequired,
	allTilesError: PropTypes.bool.isRequired,
	individualTileErrors: PropTypes.object.isRequired,
	loading: PropTypes.bool.isRequired,
	topCitiesReportsLoaded: PropTypes.object.isRequired,
	topContentReportsLoaded: PropTypes.object.isRequired,
	topContentPageTitlesReportsLoaded: PropTypes.object.isRequired,
	visibleAudiences: PropTypes.array.isRequired,
	Widget: PropTypes.elementType.isRequired,
};
