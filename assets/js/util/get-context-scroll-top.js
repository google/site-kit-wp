import { ANCHOR_ID_TRAFFIC } from '../googlesitekit/constants';

/**
 * Gets the y coordinate to scroll to the top of a context element, taking the sticky admin bar, header and navigation height into account.
 *
 * @since n.e.x.t
 *
 * @param {string} contextID  The ID of the context element to scroll to.
 * @param {string} breakpoint The current breakpoint.
 * @return {number} The offset to scroll to.
 */
const getContextScrollTop = ( contextID, breakpoint ) => {
	const contextElement = document.getElementById( contextID );
	if ( contextID === ANCHOR_ID_TRAFFIC || ! contextElement ) {
		return 0;
	}

	const contextTop = contextElement.getBoundingClientRect().top;

	const header = document.querySelector( '.googlesitekit-header' );

	const hasStickyAdminBar = breakpoint !== 'small';

	const headerHeight = hasStickyAdminBar
		? header.getBoundingClientRect().bottom
		: header.offsetHeight;

	/**
	 * Check whether the unified dashboard navigation
	 * is available. If it's available set the offsetHeight.
	 * Otherwise set a margin bottom (80) for the PSI header
	 * title to be visible on scroll.
	 */
	const hasNavigation = document.querySelector( '.googlesitekit-navigation' );
	const navigationHeight = hasNavigation ? hasNavigation.offsetHeight : 80;

	return contextTop + global.scrollY - headerHeight - navigationHeight;
};

export default getContextScrollTop;
