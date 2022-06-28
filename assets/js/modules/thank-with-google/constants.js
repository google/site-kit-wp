/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const REVENUE_MODELS = [
	{
		displayName: __( 'Contributions', 'google-site-kit' ),
		value: 'contribution',
	},
	{
		displayName: __( 'Subscriptions', 'google-site-kit' ),
		value: 'subscription',
	},
];
