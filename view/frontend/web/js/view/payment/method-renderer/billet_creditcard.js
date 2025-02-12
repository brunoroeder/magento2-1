/**
 * @author      MundiPagg Embeddables Team <embeddables@mundipagg.com>
 * @copyright   2017 MundiPagg (http://www.mundipagg.com)
 * @license     http://www.mundipagg.com  Copyright
 *
 * @link        http://www.mundipagg.com
 */
/*browser:true*/
/*global define*/
define(
    [
        'MundiPagg_MundiPagg/js/view/payment/bcc-form',
        'ko',
        'MundiPagg_MundiPagg/js/helper/address-helper',
        'MundiPagg_MundiPagg/js/action/installments',
        'MundiPagg_MundiPagg/js/action/installmentsByBrand',
        'MundiPagg_MundiPagg/js/action/installmentsByBrandAndAmount',
        'jquery',
        'jquerymask',
        'Magento_Checkout/js/model/quote',
        'Magento_Catalog/js/price-utils',
        'Magento_Checkout/js/model/totals',
        'Magento_Checkout/js/checkout-data',
        'Magento_Checkout/js/action/select-payment-method',
        'MundiPagg_MundiPagg/js/action/creditcard/token',
        'Magento_Checkout/js/model/full-screen-loader',
        'mage/translate'
    ],
    function (
        Component,
        ko,
        addressHelper,
        installments,
        installmentsByBrand,
        installmentsByBrandAndAmount,
        $,
        jquerymask,
        quote,
        priceUtils,
        totals,
        checkoutData,
        selectPaymentMethodAction,
        token,
        fullScreenLoader,
        $t
    ) {

        return Component.extend({
            defaults: {
                template: 'MundiPagg_MundiPagg/payment/billet-creditcard',
                creditCardTypeBcc: '',
                creditCardSavedNumberBcc: '',
                creditCardCcAmountBcc: '',
                creditCardCcTaxAmountBcc: '',
                creditCardBilletAmountBcc: '',
                creditCardInstallmentsBcc: '',
                creditCardOwnerBcc: '',
                creditCardExpYearBcc: '',
                creditCardExpMonthBcc: '',
                creditCardsavecardBcc: 0,
                creditCardNumberBcc: '',
                creditCardSsStartMonthBcc: '',
                creditCardSsStartYearBcc: '',
                creditCardSsIssueBcc: '',
                creditCardVerificationNumberBcc: '',
                tokenCreditCard: '',

                creditSavedCardBcc: window.checkoutConfig.payment.mundipagg_billet_creditcard.selected_card,
                selectedCardTypeBcc: null,
                allInstallments: ko.observableArray([]),
                billetBuyerCheckbox: '',
                billetBuyerEmail: '',
                billetBuyerName: '',
                billetBuyerDocument: '',
                billetBuyerStreetTitle: '',
                billetBuyerStreetNumber: '',
                billetBuyerStreetComplement: '',
                billetBuyerZipCode: '',
                billetBuyerNeighborhood: '',
                billetBuyerCity: '',
                billetBuyerState: '',
                billetBuyerCountry: '',
                creditCardBuyerCheckbox: '',
                creditCardBuyerEmail: '',
                creditCardBuyerName: '',
                creditCardBuyerDocument: '',
                creditCardBuyerStreetTitle: '',
                creditCardBuyerStreetNumber: '',
                creditCardBuyerStreetComplement: '',
                creditCardBuyerZipCode: '',
                creditCardBuyerNeighborhood: '',
                creditCardBuyerCity: '',
                creditCardBuyerState: '',
                quoteBilling: quote.billingAddress(),
                stateOptions: addressHelper.getStateOptions()
            },

            totals: quote.getTotals(),

            initialize: function () {
                this._super();

                this.getCcInstallments();

                var self = this;

                var totalQuote = quote.getTotals()().grand_total;

                $('.money').mask('000.000.000.000.000,00', {reverse: true});

                this.formatPrice = function (value) {

                    var input = document.createElement("input");
                    input.type = "hidden";
                    document.body.appendChild(input);
                    input.value = value;
                    $(input).mask('000.000.000.000.000,00', {reverse: true});
                    value = input.value;
                    document.body.removeChild(input);
                    return value;

                }

                this.validateTotalQuote = function () {

                    if (Math.abs(parseFloat(self.creditCardBilletAmountBcc())) + Math.abs(parseFloat(self.creditCardCcAmountBcc())) > totalQuote) {
                        self.bindCreditCardBilletAmountBcc(null);
                        self.bindCreditCardCcAmountBcc(null);
                        jQuery('#mundipagg_billet_creditcard_cc_installments').css('display','none');
                    }

                }

                this.bindCreditCardBilletAmountBcc = ko.computed({
                    read: function () {
                        var value = this.creditCardBilletAmountBcc();
                        value = value.replace(/[^\d]/g, "");
                        return this.formatPrice(value);
                    },
                    write: function (value) {
                        if (value != 'null') {
                            value = this.formatPrice(value);
                            value = value.replace(/[^,\d]/g, "");
                            value = value.replace(",", ".");
                            this.creditCardBilletAmountBcc(value);
                            this.creditCardCcAmountBcc((totalQuote - value).toFixed(2));
                            jQuery('#mundipagg_billet_creditcard_cc_installments').css('display','block');
                            this.validateTotalQuote();
                        }

                    },
                    owner: self
                });

                this.bindCreditCardCcAmountBcc = ko.computed({
                    read: function () {
                        var value = this.creditCardCcAmountBcc();
                        value = value.replace(/[^\d]/g, "");
                        return this.formatPrice(value);
                    },
                    write: function (value) {
                        if (value != 'null') {
                            value = this.formatPrice(value);
                            value = value.replace(/[^,\d]/g, "");
                            value = value.replace(",", ".");
                            this.creditCardCcAmountBcc(value);
                            this.creditCardBilletAmountBcc((totalQuote - value).toFixed(2));
                            jQuery('#mundipagg_billet_creditcard_cc_installments').css('display','block');
                            this.validateTotalQuote();
                        }

                    },
                    owner: self
                });

                this.bindInstallmentsByBlurBcc = function (){

                    var cards = window.checkoutConfig.payment.mundipagg_billet_creditcard.cards;
                    cards.find(function(value, index) {
                        if(value.id == self.creditSavedCardBcc()){
                            self.selectedCardTypeBcc(value.brand);
                        }
                    });
                    this.getInstallmentsByApi();
                };

                this.getInstallmentsByApi = function () {
                    if (!isNaN(this.creditCardCcAmountBcc()) && this.creditCardCcAmountBcc() != '') {
                        self.allInstallments.removeAll();
                        fullScreenLoader.startLoader();
                        $.when(
                            installmentsByBrandAndAmount(self.selectedCardTypeBcc(), this.creditCardCcAmountBcc())
                        ).done(function (data) {
                            self.allInstallments.removeAll();

                            _.map(data, function (value, key) {
                                self.allInstallments.push({
                                    'value': value.id,
                                    'interest': value.interest,
                                    'installments': value.label
                                });
                            });

                        }).always(function () {
                            fullScreenLoader.stopLoader();
                        });

                    }

                };

                this.selectedCardTypeBcc.subscribe(function (newValue) {

                    if (newValue) {

                        fullScreenLoader.startLoader();
                        self.allInstallments.removeAll();
                        var creditCardAmount = self.creditCardCcAmountBcc() ? self.creditCardCcAmountBcc() : 0;
                        $.when(
                            installmentsByBrandAndAmount(newValue, creditCardAmount)
                        ).done(function (data) {
                            self.allInstallments.removeAll();

                            _.map(data, function (value, key) {
                                self.allInstallments.push({
                                    'value': value.id,
                                    'interest': value.interest,
                                    'installments': value.label
                                });
                            });

                        }).always(function () {
                            fullScreenLoader.stopLoader();
                        });

                    }

                });

                this.creditSavedCardBcc.subscribe(function(value){
                    if (typeof value != 'undefined') {
                        var cards = window.checkoutConfig.payment.mundipagg_billet_creditcard.cards;
                        for (var i = 0, len = cards.length; i < len; i++) {
                            if(cards[i].id == value){
                                self.creditCardSavedNumberBcc(window.checkoutConfig.payment.mundipagg_billet_creditcard.cards[i].last_four_numbers);
                                self.selectedCardTypeBcc(window.checkoutConfig.payment.mundipagg_billet_creditcard.cards[i].brand);
                            }
                        }
                    }
                });

            },

            /**
             * Select current payment token
             */
            selectPaymentMethod: function () {
                this.oldInstallmentTax = window.checkoutConfig.payment.ccform.installments.value;
                var newTax = 0;

                var total = quote.getTotals()();
                var subTotalIndex = null;
                for (var i = 0, len = total.total_segments.length; i < len; i++) {
                    if (total.total_segments[i].code == "grand_total") {
                        subTotalIndex = i;
                        continue;
                    }
                    if (total.total_segments[i].code != "tax") continue;
                    total.total_segments[i].value = newTax;
                }

                total.total_segments[subTotalIndex].value = +total.total_segments[subTotalIndex].value - this.oldInstallmentTax;
                total.total_segments[subTotalIndex].value = +total.total_segments[subTotalIndex].value + parseFloat(newTax);
                total.tax_amount = parseFloat(newTax);
                total.base_tax_amount = parseFloat(newTax);
                this.oldInstallmentTax = newTax;
                window.checkoutConfig.payment.ccform.installments.value = newTax;
                quote.setTotals(total);

                selectPaymentMethodAction(this.getData());
                checkoutData.setSelectedPaymentMethod(this.item.method);
                $("#mundipagg_billet_creditcard_installments").val('');

                return true;
            },

            /**
             * Get payment method data
             */
            getData: function () {
                return {
                    'method': this.item.method,
                    'po_number': null,
                    'additional_data': null
                };
            },

            initObservable: function () {
                this._super()
                    .observe([
                        'creditCardTypeBcc',
                        'creditCardSavedNumberBcc',
                        'creditCardCcAmountBcc',
                        'creditCardCcTaxAmountBcc',
                        'creditCardBilletAmountBcc',
                        'creditCardOwnerBcc',
                        'creditCardExpYearBcc',
                        'creditCardExpMonthBcc',
                        'creditCardNumberBcc',
                        'creditCardVerificationNumberBcc',
                        'creditCardSsStartMonthBcc',
                        'creditCardSsStartYearBcc',
                        'creditCardsavecardBcc',
                        'creditCardSsIssueBcc',
                        'creditSavedCardBcc',
                        'selectedCardTypeBcc',
                        'creditCardInstallmentsBcc',
                        'creditCardBuyerCheckbox',
                        'creditCardBuyerEmail',
                        'creditCardBuyerName',
                        'creditCardBuyerDocument',
                        'creditCardBuyerStreetTitle',
                        'creditCardBuyerStreetNumber',
                        'creditCardBuyerStreetComplement',
                        'creditCardBuyerZipCode',
                        'creditCardBuyerNeighborhood',
                        'creditCardBuyerCity',
                        'creditCardBuyerState',
                        'billetBuyerCheckbox',
                        'billetBuyerEmail',
                        'billetBuyerName',
                        'billetBuyerDocument',
                        'billetBuyerStreetTitle',
                        'billetBuyerStreetNumber',
                        'billetBuyerStreetComplement',
                        'billetBuyerZipCode',
                        'billetBuyerNeighborhood',
                        'billetBuyerCity',
                        'billetBuyerState'
                    ]);

                return this;
            },

            getCode: function () {
                return 'mundipagg_billet_creditcard';
            },

            isActive: function () {
                return window.checkoutConfig.payment.mundipagg_billet_creditcard.active;
            },

            getTitle: function () {
                return window.checkoutConfig.payment.mundipagg_billet_creditcard.title;
            },

            isMultiBuyerActive: function () {
                return window.checkoutConfig.multi_buyer;
            },

            isInstallmentsActive: function () {
                return window.checkoutConfig.payment.ccform.installments.active['mundipagg_creditcard'];
            },

            getCcInstallments: function () {
                var self = this;

                //fullScreenLoader.startLoader();
                $.when(
                    installments()
                ).done(function (transport) {
                    self.allInstallments.removeAll();

                    _.map(transport, function (value, key) {
                        self.allInstallments.push({
                            'value': value.id,
                            'interest': value.interest,
                            'installments': value.label
                        });
                    });

                }).always(function () {
                    //fullScreenLoader.stopLoader();
                });
            },

            setInterest: function (option, item) {
                if (typeof item != 'undefined') {
                    ko.applyBindingsToNode(option, {
                        attr: {
                            interest: item.interest
                        }
                    }, item);
                }

            },

            getCcInstallmentsValues: function () {
                return _.map(this.getCcInstallments(), function (value, key) {
                    return {
                        'value': key,
                        'installments': value
                    };
                });
            },

            /**
             * Place order.
             */
            beforeplaceOrder: function (data, event) {

                if((this.creditCardCcAmountBcc() === "") || (this.creditCardCcAmountBcc() == "0.00")){
                    this.messageContainer.addErrorMessage({
                        message: $t('Credit Card amount not informed.')
                    });
                    $("html, body").animate({ scrollTop: 0 }, 600);
                    return false;
                }

                if((this.creditCardBilletAmountBcc() === "") || this.creditCardBilletAmountBcc() == "0.00"){
                    this.messageContainer.addErrorMessage({
                        message: $t('Billet amount not informed.')
                    });
                    $("html, body").animate({ scrollTop: 0 }, 600);
                    return false;
                }

                if(this.isInstallmentsActive() == true){
                    if (this.creditCardInstallmentsBcc() === undefined) {
                        this.messageContainer.addErrorMessage({
                            message: $t('Installments not informed.')
                        });
                        $("html, body").animate({scrollTop: 0}, 600);
                        return false;
                    }
                }

                if (window.checkoutConfig.customerData.hasOwnProperty('email') && data.getData().additional_data.cc_saved_card) {
                    this.useCardIdPlaceOrder(data, event);
                }else{
                    this.createAndSendTokenCreditCard(data, event);
                }
            },

            useCardIdPlaceOrder: function (data, event) {
                this.placeOrder(data, event);
            },

            createAndSendTokenCreditCard: function (data, event) {

                var brandIsValid = window.checkoutConfig.payment.mundipagg_billet_creditcard.brandIsValid;

                if(!brandIsValid){
                    this.messageContainer.addErrorMessage({
                        message: $t('Brand not exists.')
                    });
                    $("html, body").animate({scrollTop: 0}, 600);
                    return false;
                }

                if(this.creditCardOwnerBcc() === ""){
                    this.messageContainer.addErrorMessage({
                        message: $t('Name not informed.')
                    });
                    $("html, body").animate({ scrollTop: 0 }, 600);
                    return false;
                }

                if(this.creditCardExpMonthBcc() === undefined){
                    this.messageContainer.addErrorMessage({
                        message: $t('Month not informed.')
                    });
                    $("html, body").animate({ scrollTop: 0 }, 600);
                    return false;
                }

                if(this.creditCardExpYearBcc() === undefined){
                    this.messageContainer.addErrorMessage({
                        message: $t('Year not informed.')
                    });
                    $("html, body").animate({ scrollTop: 0 }, 600);
                    return false;
                }

                if(this.creditCardVerificationNumberBcc() === ""){
                    this.messageContainer.addErrorMessage({
                        message: $t('Verifier code not informed.')
                    });
                    $("html, body").animate({ scrollTop: 0 }, 600);
                    return false;
                }

                if(this.isInstallmentsActive() == true){
                    if (this.creditCardInstallmentsBcc() === undefined) {
                        this.messageContainer.addErrorMessage({
                            message: $t('Installments not informed.')
                        });
                        $("html, body").animate({scrollTop: 0}, 600);
                        return false;
                    }
                }

                var self = this;
                var address = this.quoteBilling;

                var dataJson = {
                    "type": "card",
                    "card": {
                        "type": "credit",
                        "number": this.creditCardNumberBcc(),
                        "holder_name": this.creditCardOwnerBcc(),
                        "exp_month": this.creditCardExpMonthBcc(),
                        "exp_year": this.creditCardExpYearBcc(),
                        "cvv": this.creditCardVerificationNumberBcc(),
                        "billing_address": {
                            "street": address.street[0],
                            "number": address.street[1],
                            "zip_code": address.postcode,
                            "complement": address.street[2],
                            "neighborhood": address.street[3],
                            "city": address.region,
                            "state": address.regionCode,
                            "country": address.countryId
                        }
                    }
                };

                var data = data;
                var event = event;

                function successCallback (card) {
                    self.tokenCreditCard = card.id;
                    self.placeOrder.call(this, data, event);
                }

                function failCallback (fail) {
                    console.log(fail);

                    fullScreenLoader.stopLoader();

                    self.messageContainer.addErrorMessage({
                        message: $t('Cartão inválido. Por favor, verifique os dados digitados e tente novamente')
                    });
                    $("html, body").animate({scrollTop: 0}, 600);
                }

                token.call(this, dataJson, successCallback, failCallback);
            },

            getData: function () {
                return {
                    'method': this.item.method,
                    'additional_data': {
                        'cc_cid': this.creditCardVerificationNumberBcc(),
                        'cc_type': this.creditCardTypeBcc(),
                        'cc_last_4': this.creditCardSavedNumberBcc() ? this.creditCardSavedNumberBcc().substr(-4, 4) : this.creditCardNumberBcc().substr(-4, 4),
                        'cc_exp_year': this.creditCardExpYearBcc(),
                        'cc_exp_month': this.creditCardExpMonthBcc(),
                        'cc_number': this.creditCardNumberBcc(),
                        'cc_owner': this.creditCardOwnerBcc(),
                        'cc_savecard': this.creditCardsavecardBcc() ? 1 : 0,
                        'cc_installments': this.creditCardInstallmentsBcc(),
                        'cc_cc_amount': this.creditCardCcAmountBcc(),
                        'cc_cc_tax_amount': this.creditCardCcTaxAmountBcc(),
                        'cc_saved_card': this.creditSavedCardBcc(),
                        'cc_billet_amount': this.creditCardBilletAmountBcc(),
                        'cc_token_credit_card': this.tokenCreditCard,
                        'billet_buyer_checkbox': this.billetBuyerCheckbox(),
                        'billet_buyer_name': this.billetBuyerName(),
                        'billet_buyer_email': this.billetBuyerEmail(),
                        'billet_buyer_document': this.billetBuyerDocument(),
                        'billet_buyer_street_title': this.billetBuyerStreetTitle(),
                        'billet_buyer_street_number': this.billetBuyerStreetNumber(),
                        'billet_buyer_street_complement': this.billetBuyerStreetComplement(),
                        'billet_buyer_zipcode': this.billetBuyerZipCode(),
                        'billet_buyer_neighborhood': this.billetBuyerNeighborhood(),
                        'billet_buyer_city': this.billetBuyerCity(),
                        'billet_buyer_state': this.billetBuyerState(),
                        'cc_buyer_checkbox': this.creditCardBuyerCheckbox(),
                        'cc_buyer_name': this.creditCardBuyerName(),
                        'cc_buyer_email': this.creditCardBuyerEmail(),
                        'cc_buyer_document': this.creditCardBuyerDocument(),
                        'cc_buyer_street_title': this.creditCardBuyerStreetTitle(),
                        'cc_buyer_street_number': this.creditCardBuyerStreetNumber(),
                        'cc_buyer_street_complement': this.creditCardBuyerStreetComplement(),
                        'cc_buyer_zipcode': this.creditCardBuyerZipCode(),
                        'cc_buyer_neighborhood': this.creditCardBuyerNeighborhood(),
                        'cc_buyer_city': this.creditCardBuyerCity(),
                        'cc_buyer_state': this.creditCardBuyerState(),
                    }
                };
            },

            onInstallmentItemChange: function () {
                if(jQuery('#mundipagg_billet_creditcard_installments option:selected').val() != '') {
                    this.updateTotalWithTax(jQuery('#mundipagg_billet_creditcard_installments option:selected').attr('interest'));
                }
            },

            updateTotalWithTax: function (newTax) {
                if (typeof this.oldInstallmentTax == 'undefined') {
                    this.oldInstallmentTax = 0;
                }
                var total = quote.getTotals()();
                var subTotalIndex = null;
                for (var i = 0, len = total.total_segments.length; i < len; i++) {
                    if (total.total_segments[i].code == "grand_total") {
                        subTotalIndex = i;
                        continue;
                    }
                    if (total.total_segments[i].code != "tax") continue;
                    total.total_segments[i].value = newTax;
                }

                total.total_segments[subTotalIndex].value = +total.total_segments[subTotalIndex].value - this.oldInstallmentTax;
                total.total_segments[subTotalIndex].value = +total.total_segments[subTotalIndex].value + parseFloat(newTax);
                total.tax_amount = parseFloat(newTax);
                this.creditCardCcTaxAmountBcc(newTax * 100);
                total.base_tax_amount = parseFloat(newTax);
                this.oldInstallmentTax = newTax;
                window.checkoutConfig.payment.ccform.installments.value = newTax;
                quote.setTotals(total);
            },

            onSavedCardChange: function() {

                if (jQuery('#mundipagg_billet_creditcard_card').val()) {
                    jQuery('.cardInfo').css('display','none');
                    jQuery('.multibuyerDiv').css('display','none');
                    jQuery('#creditcard-buyer-checkbox-input').prop('checked',false);
                    this.creditCardBuyerCheckbox(false);

                }else{
                    jQuery('.cardInfo').css('display','block');
                    jQuery('#mundipagg_billet_creditcard_buyer_checkbox').css('display','block');

                }
            },
            billetBuyerIsChecked: function(){
                if(this.billetBuyerCheckbox()){
                    return 'display: block;';
                }else{
                    return 'display: none;';
                }
            },
            creditCardBuyerIsChecked: function(){
                if(this.creditCardBuyerCheckbox()){
                    return 'display: block;';
                }else{
                    return 'display: none;';
                }
            },
            getCreditCardBuyerHelpHtml: function () {
                return '<span>' + $t('Add a different buyer to Credit Card') + '</span>';
            },

            getBilletBuyerHelpHtml: function () {
                return '<span>' + $t('Add a different buyer to Billet') + '</span>';
            }

        })
    }
);
