<?php

namespace Google\Site_Kit\Core\Tags;

use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Tags\Google_Tag_Gateway\Google_Tag_Gateway_Settings;
use Google\Site_Kit\Core\Util\Feature_Flags;

class GTag_Loader {
	private Options $options;

	public function __construct( Options $options ) {
		$this->options = $options;
	}

	public function register() {
		add_action( 'template_redirect', fn() => $this->load_gtag() );
	}

	private function load_gtag() {
		$this->get_gtag()->register();
	}

	/**
	 * Gets the GTag implementation to load.
	 *
	 * @return GTag|GTag_GTG
	 */
	public function get_gtag() {
		if ( $this->is_gtg_active() ) {
			return new GTag_GTG();
		}

		return new GTag();
	}

	/**
	 * Checks if Google tag gateway is active.
	 *
	 * @since n.e.x.t
	 *
	 * @return bool True if Google tag gateway is active, false otherwise.
	 */
	protected function is_gtg_active() {
		if ( ! Feature_Flags::enabled( 'googleTagGateway' ) ) {
			return false;
		}

		$settings = ( new Google_Tag_Gateway_Settings( $this->options ) )->get();

		return $settings['isEnabled'] && $settings['isGTGHealthy'] && $settings['isScriptAccessEnabled'];
	}
}
