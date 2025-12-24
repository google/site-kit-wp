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
	'subject'                     => 'Your latest Site Kit performance summary',
	'preheader'                   => 'See what changed this month and where to focus next.',
	'site'                        => array(
		'domain' => 'example.com',
	),
	'date_range'                  => array(
		'label'   => 'Sep 1 - Sep 30',
		'context' => 'Compared to previous 7 days',
	),
	'primary_call_to_action'      => array(
		'label' => 'View dashboard',
		'url'   => 'https://example.com/wp-admin/admin.php?page=googlesitekit-dashboard',
	),
	'footer'                      => array(
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
	'total_conversion_events'     => array(
		'value'           => '847,293',
		'label'           => 'Total conversion events',
		'change'          => 23.7,
		'change_context'  => 'Compared to previous 7 days',
		'comparison_text' => 'Last 30 days vs previous period',
	),
	'products_added_to_cart'      => array(
		'value'           => '124,567',
		'label'           => 'Products Added to Cart',
		'event_name'      => 'add_to_cart',
		'change'          => 15.4,
		'change_context'  => 'Compared to previous 7 days',
		'dimension'       => 'Top traffic channel',
		'dimension_value' => 'Organic Search',
	),
	'purchases'                   => array(
		'value'           => '31,842',
		'label'           => 'Purchases',
		'event_name'      => 'purchase',
		'change'          => -8.3,
		'change_context'  => 'Compared to previous 7 days',
		'dimension'       => 'Top traffic channel',
		'dimension_value' => 'Paid Search',
	),

	// How many people are finding and visiting my site?
	'total_visitors'              => array(
		'value'          => '2,847,563',
		'label'          => 'Total Visitors',
		'change'         => 18.92,
		'change_context' => 'Compared to previous 7 days',
	),
	'new_visitors'                => array(
		'value'          => '1,923,481',
		'label'          => 'New Visitors',
		'change'         => 24.15,
		'change_context' => 'Compared to previous 7 days',
	),
	'returning_visitors'          => array(
		'value'          => '924,082',
		'label'          => 'Returning Visitors',
		'change'         => -3.67,
		'change_context' => 'Compared to previous 7 days',
	),
	'custom_audience_subscribers' => array(
		'value'          => '47,892',
		'label'          => 'Subscribers',
		'change'         => 7.23,
		'change_context' => 'Compared to previous 7 days',
	),
	'total_impressions'           => array(
		'value'          => '4,782,341',
		'label'          => 'Total Impressions',
		'change'         => 31.56,
		'change_context' => 'Compared to previous 7 days',
	),
	'total_clicks'                => array(
		'value'          => '387,429',
		'label'          => 'Total Clicks',
		'change'         => -2.14,
		'change_context' => 'Compared to previous 7 days',
	),

	// How are people finding me?
	'traffic_channels'            => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			'Direct',
			'Organic Search',
			'Paid Search',
		),
		'values'           => array(
			'892,341',
			'1,456,782',
			'234,891',
		),
		'changes'          => array(
			5.82,
			28.34,
			-12.67,
		),
	),
	'top_ctr_keywords'            => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			'wordpress performance optimization',
			'site speed best practices',
			'google analytics setup guide',
		),
		'values'           => array(
			'89%',
			'67%',
			'45%',
		),
		'changes'          => array(
			42.18,
			15.73,
			-4.29,
		),
	),

	// What's grabbing their attention?
	'popular_content'             => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			array(
				'label' => 'Ultimate Guide to SEO in 2025',
				'url'   => 'https://example.com/ultimate-guide-to-seo-2025/',
			),
			array(
				'label' => 'How to Speed Up Your WordPress Site',
				'url'   => 'https://example.com/speed-up-wordpress-site/',
			),
			array(
				'label' => '10 Best Marketing Strategies for Small Business',
				'url'   => 'https://example.com/best-marketing-strategies-small-business/',
			),
		),
		'values'           => array(
			'1,234,567',
			'892,341',
			'567,234',
		),
		'changes'          => array(
			67.45,
			12.89,
			-5.67,
		),
	),
	'top_pages_by_clicks'         => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			array(
				'label' => 'Complete Beginner Guide to Google Analytics',
				'url'   => 'https://example.com/beginner-guide-google-analytics/',
			),
			array(
				'label' => 'Free Website Audit Checklist',
				'url'   => 'https://example.com/free-website-audit-checklist/',
			),
			array(
				'label' => 'E-commerce Conversion Rate Tips',
				'url'   => 'https://example.com/ecommerce-conversion-rate-tips/',
			),
		),
		'values'           => array(
			'234,891',
			'178,432',
			'98,765',
		),
		'changes'          => array(
			89.23,
			23.56,
			-18.34,
		),
	),
	'top_authors'                 => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			'Sarah Mitchell',
			'James Rodriguez',
			'Emily Chen',
		),
		'values'           => array(
			'2,345,678',
			'1,567,234',
			'987,654',
		),
		'changes'          => array(
			34.21,
			8.45,
			-2.89,
		),
	),
	'top_categories'              => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			'Digital Marketing',
			'Web Development',
			'Business Strategy',
		),
		'values'           => array(
			'3,456,789',
			'2,134,567',
			'1,234,890',
		),
		'changes'          => array(
			45.67,
			19.82,
			-7.34,
		),
	),

	// What is driving growth and bringing more visitors?
	'keywords_ctr_increase'       => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			'how to improve website ranking',
			'best seo tools 2025',
			'content marketing strategy',
		),
		'values'           => array(
			'89%',
			'34%',
			'1%',
		),
		'changes'          => array(
			127.45,
			78.92,
			45.23,
		),
	),
	'pages_clicks_increase'       => array(
		'change_context'   => 'Compared to previous 7 days',
		'dimension_values' => array(
			array(
				'label' => 'The Complete Guide to Core Web Vitals (Including a Free Download Available for All Readers)',
				'url'   => 'https://example.com/guide-core-web-vitals/',
			),
			array(
				'label' => 'AI Tools for Content Creation',
				'url'   => 'https://example.com/ai-tools-content-creation/',
			),
			array(
				'label' => 'Mobile-First Indexing Best Practices',
				'url'   => 'https://example.com/mobile-first-indexing-best-practices/',
			),
		),
		'values'           => array(
			'345,678',
			'234,567',
			'123,456',
		),
		'changes'          => array(
			234.56,
			156.78,
			89.12,
		),
	),
);
