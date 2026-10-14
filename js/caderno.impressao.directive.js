(function() { 'use strict';

angular
	.module("tec.caderno")
	.directive("tecCadernoImpressao", tecCadernoImpressao);

function tecCadernoImpressao() {
	var directive = {
		restrict: 'E',
		templateUrl: 'cadernoImpressao',
		scope: {
			caderno: '='
				
		},
		controller: 'TecCadernoImpressaoController',
		controllerAs: 'vm',
        bindToController: true
	};

	return directive;
}

})();
