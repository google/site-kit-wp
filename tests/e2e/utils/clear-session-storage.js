/**
 * Clears the session storage.
 */
export async function clearSessionStorage() {
	await page.evaluate( () => global.sessionStorage.clear() );
}
