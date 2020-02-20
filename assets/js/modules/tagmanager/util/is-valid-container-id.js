/**
 * Checks if the given container ID appears to be a valid GTM container.
 *
 * @param {string} containerID Container ID to check.
 * @return {boolean} Whether or not the given container ID is valid.
 */
export default function isValidContainerID( containerID ) {
	return ( !! containerID ) && containerID.toString().match( /^GTM-[A-Z0-9]+$/ );
}
