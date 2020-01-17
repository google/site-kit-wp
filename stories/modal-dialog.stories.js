/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';
import Dialog from 'GoogleComponents/dialog';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

storiesOf( 'Global', module )
	.add( 'Modal Dialog', () => {
		const { provides } = global.googlesitekit.modules.analytics;
		return (
			<Dialog
				dialogActive
				title={ __( 'Modal Dialog Title', 'google-site-kit' ) }
				subtitle={ __( 'Modal Dialog Subtitle', 'google-site-kit' ) }
				provides={ provides }
			/>
		);
	}, {
		options: {
			delay: 1000, // Wait for button to animate.
		},
	} );
