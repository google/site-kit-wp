<?php
/**
 * Class Google\Site_Kit\Modules\Analytics_4\Post_List_Column_Preferences
 *
 * @package   Google\Site_Kit
 * @copyright 2026 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics_4;

use Google\Site_Kit\Core\Storage\User_Options_Interface;

/**
 * User preferences for the GA4 post list column (global per user, all post types).
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
final class Post_List_Column_Preferences {

	const ALLOWED_METRICS = array(
		'screenPageViews',
		'sessions',
		'engagedSessions',
		'activeUsers',
	);

	const ALLOWED_DATE_RANGES = array(
		'last-7-days',
		'last-14-days',
		'last-28-days',
		'last-90-days',
	);

	const DEFAULT_METRIC     = 'screenPageViews';
	const DEFAULT_DATE_RANGE = 'last-28-days';

	/**
	 * User-meta option keys (also Screen Options form field `name` / `id` on edit.php).
	 */
	const OPTION_METRIC     = 'googlesitekit_ga4_post_list_metric';
	const OPTION_DATE_RANGE = 'googlesitekit_ga4_post_list_date_range';

	/**
	 * Metric user setting.
	 *
	 * @var Post_List_Column_Metric_User_Setting
	 */
	private $metric_setting;

	/**
	 * Date range user setting.
	 *
	 * @var Post_List_Column_Date_Range_User_Setting
	 */
	private $date_range_setting;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param User_Options_Interface $user_options User options.
	 */
	public function __construct( User_Options_Interface $user_options ) {
		$this->metric_setting     = new Post_List_Column_Metric_User_Setting( $user_options );
		$this->date_range_setting = new Post_List_Column_Date_Range_User_Setting( $user_options );
	}

	/**
	 * Registers user meta for both settings.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->metric_setting->register();
		$this->date_range_setting->register();
	}

	/**
	 * Gets the selected metric API name.
	 *
	 * @since n.e.x.t
	 *
	 * @return string
	 */
	public function get_metric() {
		$value = $this->metric_setting->get();
		return in_array( $value, self::ALLOWED_METRICS, true ) ? $value : self::DEFAULT_METRIC;
	}

	/**
	 * Gets the selected date range slug.
	 *
	 * @since n.e.x.t
	 *
	 * @return string
	 */
	public function get_date_range_slug() {
		$value = $this->date_range_setting->get();
		return in_array( $value, self::ALLOWED_DATE_RANGES, true ) ? $value : self::DEFAULT_DATE_RANGE;
	}

	/**
	 * Sets metric from raw input (sanitized).
	 *
	 * @since n.e.x.t
	 *
	 * @param string $metric Metric name.
	 * @return bool
	 */
	public function set_metric( $metric ) {
		if ( ! in_array( $metric, self::ALLOWED_METRICS, true ) ) {
			$metric = self::DEFAULT_METRIC;
		}
		return $this->metric_setting->set( $metric );
	}

	/**
	 * Sets date range from raw input (sanitized).
	 *
	 * @since n.e.x.t
	 *
	 * @param string $slug Date range slug.
	 * @return bool
	 */
	public function set_date_range_slug( $slug ) {
		if ( ! in_array( $slug, self::ALLOWED_DATE_RANGES, true ) ) {
			$slug = self::DEFAULT_DATE_RANGE;
		}
		return $this->date_range_setting->set( $slug );
	}

	/**
	 * Human-readable labels for metrics (column header).
	 *
	 * @since n.e.x.t
	 *
	 * @return array<string, string>
	 */
	public static function get_metric_labels() {
		return array(
			'screenPageViews' => __( 'Page views', 'google-site-kit' ),
			'sessions'        => __( 'Sessions', 'google-site-kit' ),
			'engagedSessions' => __( 'Engaged sessions', 'google-site-kit' ),
			'activeUsers'     => __( 'Active users', 'google-site-kit' ),
		);
	}

	/**
	 * Human-readable labels for date ranges (tooltip).
	 *
	 * @since n.e.x.t
	 *
	 * @return array<string, string>
	 */
	public static function get_date_range_labels() {
		return array(
			'last-7-days'  => __( 'Last 7 days', 'google-site-kit' ),
			'last-14-days' => __( 'Last 14 days', 'google-site-kit' ),
			'last-28-days' => __( 'Last 28 days', 'google-site-kit' ),
			'last-90-days' => __( 'Last 90 days', 'google-site-kit' ),
		);
	}
}
