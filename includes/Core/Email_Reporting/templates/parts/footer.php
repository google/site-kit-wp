<?php
/**
 * Footer part shared across email templates.
 *
 * @package   Google\Site_Kit\Core\Email_Reporting
 * @copyright 2025 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 *
 * @var array    $cta               Primary CTA configuration with 'url' and 'label'.
 * @var array    $footer            Footer configuration with 'copy', 'unsubscribe_url', and 'links'.
 * @var callable $render_shared_part Function to render a shared part by name.
 */

?>
<table role="presentation" width="100%" style="margin-top:24px;">
	<tr>
		<td style="text-align:center;">
			<?php if ( ! empty( $cta['url'] ) ) : ?>
				<div style="margin-bottom:60px;">
					<?php
					$render_shared_part(
						'dashboard-link',
						array(
							'url'   => $cta['url'],
							'label' => isset( $cta['label'] ) ? $cta['label'] : __( 'View dashboard', 'google-site-kit' ),
						)
					);
					?>
				</div>
			<?php endif; ?>
			<?php if ( ! empty( $footer['copy'] ) ) : ?>
				<p style="font-size:12px; line-height:16px; font-weight:500; color:#6C726E; margin-bottom: 30px; text-align: left;">
					<?php
					$unsubscribe_link = '';
					if ( ! empty( $footer['unsubscribe_url'] ) ) {
						$unsubscribe_link = sprintf(
							'<a href="%s" style="color:#108080; text-decoration:none;">%s</a>',
							esc_url( $footer['unsubscribe_url'] ),
							esc_html__( 'here', 'google-site-kit' )
						);
					}
					// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Link is escaped above.
					printf( '%s %s.', esc_html( $footer['copy'] ), $unsubscribe_link );
					?>
				</p>
			<?php endif; ?>
			<?php if ( ! empty( $footer['links'] ) && is_array( $footer['links'] ) ) : ?>
				<table role="presentation" width="100%" style="font-size:12px; line-height:18px;">
					<tr>
						<?php
						$alignments = array( 'left', 'center', 'right' );
						foreach ( $footer['links'] as $index => $footer_link ) :
							$align = isset( $alignments[ $index ] ) ? $alignments[ $index ] : 'center';
							?>
							<td width="33.33%" style="text-align:<?php echo esc_attr( $align ); ?>;">
								<a href="<?php echo esc_url( $footer_link['url'] ); ?>" style="color:#6C726E; text-decoration:none; font-size:12px; line-height:16px; font-weight:500;" target="_blank" rel="noopener">
									<?php echo esc_html( $footer_link['label'] ); ?>
								</a>
							</td>
						<?php endforeach; ?>
					</tr>
				</table>
			<?php endif; ?>
		</td>
	</tr>
</table>
