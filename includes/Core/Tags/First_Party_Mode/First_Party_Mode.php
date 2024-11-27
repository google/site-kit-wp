<?php
/**
 * Class Google\Site_Kit\Core\Tags\First_Party_Mode\First_Party_Mode
 *
 * @package   Google\Site_Kit\Core\Tags\First_Party_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Tags\First_Party_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Util\Method_Proxy_Trait;

/**
 * Class for handling First Party Mode.
 *
 * @since 1.141.0
 * @access private
 * @ignore
 */
class First_Party_Mode {
	use Method_Proxy_Trait;

	/**
	 * Context instance.
	 *
	 * @since 1.141.0
	 * @var Context
	 */
	protected $context;

	/**
	 * First_Party_Mode_Settings instance.
	 *
	 * @since 1.141.0
	 * @var First_Party_Mode_Settings
	 */
	protected $first_party_mode_settings;

	/**
	 * REST_First_Party_Mode_Controller instance.
	 *
	 * @since 1.141.0
	 * @var REST_First_Party_Mode_Controller
	 */
	protected $rest_controller;

	/**
	 * Constructor.
	 *
	 * @since 1.141.0
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$this->context                   = $context;
		$options                         = $options ?: new Options( $context );
		$this->first_party_mode_settings = new First_Party_Mode_Settings( $options );
		$this->rest_controller           = new REST_First_Party_Mode_Controller( $this->first_party_mode_settings );
	}

	/**
	 * Registers the settings and REST controller.
	 *
	 * @since 1.141.0
	 */
	public function register() {
		$this->first_party_mode_settings->register();
		$this->rest_controller->register();
	}
}
