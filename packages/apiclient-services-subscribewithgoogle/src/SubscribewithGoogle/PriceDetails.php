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

class PriceDetails extends \Google\Collection
{
  protected $collection_key = 'taxDetails';
  protected $pretaxAmountType = Money::class;
  protected $pretaxAmountDataType = '';
  protected $taxAmountType = Money::class;
  protected $taxAmountDataType = '';
  protected $taxDetailsType = TaxDetails::class;
  protected $taxDetailsDataType = 'array';
  protected $totalAmountType = Money::class;
  protected $totalAmountDataType = '';

  /**
   * @param Money
   */
  public function setPretaxAmount(Money $pretaxAmount)
  {
    $this->pretaxAmount = $pretaxAmount;
  }
  /**
   * @return Money
   */
  public function getPretaxAmount()
  {
    return $this->pretaxAmount;
  }
  /**
   * @param Money
   */
  public function setTaxAmount(Money $taxAmount)
  {
    $this->taxAmount = $taxAmount;
  }
  /**
   * @return Money
   */
  public function getTaxAmount()
  {
    return $this->taxAmount;
  }
  /**
   * @param TaxDetails[]
   */
  public function setTaxDetails($taxDetails)
  {
    $this->taxDetails = $taxDetails;
  }
  /**
   * @return TaxDetails[]
   */
  public function getTaxDetails()
  {
    return $this->taxDetails;
  }
  /**
   * @param Money
   */
  public function setTotalAmount(Money $totalAmount)
  {
    $this->totalAmount = $totalAmount;
  }
  /**
   * @return Money
   */
  public function getTotalAmount()
  {
    return $this->totalAmount;
  }
}

// Adding a class alias for backwards compatibility with the previous class name.
class_alias(PriceDetails::class, 'Google_Service_SubscribewithGoogle_PriceDetails');
