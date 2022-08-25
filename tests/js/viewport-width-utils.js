/**
 * Retrieves the viewport width.
 *
 * @since n.e.x.t
 *
 * @return {number} The current viewport width.
 */
export function getViewportWidth() {
	return global.window.document.documentElement.clientWidth;
}

/**
 * Sets the viewport width.
 *
 * @since n.e.x.t
 *
 * @param {number} viewportWidth The viewport width to set.
 */
export function setViewportWidth( viewportWidth ) {
	Object.defineProperty(
		global.window.document.documentElement,
		'clientWidth',
		{
			configurable: true,
			value: viewportWidth,
		}
	);
}
