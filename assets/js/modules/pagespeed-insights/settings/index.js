/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * External dependencies
 */
import { sanitizeHTML } from 'assets/js/util';

export const settingsDetails = () => {
	const { dashboardPermalink } = global.googlesitekit;

	/* translators: %s is the URL to the Site Kit dashboard. */
	const content = sprintf(
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
