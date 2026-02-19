<?php
/**
 * Class Google\Site_Kit\Core\Email_Reporting\Email_Assets
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Email_Reporting;

/**
 * Class for managing email asset URLs.
 *
 * Maps slug-based asset keys to their full CDN filenames.
 * Callers only need the slug; the class resolves the URL.
 *
 * @since 1.173.0
 */
class Email_Assets {

	/**
	 * CDN base URL for email assets.
	 *
	 * TODO: Change to the production URL when the assets are uploaded to production bucket in #11551.
	 *
	 * @since 1.173.0
	 * @var string
	 */
	const BASE_URL = 'https://storage.googleapis.com/pue-email-assets-dev/';

	/**
	 * Asset registry.
	 *
	 * Maps asset slugs to their full CDN filenames.
	 * Format: 'asset-slug' => 'YYYY-MM-DD-asset-slug.ext'
	 *
	 * @since 1.173.0
	 * @var array
	 */
	const ASSETS = array(
		// Shared assets.
		'site-kit-logo'                 => '2025-12-01-site-kit-logo.png',
		// email-report assets.
		'shooting-stars-graphic'        => '2025-12-01-shooting-stars-graphic.png',
		'icon-conversions'              => '2025-12-01-icon-conversions.png',
		'icon-growth'                   => '2025-12-01-icon-growth.png',
		'icon-link-arrow'               => '2025-12-01-icon-link-arrow.png',
		'icon-search'                   => '2025-12-01-icon-search.png',
		'icon-views'                    => '2025-12-01-icon-views.png',
		'icon-visitors'                 => '2025-12-01-icon-visitors.png',
		'conversions-timeline-green'    => '2025-12-01-conversions-timeline-green.png',
		'conversions-timeline-red'      => '2025-12-01-conversions-timeline-red.png',
		'notification-icon-star'        => '2025-12-01-notification-icon-star.png',
		// invitation-email assets.
		'invitation-envelope-graphic'   => '2026-02-05-invitation-envelope-graphic.png',
		// subscription-confirmation assets.
		'subscription-envelope-graphic' => '2026-02-20-subscription-envelope-graphic.png',
	);

	/**
	 * Gets the full CDN URL for an email asset by slug.
	 *
	 * @since 1.173.0
	 *
	 * @param string $slug The asset slug (e.g. 'site-kit-logo').
	 * @return string The full URL to the asset, or empty string if not found.
	 */
	public static function url( $slug ) {
		$filename = self::ASSETS[ $slug ] ?? '';

		if ( empty( $filename ) ) {
			return '';
		}

		return self::BASE_URL . $filename;
	}
}
