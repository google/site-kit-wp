import { isFeatureEnabled } from '../../features';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import { MODULES_ANALYTICS_4 } from '../../modules/analytics-4/datastore/constants';

/**
 * Determines whether to display a widget that requires conversion reporting events
 * in the key metrics selection panel.
 *
 * This function is attached to the widget object that requires the conversion reporting events and
 * has the `requiredConversionEventName` property.
 *
 * @since 1.136.0
 * @since 1.137.0 Moved function to its own file.
 *
 * @param {Function} select              Data store select function.
 * @param {boolean}  isViewOnlyDashboard Whether the current dashboard is view only.
 * @param {string}   slug                Key metric widget slug.
 * @return {boolean} Whether to display the widget.
 */
export function shouldDisplayWidgetWithConversionEvent(
	select,
	isViewOnlyDashboard,
	slug
) {
	if ( ! isFeatureEnabled( 'conversionReporting' ) ) {
		return false;
	}

	return (
		select( MODULES_ANALYTICS_4 ).hasConversionReportingEvents(
			// This property is available to the widget object that requires the
			// conversion reporting events, where the function is attached.
			this.requiredConversionEventName
		) || select( CORE_USER ).isKeyMetricActive( slug )
	);
}
