<?php

namespace Google\Site_Kit\Modules\Analytics;

use Google\Site_Kit\Core\Storage\Options_Interface;
use Google\Site_Kit\Modules\Analytics_4\Settings as Settings_GA4;

class Analytics_Owner_ID_Sync {
	/**
	 * @var Analytics_Owner_ID
	 */
	private $owner_id;
	/**
	 * @var Options_Interface
	 */
	private $options;

	/**
	 * @param Analytics_Owner_ID $owner_id
	 */
	public function __construct( Analytics_Owner_ID $owner_id, Options_Interface $options ) {
		$this->owner_id = $owner_id;
		$this->options = $options;
	}

	public function register() {
		$this->sync_on_module_settings_update( Settings::OPTION );
		$this->sync_on_module_settings_update( Settings_GA4::OPTION );
		$this->apply_common_owner_id();
		$this->clean_up_on_delete( Settings::OPTION, Settings_GA4::OPTION );
		$this->clean_up_on_delete( Settings_GA4::OPTION, Settings::OPTION );
	}

	protected function sync_on_module_settings_update( $option ) {
		add_action(
			"add_option_{$option}",
			function ( $option, $value ) {
				// The owner ID setting will only query an update if the value has changed.
				$this->owner_id->set( $value['ownerID'] );
			},
			10,
			2
		);
		add_action(
			"update_option_{$option}",
			function ( $old_value, $value ) {
				// The owner ID setting will only query an update if the value has changed.
				$this->owner_id->set( $value['ownerID'] );
			},
			10,
			2
		);
	}

	protected function apply_common_owner_id() {
		add_filter( 'googlesitekit_analytics_owner_id', function ( $id ) {
			return $this->owner_id->get() ?: $id;
		} );
	}

	protected function clean_up_on_delete( $option, $other_option ) {
		add_action(
			"delete_option_{$option}",
			function () use ( $other_option ) {
				if ( ! $this->options->has( $other_option ) ) {
					$this->owner_id->delete();
				}
			}
		);
	}
}
