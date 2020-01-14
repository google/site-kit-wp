/**
 * Return a rejection.
 *
 * Used to ensure that a test will fail if it reaches this point.
 * Useful for asynchronous code that has multiple code paths, eg:
 *
 * ```js
 * try {
 *   await codeThatThrowsAnError();
 *   return unexpectedSuccess();
 * } catch (err) {
 *   expect(err.message).toEqual('Some error.');
 * }
 * ```
 *
 * Use this to ensure that the unintended path throws an error rather than
 * silently succeed.
 *
 * @return {Promise} A rejected promise.
 */
export const unexpectedSuccess = () => {
	return Promise.reject( new Error(
		'Some code (likely a Promise) succeeded unexpectedly; check your test.'
	) );
};
