<?php
/*
 * Copyright 2014 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

namespace Google\Service\SubscribewithGoogle;

class PaymentOptions extends \Google\Model
{
  /**
   * If true, the publication uses contributions for payment.
   *
   * @var bool
   */
  public $contributions;
  /**
   * If true, the publication has no payment option.
   *
   * @var bool
   */
  public $noPayment;
  /**
   * If true, the publication uses subscriptions for payment.
   *
   * @var bool
   */
  public $subscriptions;
  /**
   * If true, the publication uses Thank With Google stickers for payment.
   *
   * @deprecated
   * @var bool
   */
  public $thankStickers;

  /**
   * If true, the publication uses contributions for payment.
   *
   * @param bool $contributions
   */
  public function setContributions($contributions)
  {
    $this->contributions = $contributions;
  }
  /**
   * @return bool
   */
  public function getContributions()
  {
    return $this->contributions;
  }
  /**
   * If true, the publication has no payment option.
   *
   * @param bool $noPayment
   */
  public function setNoPayment($noPayment)
  {
    $this->noPayment = $noPayment;
  }
  /**
   * @return bool
   */
  public function getNoPayment()
  {
    return $this->noPayment;
  }
  /**
   * If true, the publication uses subscriptions for payment.
   *
   * @param bool $subscriptions
   */
  public function setSubscriptions($subscriptions)
  {
    $this->subscriptions = $subscriptions;
  }
  /**
   * @return bool
   */
  public function getSubscriptions()
  {
    return $this->subscriptions;
  }
  /**
   * If true, the publication uses Thank With Google stickers for payment.
   *
   * @deprecated
   * @param bool $thankStickers
   */
  public function setThankStickers($thankStickers)
  {
    $this->thankStickers = $thankStickers;
  }
  /**
   * @deprecated
   * @return bool
   */
  public function getThankStickers()
  {
    return $this->thankStickers;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PaymentOptions::class, 'Google_Service_SubscribewithGoogle_PaymentOptions');
