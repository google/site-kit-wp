/**
 * Gets an object of utility functions for filtering the given list of containers.
 *
 * @since 1.4.0
 *
 * @param {Array} containers Containers to filter.
 * @return {Object} Object with keys mapping to utility functions to operate on given containers.
 */
export default function getContainers( containers ) {
	return {
		/**
		 * Gets containers that include the given usage context.
		 *
		 * @since 1.4.0
		 *
		 * @param {string} context The context to filter by.
		 * @return {Array} Containers with the given usage context.
		 */
		byContext: ( context ) =>
			containers.filter( ( c ) => c.usageContext.includes( context ) ),
	};
}
