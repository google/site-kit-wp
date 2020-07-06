<?php
/**
 * Class Google\Site_Kit\Modules\Analytics\Shirshu_Class
 *
 * @package   Google\Site_Kit\Modules\Analytics
 * @copyright 2019 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Context;
use Google\Site_Kit\Modules\Analytics\Plugin_Detector;
use Google\Site_Kit\Modules\Analytics\Measurement_Code_Injector;

/**
 * Main Shirshu_Class class
 *
 * @class Shirshu_Class
 */
final class Shirshu_Class {

	/**
	 * List of plugins ShirshuClass supports for event tracking
	 *
	 * @var array of strings
	 */
	private $supported_plugins;

	/**
	 * Single instance of the class
	 *
	 * @var Shirshu_Class
	 */
	protected static $instance = null;

	/**
	 * Instance of the plugin detector
	 *
	 * @var Plugin_Detector
	 */
	protected $plugin_detector = null;

	/**
	 * Instance of the event injector
	 *
	 * @var Measurement_Code_Injector
	 */
	protected $measurement_code_injector = null;

	/**
	 * Plugin context.
	 *
	 * @since 1.0.0
	 * @var Context
	 */
	protected $context;

	/**
	 * Returns the main Shirshu_Class instance
	 *
	 * @param Context $module_context used to check for AMP.
	 * @return Shirshu_Class - Main instance
	 */
	public static function get_instance( $module_context ) {
		if ( is_null( self::$instance ) ) {
			self::$instance = new self( $module_context );
		}
		return self::$instance;
	}

	/**
	 * Shirshu_Class constructor
	 *
	 * @param Context $module_context context used to check for AMP.
	 */
	private function __construct( $module_context ) {
		$this->context           = $module_context;
		$this->supported_plugins = array(
			'Contact Form 7'   => 'WPCF7_PLUGIN_DIR',
			'Formidable Forms' => 'load_formidable_forms',
			'Ninja Forms'      => 'NF_PLUGIN_DIR',
			'WooCommerce'      => 'WC_PLUGIN_FILE',
			'WPForms'          => 'WPFORMS_PLUGIN_DIR',
			'WPForms Lite'     => 'WPFORMS_PLUGIN_DIR',
		);
		$this->plugin_detector   = new Plugin_Detector( $this->supported_plugins );
		$this->get_active_plugins();
	}

	/**
	 * Returns a list of plugins that Shirshu_Class supports
	 *
	 * @return array of strings
	 */
	protected function get_supported_plugins() {
		return $this->supported_plugins;
	}

	/**
	 * Determines active plugins once WordPress loads plugins
	 */
	public function get_active_plugins() {
		$active_plugins                  = $this->plugin_detector->get_active_plugins();
		$this->measurement_code_injector = new Measurement_Code_Injector( $active_plugins, $this->context );
	}

}
