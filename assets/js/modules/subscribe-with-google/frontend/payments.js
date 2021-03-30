/**
 * Handles payment response event.
 *
 * @since 1.29.0
 *
 * @param {*} swg Subscribe with Google API.
 */
export function handlePaymentResponse( swg ) {
	swg.setOnPaymentResponse( ( paymentResponse ) => {
		paymentResponse.then( ( response ) => {
			// TODO: Handle payment response.
			response.complete().then( () => {
				// TODO: Update page accordingly.
				location.reload();
			} );
		} );
	} );
}
