<?php
/**
 * Class Google\Site_Kit\Modules\Ads\Enhanced_Conversions
 *
 * @package   Google\Site_Kit\Modules\Ads
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Ads;

use Google\Site_Kit\Context;

/**
 * Class Enhanced_Conversions.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Enhanced_Conversions {

	/**
	 * Context instance.
	 *
	 * @since 1.128.0
	 * @var Context
	 */
	private $context;

	/**
	 * Constructor.
	 *
	 * @since 1.128.0
	 *
	 * @param Context $context Context instance.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Registers the module.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
	}

	/**
	 * Checks if the Terms of Service for Enhanced Conversions are accepted.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if accepted, false otherwise.
	 */
	public function is_tos_accepted() {
		return false;
	}

	/**
	 * Gets the user data for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array User data.
	 */
	public function get_user_data() {
		return array();
	}

	/**
	 * Enqueues the necessary scripts for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 */
	public function enqueue_gtag_user_data() {
	}

	/**
	 * Gets the debug fields for Enhanced Conversions.
	 *
	 * @since n.e.x.t
	 *
	 * @return array Debug fields.
	 */
	public function get_debug_fields() {
		return array();
	}

	/**
	 * Collects user data for Enhanced Conversions.
	 *
	 * This method is called to collect user data for Enhanced Conversions.
	 * It should be implemented to gather the necessary data.
	 *
	 * @since n.e.x.t
	 */
	public function collect_plugin_user_data() {
	}
}
