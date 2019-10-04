/**
 * Changes the currently selected date range.
 *
 * Currently only identifiable by the option values.
 *
 * @param {string} fromRange The currently selected date range.
 * @param {string} toRange The new date range to select.
 */
export async function switchDateRange( fromRange, toRange ) {
	await Promise.all( [
		expect( page ).toClick( '.mdc-select__selected-text', { text: new RegExp( fromRange, 'i' ) } ),
		page.waitForSelector( '.mdc-select.mdc-select--focused' ),
		page.waitForSelector( '.mdc-menu-surface--open .mdc-list-item' ),
	] );
	// Intentionally left off the '--open' suffix here as it proved problematic for stability.
	await expect( page ).toClick( '.mdc-menu-surface .mdc-list-item', { text: new RegExp( toRange, 'i' ) } );
}
