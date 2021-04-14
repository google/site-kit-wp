/**
 * Extracts the currency string from a given AdSense report,
 * and returns the appropriate Intl formatting options for the currency.
 * Falls back to decimal formatting if no currency is available.
 *
 * @since n.e.x.t
 *
 * @param {Object} adsenseReport AdSense Report.
 * @return {Intl.NumberFormatOptions} Formatting options.
 */
export function getCurrencyFormat( adsenseReport ) {
	const currency = adsenseReport?.headers?.[0].currency;
	return currency ? ( {
		style: 'currency',
		currency,
	} ) : ( {
		// Fall back to decimal if currency hasn't yet loaded.
		style: 'decimal',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	} );
}
