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
	'subject'                                          => 'Your latest Site Kit performance summary',
	'preheader'                                        => 'See what changed this month and where to focus next.',
	'site'                                             => array(
		'domain' => 'example.com',
	),
	'date_range'                                       => array(
		'label'   => 'Sep 1 - Sep 30',
		'context' => 'Compared to previous 7 days',
	),
	'primary_call_to_action'                           => array(
		'label' => 'View dashboard',
		'url'   => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard',
	),
	'footer'                                           => array(
		'copy'            => 'You received this email because you signed up to receive email reports from Site Kit. If you do not want to receive these emails in the future you can unsubscribe', // "here." link is added within the footer template currently.
		'unsubscribe_url' => 'https://example.com/wp-admin/admin.php?page=googlesitekit-settings#/admin-settings',
		'links'           => array(
			array(
				'label' => 'Manage subscription',
				'url'   => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard&email-reporting-panel-opened=1',
			),
			array(
				'label' => 'Privacy Policy',
				'url'   => 'https://policies.google.com/privacy',
			),
			array(
				'label' => 'Help center',
				'url'   => 'https://sitekit.withgoogle.com/support/',
			),
		),
	),

	// Is my site helping my business grow?
	'total_conversion_events'                          => array(
		'value'           => '847,293',
		'label'           => 'Total conversion events',
		'change'          => 23.7,
		'change_context'  => 'Compared to previous 7 days',
		'comparison_text' => 'Last 30 days vs previous period',
	),
	'products_added_to_cart'                           => array(
		'value'          => '124,567',
		'label'          => 'Products Added to Cart',
		'event_name'     => 'add_to_cart',
		'change'         => 15.4,
		'change_context' => 'Compared to previous 7 days',
	),
	'products_added_to_cart_top_traffic_channel'       => 'Organic Search',
	'purchases'                                        => array(
		'value'          => '31,842',
		'label'          => 'Purchases',
		'event_name'     => 'purchase',
		'change'         => -8.3,
		'change_context' => 'Compared to previous 7 days',
	),
	'purchases_top_traffic_channel'                    => 'Paid Search',

	// How many people are finding and visiting my site?
	'total_visitors'                                   => array(
		'value'          => '2,847,563',
		'label'          => 'Total Visitors',
		'change'         => 18.92,
		'change_context' => 'Compared to previous 7 days',
	),
	'new_visitors'                                     => array(
		'value'          => '1,923,481',
		'label'          => 'New Visitors',
		'change'         => 24.15,
		'change_context' => 'Compared to previous 7 days',
	),
	'returning_visitors'                               => array(
		'value'          => '924,082',
		'label'          => 'Returning Visitors',
		'change'         => -3.67,
		'change_context' => 'Compared to previous 7 days',
	),
	'subscribers'                                      => array(
		'value'          => '47,892',
		'label'          => 'Subscribers',
		'change'         => 7.23,
		'change_context' => 'Compared to previous 7 days',
	),
	'total_impressions_on_search'                      => array(
		'value'          => '4,782,341',
		'label'          => 'Total Impressions on Search',
		'change'         => 31.56,
		'change_context' => 'Compared to previous 7 days',
	),
	'total_clicks_from_search'                         => array(
		'value'          => '387,429',
		'label'          => 'Total Clicks on Search',
		'change'         => -2.14,
		'change_context' => 'Compared to previous 7 days',
	),

	// How are people finding me?
	'traffic_channels_by_visitor_count'                => array(
		array(
			'label'          => 'Direct',
			'value'          => '892,341',
			'change'         => 5.82,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'Organic Search',
			'value'          => '1,456,782',
			'change'         => 28.34,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'Paid Search',
			'value'          => '234,891',
			'change'         => -12.67,
			'change_context' => 'Compared to previous 7 days',
		),
	),
	'keywords_with_highest_ctr_in_search'              => array(
		array(
			'label'          => 'wordpress performance optimization',
			'value'          => '89%',
			'change'         => 42.18,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'site speed best practices',
			'value'          => '67%',
			'change'         => 15.73,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'google analytics setup guide',
			'value'          => '45%',
			'change'         => -4.29,
			'change_context' => 'Compared to previous 7 days',
		),
	),

	// What's grabbing their attention?
	'pages_with_the_most_pageviews'                    => array(
		array(
			'label'          => 'Ultimate Guide to SEO in 2025',
			'value'          => '1,234,567',
			'change'         => 67.45,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/ultimate-guide-to-seo-2025/',
		),
		array(
			'label'          => 'How to Speed Up Your WordPress Site',
			'value'          => '892,341',
			'change'         => 12.89,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/speed-up-wordpress-site/',
		),
		array(
			'label'          => '10 Best Marketing Strategies for Small Business',
			'value'          => '567,234',
			'change'         => -5.67,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/best-marketing-strategies-small-business/',
		),
	),
	'pages_with_the_most_clicks_from_search'           => array(
		array(
			'label'          => 'Complete Beginner Guide to Google Analytics',
			'value'          => '234,891',
			'change'         => 89.23,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/beginner-guide-google-analytics/',
		),
		array(
			'label'          => 'Free Website Audit Checklist',
			'value'          => '178,432',
			'change'         => 23.56,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/free-website-audit-checklist/',
		),
		array(
			'label'          => 'E-commerce Conversion Rate Tips',
			'value'          => '98,765',
			'change'         => -18.34,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/ecommerce-conversion-rate-tips/',
		),
	),
	'top_authors_by_pageviews'                         => array(
		array(
			'label'          => 'Sarah Mitchell',
			'value'          => '2,345,678',
			'change'         => 34.21,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'James Rodriguez',
			'value'          => '1,567,234',
			'change'         => 8.45,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'Emily Chen',
			'value'          => '987,654',
			'change'         => -2.89,
			'change_context' => 'Compared to previous 7 days',
		),
	),
	'top_categories_by_pageviews'                      => array(
		array(
			'label'          => 'Digital Marketing',
			'value'          => '3,456,789',
			'change'         => 45.67,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'Web Development',
			'value'          => '2,134,567',
			'change'         => 19.82,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'Business Strategy',
			'value'          => '1,234,890',
			'change'         => -7.34,
			'change_context' => 'Compared to previous 7 days',
		),
	),

	// What is driving growth and bringing more visitors?
	'search_keywords_with_the_biggest_increase_in_ctr' => array(
		array(
			'label'          => 'how to improve website ranking',
			'value'          => '89%',
			'change'         => 127.45,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'best seo tools 2025',
			'value'          => '34%',
			'change'         => 78.92,
			'change_context' => 'Compared to previous 7 days',
		),
		array(
			'label'          => 'content marketing strategy',
			'value'          => '1%',
			'change'         => 45.23,
			'change_context' => 'Compared to previous 7 days',
		),
	),
	'pages_with_the_biggest_increase_in_search_clicks' => array(
		array(
			'label'          => 'The Complete Guide to Core Web Vitals (Including a Free Download Available for All Readers)',
			'value'          => '345,678',
			'change'         => 234.56,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/guide-core-web-vitals/',
		),
		array(
			'label'          => 'AI Tools for Content Creation',
			'value'          => '234,567',
			'change'         => 156.78,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/ai-tools-content-creation/',
		),
		array(
			'label'          => 'Mobile-First Indexing Best Practices',
			'value'          => '123,456',
			'change'         => 89.12,
			'change_context' => 'Compared to previous 7 days',
			'url'            => 'https://example.com/mobile-first-indexing-best-practices/',
		),
	),
);
