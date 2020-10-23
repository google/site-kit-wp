/**
 * Checks if the given container ID appears to be a valid GTM container.
 *
 * @since 1.3.0
 *
 * @param {string} containerID Container ID to check.
 * @return {boolean} Whether or not the given container ID is valid.
 */
export default function isValidContainerID( containerID ) {
	return ( !! containerID ) && containerID.toString().match( /^GTM-[A-Z0-9]+$/ );
}
