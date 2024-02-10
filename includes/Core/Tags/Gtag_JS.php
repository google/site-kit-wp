<?php

namespace Google\Site_Kit\Core\Tags;

class Gtag_JS {
	use Tag_With_DNS_Prefetch_Trait;

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

		add_filter(
			'wp_resource_hints',
			$this->get_dns_prefetch_hints_callback( '//www.googletagmanager.com' ),
			10,
			2
		);

		add_action(
			'wp_print_scripts',
			function () {
				if (
					! wp_script_is( self::HANDLE, 'queue' )
					|| wp_script_is( self::HANDLE, 'done' )
				) {
					return;
				}

				$this->print_comment( __( 'Google tag (gtag.js) snippet added by Site Kit', 'google-site-kit' ) );
				$this->print_tag_before();
				wp_scripts()->do_items( self::HANDLE );
				$this->print_tag_after();
				$this->print_comment( __( 'End Google tag (gtag.js) snippet added by Site Kit', 'google-site-kit' ) );
			}
		);
	}

	public static function enqueue() {
		wp_enqueue_script( self::HANDLE );
	}

	private function print_tag_before() {
		$gtag = new Gtag();
		$gtag->only_commands( [ 'consent' ] );

		do_action( 'googlesitekit_gtag_before', $gtag );

		if ( $gtag->has_calls() ) {
			$this->print_commands( $gtag );
		}
	}

	private function print_tag_after() {
		$gtag = new Gtag();
		$gtag( 'js', '{newDate}' );
		$gtag( 'set', 'developer_id.dZTNiMT', true );

		do_action( 'googlesitekit_gtag', $gtag );

		$this->print_commands( $gtag );
	}

	private function print_commands( Gtag $gtag ) {
		$javascript = $this->commands_to_js( $gtag->get_calls() );

		wp_print_inline_script_tag(
			join( "\n", $javascript ),
			[
				'data-googlesitekit' => true,
			]
		);
	}

	private function commands_to_js( $commands ) {
		// Initialize with common JS.
		$javascript = [
			'window.dataLayer = window.dataLayer || [];',
			'function gtag(){dataLayer.push(arguments);}',
		];

		foreach ( $commands as $command_args ) {
			$command_js = array_map(
				static function ( $arg ) {
					if ( '{newDate}' === $arg ) {
						return 'new Date()';
					}
					return wp_json_encode( $arg );
				},
				$command_args
			);
			$javascript[] = sprintf( 'gtag(%s);', join( ', ', $command_js ) );
		}

		return $javascript;
	}

	protected function print_comment( $text ) {
		printf( "<!-- %s -->\n", esc_html( $text ) );
	}
}
