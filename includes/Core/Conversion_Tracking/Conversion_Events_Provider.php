<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Events_Provider
 *
 * @package   Google\Site_Kit\Core\Conversion_Tracking
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Script;

/**
 * Base class for conversion events provider.
 *
 * @since 1.125.0
 * @since 1.126.0 Changed from interface to abstract class.
 * @access private
 * @ignore
 */
abstract class Conversion_Events_Provider {

	/**
	 * Plugin context.
	 *
	 * @since 1.126.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Constructor.
	 *
	 * @since 1.126.0
	 *
	 * @param Context $context Plugin context.
	 */
	public function __construct( Context $context ) {
		$this->context = $context;
	}

	/**
	 * Checks if the provider is active.
	 *
	 * @since 1.125.0
	 *
	 * @return bool True if the provider is active, false otherwise.
	 */
	public function is_active() {
		return false;
	}

	/**
	 * Gets the event names.
	 *
	 * @since 1.125.0
	 *
	 * @return array List of event names.
	 */
	abstract public function get_event_names();

	/**
	 * Registers any actions/hooks for this provider.
	 *
	 * @since 1.129.0
	 */
	public function register_hooks() {
		// No-op by default, but left here so subclasses can implement
		// their own `add_action`/hook calls.
	}

	/**
	 * Registers the script for the provider.
	 *
	 * @since 1.125.0
	 *
	 * @return Script Script instance.
	 */
	abstract public function register_script();
}
