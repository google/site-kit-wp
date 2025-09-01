/**
 * Vitest mock for components/Portal.
 *
 * Renders children inline without creating a real React portal.
 *
 * @since n.e.x.t
 *
 * @param {Object} props          Component props.
 * @param {*}      props.children Children to render inline.
 * @return {*} Children rendered inline without a portal.
 */
export default function PortalMock( { children } ) {
	return children;
}
