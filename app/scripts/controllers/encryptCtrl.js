'use strict';


var encryptCtrl = function ($scope, walletService) {
    $scope.ajaxReq = ajaxReq;


    function init() {

        walletService.wallet = null;

        //FIXME: ng-model not working???
        $scope.newPassword = '';

        $scope.showPass = true;
        $scope.unlockWallet = false;
        $scope.newWallet = null;
        $scope.newWallet_ = {
            fileName: null,
            blob: null,
            downloaded: false,
        };
        $scope.loading = false;
        $scope.showPaperWallet = false;
        $scope.wallet = null;

    }

    init();
    $scope.options = {
        kdf: globalFuncs.kdf,
        n: globalFuncs.scrypt.n
    };

    $scope.networks = {
        ETH: "eth_ethscan",
        ETC: "etc_epool",
        UBQ: "ubq",
        EXP: "exp",
    };


    var network = globalFuncs.urlGet('network') || null;

    if (network) {
        $rootScope.$broadcast('ChangeNode', $scope.networks[network.toUpperCase()] || 0);
    }


    $scope.$watch(function () {
        if (walletService.wallet == null) return null;
        return walletService.wallet.getAddressString();
    }, function () {
        if (walletService.wallet == null) return;
        $scope.wallet = walletService.wallet;
        $scope.unlockWallet = true;

    });

    $scope.reEncrypt = function reEncrypt($event) {

        $event.preventDefault();
        $scope.loading = true;

        const password = $event.target[0].value;

        if ($scope.isStrongPass(password)) {

            var wallet_ = $scope.wallet.toV3(password, $scope.options);

            $scope.newWallet = wallet_;

            $scope.newWallet_ = {
                //blob: globalFuncs.getBlob("text/json;charset=UTF-8", $scope.wallet.toJSON()),
                blob: globalFuncs.getBlob("text/json;charset=UTF-8", wallet_),
                fileName: $scope.wallet.getV3Filename()
            }

        } else {
            $scope.notifier.danger(globalFuncs.errorMsgs[1]);
        }
        $scope.loading = false;


    };


    $scope.isStrongPass = function (password = null) {

        return globalFuncs.isStrongPass(password ? password : $scope.newPassword);
    }

    $scope.downloaded = function () {
        $scope.newWallet_.downloaded = true;
    };

    $scope.continueToPaper = function () {
        $scope.showPaperWallet = true;
    }

    $scope.printQRCode = function () {
        globalFuncs.printPaperWallets(JSON.stringify([{
            address: $scope.wallet.getChecksumAddressString(),
            private: $scope.wallet.getPrivateKeyString()
        }]));
    };

    $scope.getAddress = function () {

        init();
    }


}
module.exports = encryptCtrl;
