/**
 * External dependencies
 */
import { storiesOf } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import VisuallyHidden from '../assets/js/components/VisuallyHidden';

storiesOf( 'Global', module )
	.add( 'Visually Hidden', () => (
		<div>
			VisuallyHidden:
			<div style={ { padding: '10px', background: '#e3e3e3', display: 'inline-block', verticalAlign: 'text-bottom' } }>
				<VisuallyHidden style={ { background: '#fff' } }>
					{ __( 'Child Content1', 'google-site-kit' ) }
				</VisuallyHidden>
			</div>

			<br />
			<br />

			Span:
			<div style={ { padding: '10px', background: '#e3e3e3', display: 'inline-block' } }>
				<span style={ { background: '#fff' } }>
					{ __( 'Child Content', 'google-site-kit' ) }
				</span>
			</div>
		</div>
	) );
