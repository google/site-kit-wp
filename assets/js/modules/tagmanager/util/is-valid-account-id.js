/**
 * Checks if the given account ID appears to be a valid GTM account.
 *
 * @param {(string|number)} accountID Account ID to test.
 * @return {boolean} Whether or not the given account ID is valid.
 */
export default function isValidAccountID( accountID ) {
	const accountInt = parseInt( accountID ) || 0;

	return accountInt > 0;
}
