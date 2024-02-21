<?php
/**
 * Class Google\Site_Kit\Core\Consent_Mode\Consent_Mode
 *
 * @package   Google\Site_Kit\Core\Consent_Mode
 * @copyright 2024 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Core\Consent_Mode;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Storage\Options;

/**
 * Class for handling Consent Mode.
 *
 * @since n.e.x.t
 * @access private
 * @ignore
 */
class Consent_Mode {

	/**
	 * Consent_Mode_Settings instance.
	 *
	 * @since n.e.x.t
	 * @var Consent_Mode_Settings
	 */
	protected $consent_mode_settings;


	/**
	 * Constructor.
	 *
	 * @since n.e.x.t
	 *
	 * @param Context $context Plugin context.
	 * @param Options $options Optional. Option API instance. Default is a new instance.
	 */
	public function __construct( Context $context, Options $options = null ) {
		$options                     = $options ?: new Options( $context );
		$this->consent_mode_settings = new Consent_Mode_Settings( $options );
	}

	/**
	 * Registers functionality through WordPress hooks.
	 *
	 * @since n.e.x.t
	 */
	public function register() {
		$this->consent_mode_settings->register();
	}
}
