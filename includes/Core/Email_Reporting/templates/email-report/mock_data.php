<?php
/**
 * Mock data for the email-report template.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @return array
 */

return array(
	// Email metadata.
	'subject'                                    => 'Your latest Site Kit performance summary',
	'preheader'                                  => 'See what changed this month and where to focus next.',
	'site'                                       => array(
		'domain' => 'example.com',
	),
	'date_range'                                 => array(
		'label'   => 'Sep 1 – Sep 30, 2025',
		'context' => 'Compared to previous 7 days',
	),
	'primary_call_to_action'                     => array(
		'label' => 'View dashboard',
		'url'   => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard',
	),
	'footer'                                     => array(
		'copy'            => 'You received this email because you signed up to receive email reports from Site Kit. If you do not want to receive these emails in the future you can unsubscribe %s.',
		'unsubscribe_url' => 'https://example.com/wp-admin/admin.php?page=googlesitekit-settings#/admin-settings',
		'links'           => array(
			array(
				'label' => 'Help center',
				'url'   => 'https://sitekit.withgoogle.com/support/',
			),
			array(
				'label' => 'Privacy Policy',
				'url'   => 'https://policies.google.com/privacy',
			),
			array(
				'label' => 'Manage subscription',
				'url'   => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&email-reporting-panel-opened=1',
			),
		),
	),

	// Is my site helping my business grow?
	'total_conversion_events'                    => array(
		'value'           => '1,234',
		'label'           => 'Total Conversions',
		'change'          => 12.48,
		'change_context'  => 'Compared to previous 7 days',
		'comparison_text' => 'Last 30 days vs previous period',
	),
	'products_added_to_cart'                     => array(
		'value'          => '567',
		'label'          => 'Products Added to Cart',
		'event_name'     => 'add_to_cart',
		'change'         => 8.3,
		'change_context' => 'Compared to previous 7 days',
	),
	'products_added_to_cart_top_traffic_channel' => 'Organic Search',
	'purchases'                                  => array(
		'value'          => '89',
		'label'          => 'Purchases',
		'event_name'     => 'purchase',
		'change'         => -5.2,
		'change_context' => 'Compared to previous 7 days',
	),
	'purchases_top_traffic_channel'              => 'Paid Search',

);
