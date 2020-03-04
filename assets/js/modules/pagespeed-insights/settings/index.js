/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { sanitizeHTML } from '../../../util';

export const settingsDetails = () => {
	const { dashboardPermalink } = global.googlesitekit;

	const content = sprintf(
		/* translators: %s is the URL to the Site Kit dashboard. */
		__( 'To view insights, <a href="%s">visit the dashboard</a>.', 'google-site-kit' ),
		dashboardPermalink
	);

	return (
		<p
			dangerouslySetInnerHTML={ sanitizeHTML( content, {
				ALLOWED_TAGS: [ 'a' ],
				ALLOWED_ATTR: [ 'href' ],
			} ) }
		/>
	);
};
