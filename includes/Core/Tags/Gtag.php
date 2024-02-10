<?php

namespace Google\Site_Kit\Core\Tags;

class Gtag_JS {
	const HANDLE = 'google_gtagjs';
	protected $measurement_id;

	public function __construct( $measurement_id ) {
		$this->measurement_id = (string) $measurement_id;
	}

	function register() {
		wp_register_script(
			self::HANDLE,
			'https://www.googletagmanager.com/gtag/js?id=' . rawurlencode( $this->measurement_id ),
			array(), // Deps
			null // Version: omit ?ver=
			// Core async strategy puts the script in the footer, and removes async when setting inline scripts
		);
		wp_script_add_data( 'google_gtagjs', 'script_execution', 'async' );

		add_action(
			'wp_print_scripts',
			function () {
//				ray( wp_scripts()->queue );

				if ( ! in_array( self::HANDLE, wp_scripts()->queue ) ) {
					return;
				}

				$this->before_print();
				$this->add_after_print();
			}
		);
	}

	public static function enqueue() {
		wp_enqueue_script( self::HANDLE );
	}

	private function before_print() {
		$commands = new Gtag_JS_Commands();

		do_action( 'googlesitekit_gtagjs_commands_before', $commands );

		if ( count( $commands ) ) {
			$this->print_commands( $commands );
		}
	}

	private function add_after_print() {
		$commands = new Gtag_JS_Commands();

		do_action( 'googlesitekit_gtagjs_commands', $commands );

		$this->add_inline_after( $commands );
	}

	private function add_inline_after( Gtag_JS_Commands $commands ) {
		$javascript = $this->commands_to_js( $commands );
		$data       = join( "\n", $javascript );

		wp_add_inline_script( self::HANDLE, $data );
	}

	private function print_commands( Gtag_JS_Commands $commands ) {
		$javascript = $this->commands_to_js( $commands );

		wp_print_inline_script_tag(
			join( "\n", $javascript ),
			[
				'data-googlesitekit' => true,
			]
		);
	}

	private function commands_to_js( Gtag_JS_Commands $commands ) {
		$javascript = [];
		// Initialize with common JS.
		$javascript[] = 'window.dataLayer = window.dataLayer || [];';
		$javascript[] = 'function gtag(){dataLayer.push(arguments);}';

		foreach ( $commands as $command ) {
			$command_js = array_map(
				function ( $cmd ) {
					return wp_json_encode( $cmd );
				},
				$command
			);
			$javascript[] = sprintf( 'gtag(%s);', join( ', ', $command_js ) );
		}

		return $javascript;
	}
}
