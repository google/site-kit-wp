<?php
/**
 * Class Google\Site_Kit\Core\Conversion_Tracking\Conversion_Tracking
 *
 * @package   Google\Site_Kit\Core\Key_Metrics
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Conversion_Tracking;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling Conversion_Tracking.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Conversion_Tracking {

	use Method_Proxy_Trait;

	/**
	 * Conversion_Tracking_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Conversion_Tracking_Settings
	 */
	protected $conversion_tracking_settings;

	/**
	 * REST_Conversion_Tracking_Controller instance.
	 *
	 * @since n.e.x.t
	 * @var REST_Conversion_Tracking_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$this->conversion_tracking_settings = new Conversion_Tracking_Settings( $options ?: new Options( $context ) );
		$this->rest_controller              = new REST_Conversion_Tracking_Controller( $this->conversion_tracking_settings );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->conversion_tracking_settings->register();
		$this->rest_controller->register();

		add_filter( 'googlesitekit_inline_base_data', $this->get_method_proxy( 'inline_js_base_data' ) );
	}

	/**
	 * Adds the status of the Conversion Tracking Settings to the inline JS data.
	 *
	 * @since n.e.x.t
	 *
	 * @param array $data Inline JS data.
	 * @return array Filtered $data.
	 */
	private function inline_js_base_data( $data ) {
		return $data;
	}

}
