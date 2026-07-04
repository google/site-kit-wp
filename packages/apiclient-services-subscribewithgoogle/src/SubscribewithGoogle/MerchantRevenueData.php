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

class MerchantRevenueData extends \Google\Model
{
  /**
   * Exchange rate used when converting buyer amounts to payout amounts in
   * merchant currency.
   *
   * @var float
   */
  public $currencyConversionRate;
  /**
   * Whether merchant revenue data is available at this time.
   *
   * @var bool
   */
  public $isMerchantRevenueDataAvailable;
  protected $merchantAmountType = Money::class;
  protected $merchantAmountDataType = '';

  /**
   * Exchange rate used when converting buyer amounts to payout amounts in
   * merchant currency.
   *
   * @param float $currencyConversionRate
   */
  public function setCurrencyConversionRate($currencyConversionRate)
  {
    $this->currencyConversionRate = $currencyConversionRate;
  }
  /**
   * @return float
   */
  public function getCurrencyConversionRate()
  {
    return $this->currencyConversionRate;
  }
  /**
   * Whether merchant revenue data is available at this time.
   *
   * @param bool $isMerchantRevenueDataAvailable
   */
  public function setIsMerchantRevenueDataAvailable($isMerchantRevenueDataAvailable)
  {
    $this->isMerchantRevenueDataAvailable = $isMerchantRevenueDataAvailable;
  }
  /**
   * @return bool
   */
  public function getIsMerchantRevenueDataAvailable()
  {
    return $this->isMerchantRevenueDataAvailable;
  }
  /**
   * Amount paid to the merchant for this invoice line at merchant currency
   * after fees and taxes applied.
   *
   * @param Money $merchantAmount
   */
  public function setMerchantAmount(Money $merchantAmount)
  {
    $this->merchantAmount = $merchantAmount;
  }
  /**
   * @return Money
   */
  public function getMerchantAmount()
  {
    return $this->merchantAmount;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(MerchantRevenueData::class, 'Google_Service_SubscribewithGoogle_MerchantRevenueData');
