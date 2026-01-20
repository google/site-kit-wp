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
   * @var bool
   */
  public $contributions;
  /**
   * @var bool
   */
  public $noPayment;
  /**
   * @var bool
   */
  public $subscriptions;
  /**
   * @var bool
   */
  public $thankStickers;

  /**
   * @param bool
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
   * @param bool
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
   * @param bool
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
   * @param bool
   */
  public function setThankStickers($thankStickers)
  {
    $this->thankStickers = $thankStickers;
  }
  /**
   * @return bool
   */
  public function getThankStickers()
  {
    return $this->thankStickers;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PaymentOptions::class, 'Google_Service_SubscribewithGoogle_PaymentOptions');
