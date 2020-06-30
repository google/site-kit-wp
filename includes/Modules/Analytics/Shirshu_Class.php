<?php

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Modules\Analytics\Shirshu\Plugin_Detector;
use Google\Site_Kit\Modules\Analytics\Shirshu\Measurement_Code_Injector;

/**
 * Main ShirshuClass class
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
	 * @var ShirshuClass
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
	 * Returns the main ShirshuClass instance
	 *
	 * @return ShirshuClass - Main instance
	 *@see SS()
	 */
	public static function get_instance(){
		if(is_null(self::$instance)){
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * ShirshuClass constructor
	 */
	private function __construct(){
		$this->supported_plugins = array('Contact Form 7' => 'WPCF7_PLUGIN_DIR',
			'Formidable Forms' => 'load_formidable_forms',
			'Ninja Forms' => 'NF_PLUGIN_DIR',
			'WooCommerce' => 'WC_PLUGIN_FILE',
			'WPForms' => 'WPFORMS_PLUGIN_DIR',
			'WPForms Lite' => 'WPFORMS_PLUGIN_DIR');
		$this->plugin_detector = new Plugin_Detector($this->supported_plugins);
		$this->get_active_plugins();
	}

	/**
	 * Returns a list of plugins that ShirshuClass supports
	 *
	 * @return array of strings
	 */
	protected function get_supported_plugins(){
		return $this->supported_plugins;
	}

	/**
	 * Determines active plugins once WordPress loads plugins
	 */
	public function get_active_plugins() {
		$active_plugins = $this->plugin_detector->get_active_plugins();
		$this->measurement_code_injector = new Measurement_Code_Injector($active_plugins);
	}

}
